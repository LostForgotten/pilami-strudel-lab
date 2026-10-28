<?php
if (!defined('ABSPATH')) { exit; }

function pilami_hydra_is_visual($code) {
    return is_string($code) && preg_match('/\binitHydra\s*\(|\b(?:osc|noise|shape|voronoi|src)\s*\([\s\S]*\.out\s*\(/', $code) &&
        !preg_match('/\b(?:s|sound|note|n|stack|setcps|setcpm|samples|pianoroll|_punchcard)\s*\(/', $code);
}
function pilami_hydra_register_catalog() {
    register_post_type('pilami_hydra', array(
        'labels' => array('name' => 'Hydra — Presets', 'singular_name' => 'Preset Hydra', 'add_new' => 'Ajouter un preset', 'add_new_item' => 'Ajouter un preset Hydra', 'edit_item' => 'Modifier le preset Hydra', 'all_items' => 'Tous les presets Hydra', 'search_items' => 'Rechercher un preset Hydra'),
        'public' => false, 'show_ui' => true, 'show_in_menu' => 'options-general.php', 'show_in_rest' => false,
        'supports' => array('title'), 'map_meta_cap' => false,
        'capabilities' => array_fill_keys(array('edit_post','read_post','delete_post','edit_posts','edit_others_posts','publish_posts','read_private_posts','delete_posts','delete_private_posts','delete_published_posts','delete_others_posts','edit_private_posts','edit_published_posts','create_posts'), 'manage_options'),
    ));
    register_taxonomy('pilami_hydra_cat', 'pilami_hydra', array(
        'labels' => array('name' => 'Catégories Hydra', 'singular_name' => 'Catégorie Hydra', 'add_new_item' => 'Ajouter une catégorie'),
        'public' => false, 'show_ui' => true, 'show_admin_column' => true, 'hierarchical' => true,
        'capabilities' => array('manage_terms' => 'manage_options', 'edit_terms' => 'manage_options', 'delete_terms' => 'manage_options', 'assign_terms' => 'manage_options'),
    ));
}
add_action('init', 'pilami_hydra_register_catalog', 8);
function pilami_hydra_insert_preset($key, $label, $code, $category) {
    $existing = get_posts(array('post_type' => 'pilami_hydra', 'post_status' => array('publish','draft','trash'), 'numberposts' => 1, 'meta_key' => '_pilami_source_key', 'meta_value' => $key, 'fields' => 'ids'));
    if ($existing && get_post_meta($existing[0], '_pilami_catalog_ready', true) === '1') { return true; }
    $id = $existing ? $existing[0] : wp_insert_post(array('post_type' => 'pilami_hydra', 'post_status' => 'publish', 'post_title' => wp_slash($label)), true);
    if (is_wp_error($id) || !$id) { return false; }
    update_post_meta($id, '_pilami_source_key', $key);
    update_post_meta($id, '_pilami_hydra_code', wp_slash($code));
    if (get_post_meta($id, '_pilami_hydra_code', true) !== $code) { return false; }
    $term = term_exists($category, 'pilami_hydra_cat');
    if (!$term) { $term = wp_insert_term($category, 'pilami_hydra_cat'); }
    if (is_wp_error($term)) { return false; }
    $assigned = wp_set_object_terms($id, array((int) $term['term_id']), 'pilami_hydra_cat');
    if (is_wp_error($assigned)) { return false; }
    update_post_meta($id, '_pilami_catalog_ready', '1');
    return get_post_meta($id, '_pilami_catalog_ready', true) === '1';
}
function pilami_hydra_migrate_catalog() {
    if (get_option('pilami_hydra_catalog_version') === '1') { return; }
    $ok = true;
    $old = pilami_strudel_appearance();
    $labels = pilami_strudel_section_labels($old);
    foreach ($old['preset_definitions'] as $key => $preset) {
        if (!pilami_hydra_is_visual($preset['code'])) { continue; }
        $section = explode('_', $key)[0];
        $ok = pilami_hydra_insert_preset('legacy-' . $key, $preset['label'], $preset['code'], $labels[$section] ?? 'Mes visuels') && $ok;
    }
    $seeds = array(
        array('ondes','Ondes colorées',"await initHydra()\nvar Vitesse = H(slider(0.08, 0, 0.3, 0.001))\nvar Couleur = H(slider(1.4, 0, 4, 0.01))\nosc(20, () => Vitesse(), () => Couleur())\n.rotate(0, 0.1)\n.out(o0)",'Géométrie'),
        array('mandala','Mandala',"await initHydra()\nvar Facettes = H(slider(6, 2, 16, 1))\nvar Deformation = H(slider(0.18, 0, 0.6, 0.01))\nosc(12, 0.03, 1.2)\n.modulate(noise(3, 0.08), Deformation)\n.kaleid(Facettes)\n.rotate(0, 0.035)\n.out(o0)",'Géométrie'),
        array('brume','Brume',"await initHydra()\nvar Echelle = H(slider(3, 0.5, 12, 0.01))\nnoise(Echelle, 0.06).color(0.25, 0.6, 1)\n.modulate(noise(2, 0.08), 0.25)\n.blend(o0, 0.7)\n.out(o0)",'Textures'),
        array('basses','Basses lumineuses',"await initHydra({ detectAudio: true })\na.setBins(4); a.setSmooth(0.85)\nvar Sensibilite = H(slider(2, 0, 8, 0.01))\nosc(15, 0.05, 1.2)\n.modulate(noise(3), () => 0.05 + (a.fft[0] || 0) * Sensibilite())\n.color(1, 0.4, 0.8).out(o0)",'Audio réactif'),
        array('julia','Julia — curseurs',file_get_contents(dirname(__DIR__) . '/assets/presets/julia-curseurs.txt'),'Fractales'),
    );
    foreach ($seeds as $seed) { $ok = pilami_hydra_insert_preset('seed-' . $seed[0], $seed[1], $seed[2], $seed[3]) && $ok; }
    if ($ok) { update_option('pilami_hydra_catalog_version', '1', false); }
}
add_action('init', 'pilami_hydra_migrate_catalog', 12);
function pilami_hydra_seed_bounce_midi() {
    if (get_option('pilami_hydra_bounce_midi_seed') === '1') { return; }
    $code = file_get_contents(dirname(__DIR__) . '/assets/presets/balle-rebond-midi.txt');
    if (is_string($code) && trim($code) !== '' && pilami_hydra_insert_preset('seed-balle-rebond-midi-v1', 'Balle — Rebond MIDI', $code, 'Expériences MIDI')) {
        update_option('pilami_hydra_bounce_midi_seed', '1', false);
    }
}
add_action('init', 'pilami_hydra_seed_bounce_midi', 13);
add_action('add_meta_boxes_pilami_hydra', function () {
    add_meta_box('pilami-hydra-code', 'Code Hydra', function ($post) {
        wp_nonce_field('pilami_hydra_save', 'pilami_hydra_nonce');
        echo '<p>JavaScript Hydra, avec <code>await initHydra()</code>. Les curseurs utilisent <code>H(slider(valeur, min, max, pas))</code>. Le code est seulement chargé lorsque le visiteur choisit ce preset.</p>';
        echo '<textarea name="pilami_hydra_code" rows="22" spellcheck="false" style="width:100%;font:14px monospace;tab-size:2">' . esc_textarea(get_post_meta($post->ID, '_pilami_hydra_code', true)) . '</textarea>';
    }, 'pilami_hydra', 'normal', 'high');
});
add_action('save_post_pilami_hydra', function ($id) {
    if (!current_user_can('manage_options') || wp_is_post_revision($id) || wp_is_post_autosave($id) || !isset($_POST['pilami_hydra_nonce'], $_POST['pilami_hydra_code']) || !is_string($_POST['pilami_hydra_code']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['pilami_hydra_nonce'])), 'pilami_hydra_save')) { return; }
    $code = wp_unslash($_POST['pilami_hydra_code']);
    if (strlen($code) > 65536 || strpos($code, "\0") !== false || wp_check_invalid_utf8($code) !== $code) { return; }
    update_post_meta($id, '_pilami_hydra_code', wp_slash($code));
});
// A revision covers the name as well as code, including name-only edits.
function pilami_hydra_preset_revision($code, $name) {
    return hash('sha256', $name . "\0" . $code);
}
function pilami_hydra_category_revision($ids) {
    $ids = array_values(array_unique(array_map('intval', $ids)));
    sort($ids, SORT_NUMERIC);
    return hash('sha256', implode(',', $ids));
}
function pilami_hydra_catalog() {
    $items = array();
    $appearance = pilami_strudel_appearance();
    foreach (get_posts(array('post_type' => 'pilami_hydra', 'post_status' => 'publish', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC')) as $post) {
        $code = get_post_meta($post->ID, '_pilami_hydra_code', true);
        if (!is_string($code) || trim($code) === '') { continue; }
        $terms = wp_get_object_terms($post->ID, 'pilami_hydra_cat', array('orderby'=>'name', 'order'=>'ASC'));
        $categories = array(); $colors = array(); $ids = array();
        if (!is_wp_error($terms)) { foreach ($terms as $term) { $categories[] = $term->name; $ids[] = (int) $term->term_id; $colors[$term->name] = pilami_strudel_hydra_category_color($term, $appearance); } }
        sort($ids, SORT_NUMERIC);
        $items[] = array('id' => (string) $post->ID, 'name' => $post->post_title, 'code' => $code, 'revision' => pilami_hydra_preset_revision($code, $post->post_title), 'createdAt' => get_post_time('c', true, $post) ?: null, 'categories' => $categories ?: array('Sans catégorie'), 'category_colors' => $colors,
            'category_ids' => $ids, 'category_revision' => is_wp_error($terms) ? null : pilami_hydra_category_revision($ids));
    }
    return $items;
}
function pilami_hydra_render_workspace() {
    ?>
    <section class="pilami-hydra-workspace" data-hydra-space data-hydra-editor-session="<?php echo esc_url(admin_url('admin-ajax.php')); ?>" aria-label="Espace Hydra">
        <h2>🌀 Visuels <span class="pilami-space-subtitle">Hydra</span></h2>
        <p class="pilami-strudel-muted">Choisis un visuel, puis lance-le. La musique Strudel continue pendant tes changements.</p>
        <script type="application/json" data-hydra-catalog><?php echo wp_json_encode(pilami_hydra_catalog(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?></script>
        <div class="pilami-hydra-filters">
            <label>Catégorie <select data-hydra-category><option value="">Toutes les catégories</option></select></label>
            <label>Rechercher <input data-hydra-search type="search" placeholder="Julia, mandala, audio…"></label>
            <label>Trier par <select data-hydra-sort><option value="recent">Plus récents</option><option value="oldest">Plus anciens</option><option value="name">Nom : A → Z</option></select></label>
        </div>
        <p data-hydra-count class="pilami-strudel-muted"></p>
        <div data-hydra-presets class="pilami-hydra-preset-list" role="group" aria-label="Presets Hydra"></div>
        <div data-hydra-share-feedback>
            <p data-hydra-share-status class="pilami-strudel-muted" role="status" aria-live="polite"></p>
            <div data-hydra-share-result hidden><label>Lien du preset <input data-hydra-share-link type="text" readonly aria-label="Lien du preset à partager"></label></div>
        </div>
        <label class="pilami-hydra-name-field">Nom du preset / essai<input type="text" data-hydra-name maxlength="100" placeholder="Nom du visuel…"></label>
        <div class="pilami-strudel-transport">
            <button type="button" class="pilami-play" data-hydra-action="play">▶ Lancer le visuel</button>
            <button type="button" data-hydra-action="stop">■ Arrêter le visuel</button>
            <button type="button" data-hydra-action="reset">↺ Réinitialiser</button>
            <button type="button" data-hydra-action="update-preset" hidden disabled>💾 Mettre à jour le preset</button>
            <button type="button" data-hydra-action="delete-preset" data-color-role="stop" hidden disabled>🗑 Supprimer le preset</button>
            <button type="button" data-hydra-action="offline-export" hidden disabled>↓ Pack VJ hors ligne</button>
            <button type="button" data-action="copy-hydra-link">🔗 Copier le lien Hydra</button>
        </div>
        <p data-hydra-preset-note class="pilami-strudel-muted" hidden></p>
        <details data-hydra-preset-categories class="pilami-preset-categories" hidden>
            <summary>Classer ce preset</summary>
            <p data-hydra-category-help class="pilami-strudel-muted">Choisis un preset de la bibliothèque.</p>
            <fieldset data-hydra-category-fields disabled>
                <legend>Classement dans WordPress</legend>
                <div data-hydra-category-choices class="pilami-category-choices"></div>
            </fieldset>
            <button type="button" data-hydra-action="save-categories" disabled>Enregistrer les catégories</button>
            <details data-hydra-category-manager class="pilami-category-manager">
                <summary>Gérer les catégories</summary>
            <div class="pilami-tools-row" data-hydra-category-create>
                <label>Nouvelle catégorie <input type="text" data-hydra-category-name maxlength="100" placeholder="Particules, Géométrie, Live…" autocomplete="off"></label>
                <button type="button" data-hydra-action="create-category" disabled>＋ Créer la catégorie</button>
            </div>
            <p data-hydra-category-create-status role="status" aria-live="polite" class="pilami-strudel-muted"></p>
                <div class="pilami-tools-row" data-hydra-category-delete>
                    <label>Catégorie à supprimer <select data-hydra-category-delete-select><option value="">Choisir une catégorie…</option></select></label>
                    <button type="button" data-hydra-action="delete-category" data-color-role="stop" disabled>Supprimer la catégorie</button>
                </div>
                <p class="pilami-strudel-muted">La suppression retire la catégorie de tous les presets. Les presets et leurs autres catégories sont conservés.</p>
                <p data-hydra-category-delete-status role="status" aria-live="polite" class="pilami-strudel-muted"></p>
            </details>
        </details>
        <p data-hydra-status role="status" aria-live="polite">Choisis un preset Hydra.</p>
        <div data-hydra-mic-anchor></div>
        <div class="pilami-strudel-editor-wrap"><textarea class="pilami-strudel-code" data-hydra-code rows="12" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Code Hydra"></textarea></div>
        <div class="pilami-strudel-sliders" data-hydra-sliders hidden><h3>Contrôleurs du visuel</h3><div data-hydra-slider-list></div></div>
        <details class="pilami-strudel-tools"><summary>Mes essais Hydra</summary>
            <p class="pilami-strudel-muted">« Créer un preset WordPress » ajoute le script à la bibliothèque Hydra, dans Imports (administrateur connecté). « Sauvegarder sur ce navigateur » conserve un essai local. Le brouillon reste automatiquement local.</p>
            <div class="pilami-tools-row">
                <button type="button" data-hydra-action="create-preset" hidden disabled>＋ Créer un preset WordPress</button>
                <button type="button" data-hydra-action="save">Sauvegarder sur ce navigateur</button>
                <button type="button" data-hydra-action="export">Exporter</button>
                <button type="button" data-hydra-action="import">Importer</button>
                <input data-hydra-import type="file" accept=".js,.txt" hidden>
            </div>
            <div class="pilami-tools-row"><label>Essais sauvegardés <select data-hydra-saved><option value="">Choisir un essai…</option></select></label>
                <button type="button" data-hydra-action="load">Charger</button><button type="button" data-hydra-action="delete">Supprimer</button>
            </div>
        </details>
    </section>
    <?php
}
