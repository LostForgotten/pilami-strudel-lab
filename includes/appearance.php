<?php
if (!defined('ABSPATH')) { exit; }

function pilami_strudel_preset_defaults() {
    $presets = array(
        'debut' => array('label' => '🌱 Débuter', 'code' => 'setcps(.65)
stack(
  s("bd sd").gain(.72),
  s("hh*4").gain(.28)
)', 'mode' => 'code'),
        'batterie' => array('label' => '🥁 Batterie', 'code' => 'setcps(.75)
stack(
  s("bd*4").gain(.78),
  s("[~ sd]*2").gain(.55),
  s("hh*8").gain(.24)
)', 'mode' => 'code'),
        'ambient' => array('label' => '🌌 Ambient', 'code' => 'setcps(.35)
stack(
  note("<c3 eb3 g3 bb3>")
    .s("sine")
    .room(.8)
    .delay(.35)
    .gain(.48),
  note("<g4 bb4 c5 eb5>/2")
    .s("triangle")
    .room(.9)
    .gain(.22)
)', 'mode' => 'code'),
        'techno' => array('label' => '⚙️ Techno', 'code' => 'setcps(.72)
stack(
  s("kick909*4").gain(.76),
  s("[~ 808sd]*2").gain(.52),
  s("808oh*8").gain(.22)
)', 'mode' => 'code'),
        'melodie' => array('label' => '🎹 Mélodie', 'code' => 'setcps(.55)
n("0 2 4 7 4 2")
  .scale("C4:minor")
  .s("triangle")
  .room(.4)
  .gain(.48)', 'mode' => 'code'),
        'surprise' => array('label' => '🎲 Surprise', 'code' => 'setcps(.68)
stack(
  s("bd [~ bd] sd bd").gain(.62),
  n("[0 2 4 7]*2")
    .scale("D3:minor")
    .s("sawtooth")
    .lpf(900)
    .room(.5)
    .sometimes(x => x.rev())
    .gain(.3)
)', 'mode' => 'code'),
        'preset7' => array('label' => 'Preset 7', 'code' => '', 'mode' => 'code'),
        'preset8' => array('label' => 'Preset 8', 'code' => '', 'mode' => 'code'),
        'preset9' => array('label' => 'Preset 9', 'code' => '', 'mode' => 'code'),
        'preset10' => array('label' => 'Preset 10', 'code' => '', 'mode' => 'code'),
    );
    foreach (array_keys($presets) as $section) {
        for ($slot = 2; $slot <= 10; $slot++) {
            $presets[$section . '_' . $slot] = array('label' => 'Preset ' . $slot, 'code' => '', 'mode' => 'code');
        }
    }
    return $presets;
}
function pilami_strudel_section_keys() {
    return array('debut','batterie','ambient','techno','melodie','surprise','preset7','preset8','preset9','preset10');
}
function pilami_strudel_section_preset_keys($section) {
    $keys = array($section);
    for ($slot=2; $slot<=10; $slot++) { $keys[] = $section . '_' . $slot; }
    return $keys;
}
function pilami_strudel_section_labels($options) {
    $labels = array();
    foreach (pilami_strudel_section_keys() as $key) {
        $value = isset($options['section_labels'][$key]) && is_string($options['section_labels'][$key]) ? sanitize_textarea_field($options['section_labels'][$key]) : '';
        $labels[$key] = $value !== '' ? $value : $options['preset_definitions'][$key]['label'];
    }
    return $labels;
}
function pilami_strudel_visible_preset_keys($options) {
    $keys = array();
    foreach (pilami_strudel_section_keys() as $section) {
        if (!in_array($section,$options['presets'],true)) { continue; }
        foreach (pilami_strudel_section_preset_keys($section) as $key) {
            $preset = $options['preset_definitions'][$key];
            if (trim($preset['code']) !== '' && !(function_exists('pilami_hydra_is_visual') && pilami_hydra_is_visual($preset['code']))) { $keys[] = $key; }
        }
    }
    return $keys;
}
function pilami_strudel_render_preset_sections($options, $preview = false) {
    $labels = pilami_strudel_section_labels($options);
    $available = pilami_strudel_visible_preset_keys($options);
    foreach ($labels as $section=>$label) {
        $children = pilami_strudel_section_preset_keys($section);
        if (!$preview && !array_intersect($children,$available)) { continue; }
        ?>
        <div class="pilami-preset-section" data-preset-section="<?php echo esc_attr($section); ?>" style="--pilami-category-color:<?php echo esc_attr($options['section_colors'][$section]); ?>">
            <button type="button" data-section-toggle aria-expanded="false"><span data-section-name><?php echo esc_html($label); ?></span><span aria-hidden="true"> ▾</span></button>
            <ul class="pilami-preset-list" data-section-list hidden aria-label="<?php echo esc_attr('Presets — '.$label); ?>">
            <?php foreach ($children as $key) { if (!$preview && !in_array($key,$available,true)) { continue; } ?>
                <li><button type="button" <?php echo $preview ? 'data-preview-preset' : 'data-preset'; ?>="<?php echo esc_attr($key); ?>"><?php echo esc_html($options['preset_definitions'][$key]['label']); ?></button></li>
            <?php } ?>
            </ul>
        </div>
        <?php
    }
}
function pilami_strudel_role_colors() {
    return array('color_play' => '#609e88', 'color_stop' => '#bb7580', 'color_reset' => '#b99a62', 'color_utility' => '#739bc0', 'color_save' => '#6fa3a5', 'color_preset' => '#a48ac3');
}
function pilami_strudel_category_color($name) {
    $palette = array('#a48ac3', '#739bc0', '#6fa3a5', '#b99a62', '#bb7580', '#609e88');
    $known = array('Fractales' => 0, 'Géométrie' => 1, 'Textures' => 2, 'Imports' => 3, 'Audio réactif' => 4);
    return $palette[$known[$name] ?? (hexdec(substr(hash('sha256', $name), 0, 4)) % count($palette))];
}
function pilami_strudel_section_colors($input = array()) {
    $palette = array('#609e88','#b99a62','#a48ac3','#739bc0','#6fa3a5','#bb7580');
    $colors = array();
    foreach (pilami_strudel_section_keys() as $index => $key) {
        $colors[$key] = isset($input[$key]) && is_string($input[$key]) ? sanitize_hex_color($input[$key]) : null;
        $colors[$key] = $colors[$key] ?: $palette[$index % count($palette)];
    }
    return $colors;
}
function pilami_strudel_hydra_category_color($term, $options) {
    $color = $options['hydra_category_colors'][$term->term_id] ?? null;
    return is_string($color) && sanitize_hex_color($color) ? sanitize_hex_color($color) : pilami_strudel_category_color($term->name);
}
function pilami_strudel_appearance_defaults() {
    return array(
        'width' => 1500, 'editor_height' => 250, 'font_size' => 16, 'spacing' => 18, 'radius' => 12,
        'editor_bg' => '#f7f9fc', 'editor_text' => '#172b42', 'accent' => '#4676ad',
        'panel_bg' => '#f7f9fc', 'panel_text' => '#172b42', 'custom_palette' => 0,
        'layout' => 'stack', 'show_intro' => 1, 'show_help' => 1, 'show_saves' => 1, 'show_recording' => 1, 'saves_open' => 1,
        'intro' => 'Crée de la musique avec quelques lignes de code. Choisis un exemple, lance la lecture, puis modifie librement le code.',
        'subtitle' => 'Tout fonctionne directement dans ton navigateur : rien à installer.',
        'help' => 'Change un chiffre, ajoute un son ou supprime une note, puis clique sur Lecture / Update.',
        'saves_title' => 'Mes essais', 'recording_title' => 'Enregistrer le son',
        'preset_definitions' => pilami_strudel_preset_defaults(), 'section_labels' => array_intersect_key(pilami_strudel_preset_labels(),array_flip(pilami_strudel_section_keys())),
        'role_colors_enabled' => 1, 'section_colors' => pilami_strudel_section_colors(), 'hydra_category_colors' => array(),
        'color_play' => '#609e88',
        'color_stop' => '#bb7580',
        'color_reset' => '#b99a62',
        'color_utility' => '#739bc0',
        'color_save' => '#6fa3a5',
        'color_preset' => '#a48ac3',
        'seq_image_empty' => 'https://pilami.fr/wp-content/uploads/2026/10/empty.png',
        'seq_image_recall' => 'https://pilami.fr/wp-content/uploads/2026/10/recall.png',
        'seq_image_morph' => 'https://pilami.fr/wp-content/uploads/2026/10/morph.png',
        'seq_image_active' => 'https://pilami.fr/wp-content/uploads/2026/10/active.png',
        'initial_preset' => 'debut', 'presets' => array('debut', 'batterie', 'ambient', 'techno', 'melodie', 'surprise'),
    );
}
function pilami_strudel_preset_labels($options = null) {
    $definitions = $options ? $options['preset_definitions'] : pilami_strudel_preset_defaults();
    return array_map(function ($preset) { return $preset['label']; }, $definitions);
}
function pilami_strudel_normalize_presets($input) {
    $definitions = pilami_strudel_preset_defaults();
    foreach ($definitions as $key => &$preset) {
        if (!isset($input[$key]) || !is_array($input[$key])) { continue; }
        $entry = $input[$key];
        if (isset($entry['label']) && is_string($entry['label'])) {
            $label = sanitize_textarea_field($entry['label']);
            if ($label !== '') { $preset['label'] = $label; }
        }
        // Code must remain verbatim: mini-notation, quotes and HTML-like strings are valid JavaScript.
        // Escape at output, never execute on the server. WordPress unslashes Settings API input already.
        if (isset($entry['code']) && is_string($entry['code'])) { $preset['code'] = $entry['code']; }
        $preset['mode'] = 'code'; // Legacy random actions become ordinary code presets.
    }
    unset($preset);
    return $definitions;
}
function pilami_strudel_initial_preset($options) {
    foreach (array_merge(array($options['initial_preset']), pilami_strudel_visible_preset_keys($options)) as $key) {
        if (in_array($key, pilami_strudel_visible_preset_keys($options), true) && isset($options['preset_definitions'][$key])) {
            $preset = $options['preset_definitions'][$key];
            if ($preset['mode'] === 'code' && trim($preset['code']) !== '') { return $key; }
        }
    }
    return 'debut';
}
function pilami_strudel_sanitize_appearance($input) {
    $defaults = pilami_strudel_appearance_defaults();
    if (!is_array($input)) { return $defaults; }
    if (!empty($input['_reset'])) {
        $current = pilami_strudel_appearance();
        foreach (array('preset_definitions', 'section_labels', 'presets', 'initial_preset') as $key) { $defaults[$key] = $current[$key]; }
        return $defaults;
    }
    $out = $defaults;
    foreach (array('width' => array(320,1800), 'editor_height' => array(160,1000), 'font_size' => array(12,24), 'spacing' => array(4,36), 'radius' => array(0,28)) as $key => $bounds) {
        if (isset($input[$key]) && is_scalar($input[$key]) && is_numeric($input[$key])) { $out[$key] = max($bounds[0], min($bounds[1], (int)$input[$key])); }
    }
    foreach (array_merge(array('editor_bg', 'editor_text', 'accent', 'panel_bg', 'panel_text'), array_keys(pilami_strudel_role_colors())) as $key) {
        $color = isset($input[$key]) && is_string($input[$key]) ? sanitize_hex_color($input[$key]) : null;
        $out[$key] = $color ?: $defaults[$key];
    }
    foreach (array('role_colors_enabled','custom_palette','show_intro','show_help','show_saves','show_recording','saves_open') as $key) { $out[$key] = isset($input[$key]) && is_scalar($input[$key]) && (string)$input[$key] === '1' ? 1 : 0; }
    $out['section_colors'] = pilami_strudel_section_colors(isset($input['section_colors']) && is_array($input['section_colors']) ? $input['section_colors'] : array());
    if (isset($input['hydra_category_colors']) && is_array($input['hydra_category_colors'])) {
        foreach ($input['hydra_category_colors'] as $id => $color) {
            if (ctype_digit((string)$id) && (int)$id > 0 && is_string($color) && sanitize_hex_color($color)) { $out['hydra_category_colors'][(int)$id] = sanitize_hex_color($color); }
        }
    }
    // PNG du sequenceur : URLs remplaçables depuis Apparence, aucun changement de plugin requis.
    foreach (array('seq_image_empty','seq_image_recall','seq_image_morph','seq_image_active') as $key) {
        $url = isset($input[$key]) && is_string($input[$key]) ? esc_url_raw(trim($input[$key]), array('https','http')) : '';
        $out[$key] = $url !== '' ? $url : $defaults[$key];
    }
    $out['layout'] = isset($input['layout']) && $input['layout'] === 'columns' ? 'columns' : 'stack';
    foreach (array('subtitle','help','saves_title','recording_title') as $key) {
        if (isset($input[$key]) && is_string($input[$key])) { $out[$key] = sanitize_textarea_field($input[$key]); }
    }
    if (isset($input['intro']) && is_string($input['intro'])) { $out['intro'] = wp_kses_post($input['intro']); }
    if (isset($input['presets']) && is_array($input['presets'])) {
        $out['presets'] = array_values(array_intersect(pilami_strudel_section_keys(), array_filter($input['presets'], 'is_string')));
    } else { $out['presets'] = array(); }
    $out['preset_definitions'] = pilami_strudel_normalize_presets(isset($input['preset_definitions']) && is_array($input['preset_definitions']) ? $input['preset_definitions'] : array());
    $out['section_labels'] = pilami_strudel_section_labels(array_merge($out,array('section_labels'=>isset($input['section_labels']) && is_array($input['section_labels']) ? $input['section_labels'] : array())));
    $out['initial_preset'] = isset($input['initial_preset']) && is_string($input['initial_preset']) ? $input['initial_preset'] : 'debut';
    $out['initial_preset'] = pilami_strudel_initial_preset($out);
    return $out;
}
function pilami_strudel_appearance() {
    $saved = get_option('pilami_strudel_appearance', array());
    // Preserve defaults for an existing installation that has never saved this form.
    $options = array_merge(pilami_strudel_appearance_defaults(), is_array($saved) ? $saved : array());
    if (!is_array($saved) || !isset($saved['section_labels'])) { $options['section_labels'] = array(); }
    $options['section_colors'] = pilami_strudel_section_colors(is_array($options['section_colors']) ? $options['section_colors'] : array());
    if (!is_array($options['hydra_category_colors'])) { $options['hydra_category_colors'] = array(); }
    $options['preset_definitions'] = pilami_strudel_normalize_presets($options['preset_definitions']);
    $options['section_labels'] = pilami_strudel_section_labels($options);
    $options['initial_preset'] = pilami_strudel_initial_preset($options);
    return $options;
}
function pilami_strudel_appearance_style($options) {
    $css = array('--pilami-width:' . (int)$options['width'] . 'px', '--pilami-editor-height:' . (int)$options['editor_height'] . 'px', '--pilami-editor-max:' . max(560,(int)$options['editor_height']) . 'px', '--pilami-font-size:' . (int)$options['font_size'] . 'px', '--pilami-spacing:' . (int)$options['spacing'] . 'px', '--pilami-radius:' . (int)$options['radius'] . 'px');
    foreach (array_merge(array('editor_bg','editor_text','accent','panel_bg','panel_text'), array_keys(pilami_strudel_role_colors())) as $key) { $css[] = '--pilami-' . str_replace('_','-',$key) . ':' . (sanitize_hex_color($options[$key]) ?: pilami_strudel_appearance_defaults()[$key]); }
    foreach (array('empty','recall','morph','active') as $name) {
        $key = 'seq_image_' . $name;
        $url = isset($options[$key]) && is_string($options[$key]) ? esc_url_raw($options[$key], array('https','http')) : '';
        // Les guillemets sont encodés pour empêcher une rupture de url("...") dans le style inline.
        $safe = str_replace(array('\\','"',"\n","\r"), array('%5C','%22','',''), $url);
        $css[] = '--pilami-seq-image-' . $name . ':url("' . $safe . '")';
    }
    return implode(';', $css);
}
add_action('admin_init', function () {
    register_setting('pilami_strudel_appearance_group', 'pilami_strudel_appearance', array('type' => 'array', 'sanitize_callback' => 'pilami_strudel_sanitize_appearance', 'show_in_rest' => false));
});
add_action('admin_menu', function () {
    add_options_page('Strudel — Apparence', 'Strudel — Apparence', 'manage_options', 'pilami-strudel-appearance', 'pilami_strudel_appearance_page');
});
add_filter('plugin_action_links_' . plugin_basename(dirname(__DIR__) . '/pilami-strudel-lab.php'), function ($links) {
    array_unshift($links, '<a href="' . esc_url(admin_url('options-general.php?page=pilami-strudel-appearance')) . '">Apparence</a>');
    $links[] = '<a href="' . esc_url(admin_url('options-general.php?page=pilami-strudel-appearance#pilami-version-history')) . '">Historique</a>';
    return $links;
});
add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'settings_page_pilami-strudel-appearance') { return; }
    $url = plugin_dir_url(dirname(__DIR__) . '/pilami-strudel-lab.php');
    wp_enqueue_style('pilami-strudel-appearance-preview', $url . 'assets/pilami-strudel-0.6.0.css', array(), '0.6.0');
    wp_enqueue_style('pilami-strudel-admin', $url . 'assets/pilami-admin-0.20.0.css', array(), '0.20.0');
    wp_enqueue_style('pilami-strudel-menus', $url . 'assets/pilami-menus-0.11.0.css', array(), '0.11.0');
    wp_enqueue_script('pilami-strudel-menus', $url . 'assets/pilami-menus-0.11.1.js', array(), '0.11.1', true);
    wp_enqueue_style('pilami-interface-colors', $url . 'assets/pilami-colors-0.21.0.css', array('pilami-strudel-appearance-preview','pilami-strudel-menus'), '0.21.0');
    wp_enqueue_script('pilami-strudel-admin', $url . 'assets/pilami-admin-0.21.0.js', array('pilami-strudel-menus'), '0.21.0', true);
});
function pilami_strudel_appearance_input($key, $value, $type = 'text', $extra = '') {
    echo '<input id="pilami-' . esc_attr($key) . '" name="pilami_strudel_appearance[' . esc_attr($key) . ']" type="' . esc_attr($type) . '" value="' . esc_attr($value) . '" ' . $extra . '>';
}
function pilami_strudel_appearance_check($key, $options, $label) {
    echo '<label class="pilami-admin-check"><input type="checkbox" name="pilami_strudel_appearance[' . esc_attr($key) . ']" value="1" ' . checked(!empty($options[$key]), true, false) . '> ' . esc_html($label) . '</label>';
}
function pilami_strudel_appearance_page() {
    if (!current_user_can('manage_options')) { return; }
    $o = pilami_strudel_appearance();
    ?>
    <div class="wrap pilami-appearance-admin">
        <h1>Strudel — Apparence</h1>
        <?php pilami_strudel_lab_render_history(); ?>
        <p>Les presets visuels ont maintenant leur bibliothèque dans <a href="<?php echo esc_url(admin_url('edit.php?post_type=pilami_hydra')); ?>">Hydra — Presets</a>, avec ajout de presets et catégories. Modifie tes visuels dans cette bibliothèque. Les anciens emplacements ci-dessous sont conservés pour retrouver leur code.</p>
        <p>Personnalise le laboratoire affiché par <code>[pilami_strudel]</code>. L’aperçu change immédiatement ; clique sur « Enregistrer les modifications » pour appliquer tes choix au site.</p>
        <?php settings_errors(); ?>
        <div class="pilami-admin-layout">
        <form action="options.php" method="post" data-appearance-form>
            <?php settings_fields('pilami_strudel_appearance_group'); ?>
            <section class="pilami-admin-card"><h2>Dimensions et disposition</h2>
                <div class="pilami-admin-fields">
                <?php foreach (array('width'=>array('Largeur maximale (px)',320,1800), 'editor_height'=>array('Hauteur de l’éditeur (px)',160,1000), 'font_size'=>array('Taille du code (px)',12,24), 'spacing'=>array('Espacement des panneaux (px)',4,36), 'radius'=>array('Arrondi des panneaux (px)',0,28)) as $key=>$field) { ?>
                    <label for="pilami-<?php echo esc_attr($key); ?>"><?php echo esc_html($field[0]); ?><?php pilami_strudel_appearance_input($key,$o[$key],'number','min="'.$field[1].'" max="'.$field[2].'" step="1" required'); ?></label>
                <?php } ?>
                <label for="pilami-layout">Panneaux de sauvegarde et d’enregistrement<select id="pilami-layout" name="pilami_strudel_appearance[layout]"><option value="stack" <?php selected($o['layout'],'stack'); ?>>L’un sous l’autre</option><option value="columns" <?php selected($o['layout'],'columns'); ?>>Côte à côte sur grand écran</option></select></label>
                </div><p class="description">La largeur reste limitée par celle de ta page Blocksy. Sur mobile, les panneaux reviennent sur une colonne.</p>
            </section>
            <section class="pilami-admin-card"><h2>Couleurs</h2><div class="pilami-admin-fields">
                <?php foreach(array('editor_bg'=>'Fond de l’éditeur','editor_text'=>'Texte du code','accent'=>'Couleur des curseurs et accents','panel_bg'=>'Fond des panneaux','panel_text'=>'Texte des panneaux') as $key=>$label) { ?><label for="pilami-<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?><?php pilami_strudel_appearance_input($key,$o[$key],'color'); ?></label><?php } ?>
                </div><?php pilami_strudel_appearance_check('custom_palette',$o,'Appliquer mes couleurs de fond et de texte aux panneaux'); ?><p class="description">Sans cette option, les fonds suivent ton thème, y compris son mode sombre. Les couleurs de l’éditeur et les accents par fonction ci-dessous restent indépendants.</p>
            </section>
            <section class="pilami-admin-card"><h2>Couleurs des boutons et catégories</h2>
                <?php pilami_strudel_appearance_check('role_colors_enabled',$o,'Distinguer les boutons et catégories avec des couleurs douces'); ?>
                <p class="description">La couleur teinte légèrement le fond et la bordure. Le texte reste lisible en clair et en sombre. Désactive cette option pour retrouver les boutons du thème.</p>
                <div class="pilami-admin-fields">
                <?php foreach(array('color_play'=>'Lecture / Update','color_stop'=>'Arrêt, suppression et enregistrement audio','color_reset'=>'Réinitialiser','color_utility'=>'Outils, liens et fenêtres','color_save'=>'Sauvegarder / Mettre à jour un preset','color_preset'=>'Presets sans catégorie') as $key=>$label) { ?><label for="pilami-<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?><?php pilami_strudel_appearance_input($key,$o[$key],'color'); ?></label><?php } ?>
                </div>
                <p>La couleur de chaque section Strudel se règle dans « Sections et listes de presets » ci-dessous.</p>
                <h3>Catégories Hydra</h3>
                <div class="pilami-admin-fields">
                <?php $color_terms = get_terms(array('taxonomy'=>'pilami_hydra_cat','hide_empty'=>false));
                if (!is_wp_error($color_terms)) { foreach($color_terms as $term) { $color=pilami_strudel_hydra_category_color($term,$o); ?>
                    <label for="pilami-hydra-color-<?php echo (int)$term->term_id; ?>"><?php echo esc_html($term->name); ?><input type="color" id="pilami-hydra-color-<?php echo (int)$term->term_id; ?>" name="pilami_strudel_appearance[hydra_category_colors][<?php echo (int)$term->term_id; ?>]" value="<?php echo esc_attr($color); ?>" data-hydra-color-name="<?php echo esc_attr($term->name); ?>"></label>
                <?php } } ?>
                </div>
                <p class="description">Chaque preset reprend la teinte de sa catégorie. Si un preset appartient à plusieurs catégories, il suit celle choisie dans le filtre ; « Toutes les catégories » privilégie la première catégorie par ordre alphabétique hors « Imports » ; « Imports » sert de couleur par défaut. Les nouvelles catégories reçoivent automatiquement une couleur.</p>
            </section>
            <section class="pilami-admin-card"><h2>Textes</h2><label for="pilami-intro"><strong>Introduction</strong></label>
                <?php wp_editor($o['intro'],'pilami-intro',array('textarea_name'=>'pilami_strudel_appearance[intro]','textarea_rows'=>4,'media_buttons'=>false,'teeny'=>true)); ?>
                <div class="pilami-admin-fields">
                <?php foreach(array('subtitle'=>'Sous-titre','help'=>'Conseil sous le laboratoire','saves_title'=>'Titre des sauvegardes','recording_title'=>'Titre de l’enregistrement') as $key=>$label) { ?><label for="pilami-<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?><?php pilami_strudel_appearance_input($key,$o[$key],'text','class="regular-text"'); ?></label><?php } ?>
                </div>
            </section>
            <section class="pilami-admin-card"><h2>Éléments visibles</h2>
                <?php foreach(array('show_intro'=>'Introduction et sous-titre','show_help'=>'Conseil et raccourci clavier','show_saves'=>'Panneau « Mes essais »','show_recording'=>'Panneau d’enregistrement WAV','saves_open'=>'Ouvrir « Mes essais » au chargement') as $key=>$label) { pilami_strudel_appearance_check($key,$o,$label); } ?>
                <p class="description">Masquer un panneau ne supprime aucune sauvegarde. Les curseurs apparaissent automatiquement si le morceau utilise slider().</p>
            </section>
            <section class="pilami-admin-card" id="pilami-sequenceur-images"><h2>Images du séquenceur à grille</h2>
                <p class="description">Les quatre PNG sont chargés depuis la médiathèque WordPress. Tu peux remplacer les images ou coller d’autres URL ici, sans republier le plugin. Les visiteurs voient tous les mêmes images, mais les patterns restent locaux à leur navigateur.</p>
                <div class="pilami-admin-fields">
                <?php foreach (array('empty'=>'Case vide', 'recall'=>'Rappel', 'morph'=>'Morphing', 'active'=>'Case déclenchée par la tête de lecture') as $type=>$label) {
                    $key = 'seq_image_' . $type;
                ?>
                    <label for="pilami-<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?>
                    <input id="pilami-<?php echo esc_attr($key); ?>" name="pilami_strudel_appearance[<?php echo esc_attr($key); ?>]" type="url" value="<?php echo esc_attr($o[$key]); ?>" style="width:100%;max-width:580px" required>
                    <img src="<?php echo esc_url($o[$key]); ?>" alt="Aperçu : <?php echo esc_attr($label); ?>" width="45" height="45" style="object-fit:contain;display:block;margin-top:5px">
                    </label>
                <?php } ?>
                </div>
                <p class="description">Si tu modifies un fichier en conservant son URL (avec une extension de remplacement de médias), pense à vider le cache WordPress / Cloudflare / Firefox pour voir la nouvelle image.</p>
            </section>
            <section class="pilami-admin-card"><h2>Sections et listes de presets</h2>
                <p>Jusqu’à 10 sections, chacune contenant jusqu’à 10 presets. Sur le site, les listes s’ouvrent au survol ou au clic.</p>
                <p class="description">Tes anciens presets sont conservés dans le premier emplacement de leur section. Un clic sur un preset charge son code ; Lecture / Update le lance.</p>
                <?php $labels=pilami_strudel_section_labels($o); $section_number=0; foreach($labels as $section=>$label) { $section_number++; ?>
                <details class="pilami-admin-section" data-section-editor="<?php echo esc_attr($section); ?>">
                    <summary>Section <?php echo (int)$section_number; ?> — <span data-section-title><?php echo esc_html($label); ?></span></summary>
                    <label class="pilami-admin-check"><input type="checkbox" name="pilami_strudel_appearance[presets][]" value="<?php echo esc_attr($section); ?>" <?php checked(in_array($section,$o['presets'],true)); ?>> Afficher cette section</label>
                    <label>Nom de la section<input type="text" name="pilami_strudel_appearance[section_labels][<?php echo esc_attr($section); ?>]" value="<?php echo esc_attr($label); ?>" data-section-label></label>
                    <label>Couleur de la section et de ses presets<input type="color" name="pilami_strudel_appearance[section_colors][<?php echo esc_attr($section); ?>]" value="<?php echo esc_attr($o['section_colors'][$section]); ?>" data-section-color></label>
                    <?php $slot=0; foreach(pilami_strudel_section_preset_keys($section) as $key) { $slot++; $preset=$o['preset_definitions'][$key]; ?>
                    <details class="pilami-admin-preset" data-preset-editor="<?php echo esc_attr($key); ?>" <?php if($slot>1 && trim($preset['code'])==='') echo 'hidden'; ?>>
                        <summary>Preset <?php echo (int)$slot; ?> — <span data-preset-title><?php echo esc_html($preset['label']); ?></span></summary>
                        <label>Nom du preset<input type="text" name="pilami_strudel_appearance[preset_definitions][<?php echo esc_attr($key); ?>][label]" value="<?php echo esc_attr($preset['label']); ?>" data-preset-label></label>
                        <label data-preset-code-field>Code Strudel (ou ancien visuel conservé)<textarea rows="9" spellcheck="false" autocapitalize="off" autocomplete="off" name="pilami_strudel_appearance[preset_definitions][<?php echo esc_attr($key); ?>][code]" data-preset-code><?php echo esc_html($preset['code']); ?></textarea></label>
                        <p class="description" data-preset-empty hidden>Ajoute du code pour rendre ce preset disponible dans la liste.</p>
                        <button type="button" class="button" data-preset-remove>Vider ce preset</button>
                    </details>
                    <?php } ?>
                    <button type="button" class="button" data-preset-add>Ajouter un preset</button>
                    <p class="description">Les presets sans code et les anciens visuels Hydra sont masqués dans la liste Strudel du site. Ajoute tes nouveaux visuels dans Hydra — Presets.</p>
                </details>
                <?php } ?>
                <label for="pilami-initial_preset">Preset de départ<select id="pilami-initial_preset" name="pilami_strudel_appearance[initial_preset]"><?php foreach($labels as $section=>$label) { ?><optgroup label="<?php echo esc_attr($label); ?>" data-initial-section="<?php echo esc_attr($section); ?>"><?php foreach(pilami_strudel_section_preset_keys($section) as $key) { ?><option value="<?php echo esc_attr($key); ?>" <?php selected($key,$o['initial_preset']); ?>><?php echo esc_html($o['preset_definitions'][$key]['label']); ?></option><?php } ?></optgroup><?php } ?></select></label>
                <p class="description">Un brouillon enregistré dans le navigateur reste prioritaire. Masquer une section conserve tous ses scripts.</p>
            </section>
            <?php submit_button('Enregistrer les modifications'); ?>
            <button type="submit" class="button" name="pilami_strudel_appearance[_reset]" value="1" data-appearance-reset>Rétablir l’apparence d’origine</button><p class="description">Tes noms, codes et choix de presets sont conservés.</p>
        </form>
        <aside class="pilami-admin-preview"><h2>Aperçu de l’apparence</h2><label>Mode de l’aperçu <select data-preview-theme-select><option value="light">Clair</option><option value="dark">Sombre</option></select></label><p>Simulation visuelle, sans lecture audio. Vérifie ensuite ta page Strudel.</p>
            <div class="pilami-strudel-lab" data-appearance-preview style="<?php echo esc_attr(pilami_strudel_appearance_style($o)); ?>" data-layout="<?php echo esc_attr($o['layout']); ?>" data-custom-palette="<?php echo esc_attr($o['custom_palette']); ?>" data-role-colors="<?php echo esc_attr($o['role_colors_enabled']); ?>" data-preview-theme="light">
                <div class="pilami-strudel-intro" data-preview-intro><p data-preview-intro-text></p><p class="pilami-strudel-muted" data-preview-subtitle></p></div>
                <div class="pilami-strudel-presets"><?php pilami_strudel_render_preset_sections($o,true); ?></div>
                <div class="pilami-strudel-transport"><button type="button" class="pilami-play" data-color-role="play">▶ Lecture / Update</button><button type="button" data-color-role="stop">■ Stop</button><button type="button" data-color-role="reset">↺ Réinitialiser</button><button type="button" data-color-role="utility">🔗 Copier le lien</button></div>
                <label class="pilami-strudel-volume">Volume <input type="range" value="60" aria-label="Volume de l’aperçu"><output>60 %</output></label>
                <div class="pilami-strudel-editor-wrap"><textarea class="pilami-strudel-code" readonly aria-label="Aperçu du code">setcpm(70)
note("c4 e4 g4 c5")
  .s("gm_piano")
  .gain(slider(.6,0,1))</textarea></div>
                <div class="pilami-strudel-panels"><details class="pilami-strudel-tools" data-preview-saves open><summary data-preview-saves-title></summary><p>Sauvegarde tes essais dans ce navigateur.</p><div class="pilami-tools-row"><button type="button" data-color-role="save">Sauvegarder</button><button type="button" data-color-role="utility">Exporter le code</button></div></details><div class="pilami-strudel-tools pilami-recording" data-preview-recording><h3 data-preview-recording-title></h3><p>WAV stéréo, 5 min maximum.</p><button type="button" data-color-role="stop">● Enregistrer</button></div></div>
                <div class="pilami-hydra-preview"><h3>Presets Hydra</h3><div class="pilami-strudel-presets">
                <?php if (!is_wp_error($color_terms)) { foreach ($color_terms as $term) { ?><button type="button" data-preview-hydra-category="<?php echo esc_attr($term->name); ?>" style="--pilami-category-color:<?php echo esc_attr(pilami_strudel_hydra_category_color($term,$o)); ?>"><?php echo esc_html($term->name); ?></button><?php } } ?>
                    <button type="button" data-preview-hydra-category="">Sans catégorie</button>
                </div></div>
                <div class="pilami-strudel-help" data-preview-help></div>
            </div>
        </aside></div>
    </div>
    <?php
}
