<?php
/**
 * Plugin Name: Pilami Strudel Lab
 * Description: Laboratoire Strudel intégré à WordPress avec presets et commandes de lecture.
 * Version: 0.39.48
 * Author: pilami.fr
 * License: AGPL-3.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PILAMI_STRUDEL_LAB_VERSION', '0.39.48');
require_once __DIR__ . '/includes/version-history.php';
require_once __DIR__ . '/includes/appearance.php';
require_once __DIR__ . '/includes/shares.php';
require_once __DIR__ . '/includes/hydra-catalog.php';
require_once __DIR__ . '/includes/hydra-snapshots.php';
require_once __DIR__ . '/includes/hydra-editor.php';
register_activation_hook(__FILE__, 'pilami_strudel_shares_install');

function pilami_strudel_lab_enqueue_assets() {
    if (!is_singular()) {
        return;
    }

    global $post;
    if (!$post || !has_shortcode($post->post_content, 'pilami_strudel')) {
        return;
    }

    wp_enqueue_style(
        'pilami-strudel-lab',
        plugin_dir_url(__FILE__) . 'assets/pilami-strudel-0.6.0.css',
        array(),
        '0.6.0'
    );

    wp_enqueue_style('pilami-strudel-menus', plugin_dir_url(__FILE__) . 'assets/pilami-menus-0.11.0.css', array('pilami-strudel-lab'), '0.11.0');
    wp_enqueue_script('pilami-strudel-menus', plugin_dir_url(__FILE__) . 'assets/pilami-menus-0.11.1.js', array(), '0.11.1', true);

    wp_enqueue_style('pilami-strudel-visuals', plugin_dir_url(__FILE__) . 'assets/pilami-visuals-0.39.25.css', array('pilami-strudel-lab'), '0.39.14');
    wp_enqueue_script('pilami-strudel-visuals', plugin_dir_url(__FILE__) . 'assets/pilami-visuals-0.39.48.js', array('strudel-web'), '0.39.48', true);

    wp_enqueue_script('pilami-strudel-hydra', plugin_dir_url(__FILE__) . 'assets/pilami-hydra-0.39.48.js', array('strudel-web', 'pilami-strudel-visuals'), '0.39.48', true);

    wp_enqueue_script('pilami-strudel-inline', plugin_dir_url(__FILE__) . 'assets/pilami-inline-0.10.2.js', array('strudel-web'), '0.10.2', true);

    // Interface maison : on utilise le moteur Strudel sans son éditeur intégré.
    wp_enqueue_script(
        'strudel-web',
        plugin_dir_url(__FILE__) . 'assets/vendor/strudel-web-1.3.0-pilami-0.3.1.js',
        array(),
        '1.3.0',
        true
    );

    wp_enqueue_script('pilami-strudel-compat', plugin_dir_url(__FILE__) . 'assets/pilami-compat-0.8.2.js', array('strudel-web'), '0.8.2', true);

    wp_enqueue_style('pilami-dual-spaces', plugin_dir_url(__FILE__) . 'assets/pilami-dual-0.20.0.css', array('pilami-strudel-lab'), '0.20.0');
    wp_enqueue_script('pilami-workspaces', plugin_dir_url(__FILE__) . 'assets/pilami-workspaces-0.39.0.js', array(), '0.39.0', true);
    wp_enqueue_script('pilami-acorn', plugin_dir_url(__FILE__) . 'assets/vendor/acorn-8.15.0.js', array(), '8.15.0', true);
    wp_enqueue_style('pilami-controllers', plugin_dir_url(__FILE__) . 'assets/pilami-controllers-0.39.14.css', array('pilami-dual-spaces'), '0.39.14');
    wp_enqueue_script('pilami-hydra-midi', plugin_dir_url(__FILE__) . 'assets/pilami-midi-0.39.16.js', array('pilami-strudel-hydra'), '0.39.16', true);
    wp_enqueue_script('pilami-hydra-midi-library', plugin_dir_url(__FILE__) . 'assets/vendor/hydra-midi-0.4.6-pilami.js', array('pilami-hydra-midi'), '0.4.6', true);
    wp_enqueue_script('pilami-hydra-sequencer', plugin_dir_url(__FILE__) . 'assets/pilami-sequencer-0.39.30.js', array('pilami-ableton-link'), '0.39.30', true);
    wp_enqueue_script('pilami-hydra-snapshots', plugin_dir_url(__FILE__) . 'assets/pilami-snapshots-0.39.32.js', array('pilami-acorn','pilami-strudel-hydra','pilami-hydra-midi','pilami-ableton-link','pilami-hydra-sequencer'), '0.39.32', true);
    wp_enqueue_style('pilami-performance', plugin_dir_url(__FILE__) . 'assets/pilami-performance-0.39.35.css', array(), '0.39.35');
    wp_enqueue_script('pilami-performance', plugin_dir_url(__FILE__) . 'assets/pilami-performance-0.39.45.js', array(), '0.39.45', true);
    wp_enqueue_script('pilami-controllers', plugin_dir_url(__FILE__) . 'assets/pilami-controllers-0.39.45.js', array('pilami-performance','pilami-hydra-snapshots','pilami-strudel-hydra','pilami-hydra-midi'), '0.39.45', true);
    wp_enqueue_script('pilami-hydra-images', plugin_dir_url(__FILE__) . 'assets/pilami-images-0.39.32.js', array(), '0.39.32', true);
    wp_enqueue_script('pilami-hydra-extensions', plugin_dir_url(__FILE__) . 'assets/pilami-hydra-extensions-0.28.0.js', array(), '0.28.0', true);
    wp_enqueue_script('pilami-hydra-workspace', plugin_dir_url(__FILE__) . 'assets/pilami-hydra-workspace-0.39.43.js', array('pilami-hydra-midi-library','pilami-hydra-extensions','pilami-controllers','pilami-acorn','pilami-strudel-hydra','pilami-strudel-visuals','pilami-hydra-images'), '0.39.43', true);

    wp_enqueue_script('pilami-strudel-share', plugin_dir_url(__FILE__) . 'assets/pilami-share-0.39.41.js', array(), '0.39.41', true);

    wp_enqueue_script('pilami-strudel-tools', plugin_dir_url(__FILE__) . 'assets/pilami-tools-0.14.0.js', array(), '0.14.0', true);

    wp_enqueue_style('pilami-detachable', plugin_dir_url(__FILE__) . 'assets/pilami-detachable-0.15.0.css', array('pilami-dual-spaces'), '0.15.0');
    wp_enqueue_script('pilami-detachable', plugin_dir_url(__FILE__) . 'assets/pilami-detachable-0.39.48.js', array('pilami-studio','pilami-controllers'), '0.39.48', true);

    wp_enqueue_style('pilami-shortcuts', plugin_dir_url(__FILE__) . 'assets/pilami-shortcuts-0.38.0.css', array('pilami-detachable'), '0.38.0');
    wp_enqueue_script('pilami-shortcuts', plugin_dir_url(__FILE__) . 'assets/pilami-shortcuts-0.39.37.js', array('pilami-detachable', 'pilami-strudel-visuals'), '0.39.37', true);

    wp_enqueue_style('pilami-interface-colors', plugin_dir_url(__FILE__) . 'assets/pilami-colors-0.21.0.css', array('pilami-strudel-menus','pilami-detachable','pilami-controllers','pilami-strudel-visuals'), '0.21.0');
    wp_enqueue_style('pilami-preset-categories', plugin_dir_url(__FILE__) . 'assets/pilami-categories-0.39.42.css', array('pilami-interface-colors'), '0.39.42');
    wp_enqueue_style('pilami-hydra-images', plugin_dir_url(__FILE__) . 'assets/pilami-images-0.39.32.css', array('pilami-interface-colors'), '0.39.32');
    wp_enqueue_style('pilami-hydra-designer', plugin_dir_url(__FILE__) . 'assets/pilami-designer-0.25.1.css', array('pilami-interface-colors'), '0.25.1');
    wp_enqueue_script('pilami-designer-catalog', plugin_dir_url(__FILE__) . 'assets/pilami-designer-catalog-0.24.0.js', array(), '0.24.0', true);
    wp_enqueue_script('pilami-designer-core', plugin_dir_url(__FILE__) . 'assets/pilami-designer-core-0.25.0.js', array('pilami-designer-catalog','pilami-acorn'), '0.25.0', true);
    wp_enqueue_script('pilami-designer-import', plugin_dir_url(__FILE__) . 'assets/pilami-designer-import-0.25.0.js', array('pilami-designer-core','pilami-acorn'), '0.25.0', true);
    wp_enqueue_script('pilami-hydra-designer', plugin_dir_url(__FILE__) . 'assets/pilami-designer-0.39.36.js', array('pilami-studio','pilami-designer-import','pilami-hydra-workspace'), '0.39.36', true);

    wp_enqueue_style('pilami-interface', plugin_dir_url(__FILE__) . 'assets/pilami-interface-0.39.0.css', array('pilami-hydra-designer','pilami-preset-categories'), '0.39.0');
    wp_enqueue_script('pilami-interface', plugin_dir_url(__FILE__) . 'assets/pilami-interface-0.39.44.js', array('pilami-detachable'), '0.39.44', true);

    wp_enqueue_style('pilami-ableton-link', plugin_dir_url(__FILE__) . 'assets/pilami-link-0.39.28.css', array('pilami-interface'), '0.39.28');
    wp_enqueue_style('pilami-hydra-sequencer', plugin_dir_url(__FILE__) . 'assets/pilami-sequencer-0.39.29.css', array('pilami-ableton-link'), '0.39.29');
    wp_enqueue_style('pilami-studio', plugin_dir_url(__FILE__) . 'assets/pilami-studio-0.39.35.css', array('pilami-hydra-sequencer','pilami-performance'), '0.39.35');
    wp_enqueue_script('pilami-studio', plugin_dir_url(__FILE__) . 'assets/pilami-studio-0.39.35.js', array(), '0.39.35', true);
    wp_enqueue_script('pilami-ableton-link', plugin_dir_url(__FILE__) . 'assets/pilami-link-0.39.27.js', array(), '0.39.27', true);
    wp_enqueue_style('pilami-connections', plugin_dir_url(__FILE__) . 'assets/pilami-connections-0.39.37.css', array('pilami-studio'), '0.39.37');
    wp_enqueue_script('pilami-connections', plugin_dir_url(__FILE__) . 'assets/pilami-connections-0.39.37.js', array('pilami-strudel-hydra','pilami-hydra-midi','pilami-ableton-link'), '0.39.37', true);
    wp_enqueue_script('pilami-ableton-link-help', plugin_dir_url(__FILE__) . 'assets/pilami-link-help-0.39.28.js', array(), '0.39.28', true);

    wp_enqueue_script(
        'pilami-strudel-lab',
        plugin_dir_url(__FILE__) . 'assets/pilami-strudel-0.39.0.js',
        array('pilami-interface', 'pilami-shortcuts', 'pilami-hydra-designer', 'pilami-workspaces', 'pilami-detachable', 'pilami-hydra-workspace', 'pilami-strudel-share', 'pilami-strudel-menus', 'strudel-web', 'pilami-strudel-tools', 'pilami-strudel-compat', 'pilami-strudel-visuals', 'pilami-strudel-hydra', 'pilami-strudel-inline'),
        '0.39.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'pilami_strudel_lab_enqueue_assets');

// Compact only pages hosting this shortcode; other theme pages keep their layout.
add_filter('body_class', function ($classes) {
    if (is_singular()) {
        $page = get_post();
        if ($page && has_shortcode($page->post_content, 'pilami_strudel')) {
            $classes[] = 'pilami-studio-page';
        }
    }
    return $classes;
});

function pilami_strudel_lab_shortcode() {
    $appearance = pilami_strudel_appearance();
    ob_start();
    ?>
    <section class="pilami-strudel-lab" data-pilami-strudel data-share-api="<?php echo esc_url(rest_url('pilami-strudel/v1/shares')); ?>" data-version="<?php echo esc_attr(PILAMI_STRUDEL_LAB_VERSION); ?>" data-hydra="<?php echo esc_url(plugin_dir_url(__FILE__) . 'assets/vendor/hydra-synth-1.3.29-pilami-0.11.4.js'); ?>" style="<?php echo esc_attr(pilami_strudel_appearance_style($appearance)); ?>" data-layout="<?php echo esc_attr($appearance['layout']); ?>" data-custom-palette="<?php echo esc_attr($appearance['custom_palette']); ?>" data-role-colors="<?php echo esc_attr($appearance['role_colors_enabled']); ?>" data-initial-preset="<?php echo esc_attr($appearance['initial_preset']); ?>" data-recorder="<?php echo esc_url(plugin_dir_url(__FILE__) . 'assets/recorder-0.4.0.js'); ?>" data-samples="<?php echo esc_url(plugin_dir_url(__FILE__) . 'assets/samples/'); ?>">
        <div class="pilami-strudel-intro" <?php if (!$appearance['show_intro']) { echo 'hidden'; } ?>>
            <div><?php echo wpautop(wp_kses_post($appearance['intro'])); ?></div>
            <p class="pilami-strudel-muted"><?php echo esc_html($appearance['subtitle']); ?></p>
        </div>
        <div class="pilami-connections" data-pilami-connections role="group" aria-label="Connexions audio, MIDI et Link">
            <div class="pilami-connection" data-connection="audio">
                <span class="pilami-connection-led" aria-hidden="true"></span><strong>AUDIO</strong>
                <span data-connection-status role="status" aria-live="polite">Désactivé</span>
                <button type="button" data-connect-audio aria-pressed="false" title="Activer l’entrée audio pour les visuels réactifs">Activer l’audio</button>
            </div>
            <div class="pilami-connection" data-connection="midi">
                <span class="pilami-connection-led" aria-hidden="true"></span><strong>MIDI</strong>
                <span data-connection-status role="status" aria-live="polite">Désactivé</span>
                <button type="button" data-connect-midi aria-pressed="false" title="Activer les contrôleurs MIDI et les associations apprises">Activer le MIDI</button>
            </div>
        <div class="pilami-link-strip" data-pilami-link-bar role="group" aria-label="Synchronisation Ableton Link">
            <span class="pilami-link-led" data-link-led aria-hidden="true"></span>
            <strong>LINK</strong>
            <span data-link-status role="status" aria-live="polite">Autonome</span>
            <span class="pilami-link-tempo"><output data-link-bpm>—</output> BPM</span>
            <span data-link-beat aria-label="Position dans la mesure">— / 4</span>
            <span data-link-peers aria-label="Participants Link">— pairs</span>
            <button type="button" data-link-connect>Connecter Link</button>
            <button type="button" class="pilami-link-help-trigger" data-link-help-toggle aria-expanded="false" aria-controls="pilami-link-help-panel" title="Télécharger Pilami Link Bridge et consulter l’aide">ⓘ Aide Link</button>
        </div>
        </div>
        <p class="pilami-strudel-muted pilami-strudel-guide">
            <a href="https://pilami.fr/wp-content/uploads/2026/10/Pilami-Strudel-Hydra-guide-rapide.pdf" target="_blank" rel="noopener noreferrer" aria-label="Guide rapide (PDF), s’ouvre dans un nouvel onglet">📖 Guide rapide (PDF)</a>
        </p>
        <section id="pilami-link-help-panel" class="pilami-link-help-panel" data-link-help-panel aria-label="Aide et installation de Pilami Link" hidden>
            <div class="pilami-link-help-head">
                <h3>Pilami Link Bridge <span class="pilami-link-beta">Windows 10/11 · bêta</span></h3>
                <button type="button" data-link-help-close aria-label="Fermer l’aide Link" title="Fermer l’aide Link">✕</button>
            </div>
            <p>Pour synchroniser Pilami avec Ableton Link (tempo, mesures et Play/Stop), installe ce petit programme facultatif. Aucun compte GitHub ni installation de Node.js ne sont nécessaires.</p>
            <div class="pilami-link-help-links">
                <a class="pilami-link-help-download" href="https://github.com/LostForgotten/pilami-link-bridge/releases/download/v0.1.0-beta.1/Pilami-Link-Windows-x64-v0.1.0-beta.1.zip" target="_blank" rel="noopener noreferrer">↓ Télécharger pour Windows 64 bits</a>
                <a href="https://github.com/LostForgotten/pilami-link-bridge/releases" target="_blank" rel="noopener noreferrer">Versions et code source sur GitHub ↗</a>
            </div>
            <ol>
                <li>Décompresse complètement l’archive et lance <code>Pilami-Link.exe</code> ; laisse sa fenêtre ouverte.</li>
                <li>Dans Ableton Live, active <strong>Link</strong> puis <strong>Start/Stop Sync</strong> (« Synchro de démarrage arrêt ») pour synchroniser aussi Play/Stop.</li>
                <li>Dans cette barre, clique sur <strong>Connecter Link</strong>. Pour piloter le séquenceur avec Live, active « Play avec Live » et « Stop avec Live » dans les réglages du séquenceur.</li>
            </ol>
            <p class="pilami-link-help-note">BPM synchronisé mais Play/Stop absent ? Vérifie Start/Stop Sync dans Live. Ferme toute autre instance du bridge avant de lancer celle-ci. La version Windows 11 est encore en cours de validation.</p>
        </section>
        <div class="pilami-dual-actions">
            <div class="pilami-workspace-toggles" role="group" aria-label="Afficher ou masquer les panneaux">
                <button type="button" data-toggle-workspace="strudel" aria-expanded="true">Masquer la musique</button>
                <button type="button" data-toggle-workspace="hydra" aria-expanded="true">Masquer les visuels</button>
            </div>
            <button type="button" data-action="copy-duo-link">🔗 Partager musique + visuels</button>
        </div>
        <p class="pilami-strudel-muted" data-workspaces-empty role="status" aria-live="polite" hidden>Les deux panneaux sont masqués. Utilise les boutons ci-dessus pour les réafficher.</p>
        <div class="pilami-strudel-tools" data-share-result hidden>
            <label>Lien à partager <input data-share-link type="text" readonly aria-label="Lien du morceau à partager"></label>
        </div>
        <p class="pilami-strudel-muted" data-share-status role="status" aria-live="polite"></p>
        <div class="pilami-dual-grid">
        <section class="pilami-music-workspace" data-strudel-space aria-label="Espace Strudel">
        <h2>🎵 Musique <span class="pilami-space-subtitle">Strudel</span></h2>
        <div class="pilami-strudel-presets" role="group" aria-label="Exemples Strudel">
            <?php pilami_strudel_render_preset_sections($appearance); ?>
        </div>

        <script type="application/json" data-preset-config><?php echo wp_json_encode($appearance['preset_definitions'], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?></script>
        <div class="pilami-strudel-transport" role="group" aria-label="Commandes Strudel">
            <button type="button" class="pilami-play" data-action="play">▶ Lancer la musique</button>
            <button type="button" data-action="stop">■ Arrêter la musique</button>
            <button type="button" data-action="reset">↺ Réinitialiser</button>
            <button type="button" data-action="copy-link">🔗 Copier le lien Strudel</button>
            <span class="pilami-strudel-status" data-status role="status" aria-live="polite">Chargement de Strudel…</span>
        </div>

        <label class="pilami-strudel-volume">Volume
            <input data-volume type="range" min="0" max="100" step="1" value="60" aria-label="Volume maître">
            <output data-volume-value>60 %</output>
        </label>
        <div class="pilami-strudel-editor-wrap">
            <textarea
                class="pilami-strudel-code"
                data-code
                rows="10"
                spellcheck="false"
                autocapitalize="off"
                autocomplete="off"
                aria-label="Code Strudel"
            ></textarea>
        </div>

        <div class="pilami-strudel-sliders" data-sliders hidden>
            <h3>Contrôleurs de la musique</h3>
            <p class="pilami-strudel-muted">Ajuste les paramètres pendant la lecture. Les valeurs sont inscrites dans le code pour tes sauvegardes.</p>
            <div data-slider-list></div>
        </div>
        <p data-interface-gm class="pilami-strudel-muted">Instruments General MIDI : chargés à la demande avec une connexion Internet. Utilise par exemple <code>.s("gm_piano")</code>.</p>

        <div class="pilami-strudel-panels">
        <details class="pilami-strudel-tools" <?php if ($appearance['saves_open']) { echo 'open'; } ?> <?php if (!$appearance['show_saves']) { echo 'hidden'; } ?>>
            <summary><?php echo esc_html($appearance['saves_title']); ?></summary>
            <p class="pilami-strudel-muted">Sauvegardes sur ce navigateur. Ton dernier brouillon est restauré automatiquement.</p>
            <div class="pilami-tools-row">
                <label>Nom de l’essai <input data-save-name type="text" maxlength="100" placeholder="Mon morceau…"></label>
                <button type="button" data-action="save">Sauvegarder</button>
                <button type="button" data-action="export-code">Exporter le code</button>
                <button type="button" data-action="import-code">Importer du code</button>
                <input data-import-file type="file" accept=".js,.txt" hidden>
            </div>
            <div class="pilami-tools-row">
                <label>Essais sauvegardés <select data-saved-list><option value="">Choisir un essai…</option></select></label>
                <button type="button" data-action="load-save" disabled>Charger</button>
                <button type="button" data-action="delete-save" disabled>Supprimer</button>
            </div>
            <p data-save-status role="status" aria-live="polite"></p>
        </details>
        <div class="pilami-strudel-tools pilami-recording" <?php if (!$appearance['show_recording']) { echo 'hidden'; } ?>>
            <h3><?php echo esc_html($appearance['recording_title']); ?></h3>
            <p class="pilami-strudel-muted">L’enregistrement lance le code affiché. WAV stéréo, 5 min maximum. Le volume règle aussi le niveau enregistré.</p>
            <div class="pilami-tools-row">
                <button type="button" data-action="record">● Enregistrer</button>
                <button type="button" data-action="finish-record" disabled>■ Terminer l’enregistrement</button>
                <span data-record-status role="status" aria-live="polite">Prêt à enregistrer.</span>
            </div>
            <div data-record-result hidden>
                <audio data-wav-preview controls preload="metadata" aria-label="Écouter l’enregistrement"></audio>
                <a data-wav-link download>Télécharger le WAV</a>
                <p class="pilami-strudel-muted">Télécharge ton enregistrement avant de fermer cette page.</p>
            </div>
        </div>
        </div>
        </section>
        <?php pilami_hydra_render_workspace(); ?>
        </div>
        <section class="pilami-visual-panel" data-visual-panel hidden>
            <h3>Visuels du morceau</h3>
            <p>Les visuels apparaissent quand ton code utilise une visualisation, comme <code>.pianoroll()</code> ou Hydra.</p>
            <div class="pilami-visual-stage" data-visual-stage></div>
        </section>
        <div class="pilami-strudel-help" <?php if (!$appearance['show_help']) { echo 'hidden'; } ?>>
            <strong>💡 À essayer :</strong> <?php echo esc_html($appearance['help']); ?>
            <span class="pilami-strudel-shortcut">Raccourci : Ctrl + Entrée.</span>
        </div>
    </section>
    <?php
    return ob_get_clean();
}
add_shortcode('pilami_strudel', 'pilami_strudel_lab_shortcode');
