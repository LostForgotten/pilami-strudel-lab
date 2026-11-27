<?php
if (!defined('ABSPATH')) {
    exit;
}

function pilami_tempera_feedback_enqueue_assets() {
    if (!is_singular()) {
        return;
    }

    $page = get_post();
    if (!$page || !has_shortcode($page->post_content, 'pilami_tempera_feedback')) {
        return;
    }

    $plugin_file = dirname(__DIR__) . '/pilami-strudel-lab.php';
    $plugin_url = plugin_dir_url($plugin_file);
    wp_enqueue_style(
        'pilami-tempera-feedback',
        $plugin_url . 'assets/tempera-feedback.css',
        array(),
        '0.1.1'
    );
    wp_enqueue_script(
        'pilami-tempera-feedback',
        $plugin_url . 'assets/tempera-feedback.js',
        array(),
        '0.1.1',
        true
    );
}
add_action('wp_enqueue_scripts', 'pilami_tempera_feedback_enqueue_assets');

function pilami_tempera_feedback_shortcode() {
    ob_start();
    ?>
    <main class="pilami-tempera" data-tempera-feedback>
        <header class="pt-header">
            <div>
                <p class="pt-kicker">PILAMI · EXPÉRIMENTAL</p>
                <h1>Tempera <span>Feedback</span></h1>
                <p class="pt-subtitle">Matrice MIDI et propagation particulaire en direct</p>
            </div>
            <div class="pt-status-wrap">
                <span class="pt-status-dot" data-status-dot></span>
                <span data-midi-status>En attente du MIDI</span>
            </div>
        </header>

        <section class="pt-stage">
            <aside class="pt-panel">
                <div class="pt-panel-title">
                    <div>
                        <h2>Matrice Tempera</h2>
                        <p>8 × 8 · cellules reçues par MIDI</p>
                    </div>
                    <span class="pt-live-mark">LIVE</span>
                </div>

                <div class="pt-grid" data-tempera-grid aria-label="Matrice Tempera 8 par 8"></div>

                <div class="pt-emitters">
                    <span class="pt-label">ÉMETTEUR ACTIF</span>
                    <div class="pt-emitter-buttons">
                        <button type="button" data-emitter="0" aria-pressed="true"><i></i>E1</button>
                        <button type="button" data-emitter="1" aria-pressed="false"><i></i>E2</button>
                        <button type="button" data-emitter="2" aria-pressed="false"><i></i>E3</button>
                        <button type="button" data-emitter="3" aria-pressed="false"><i></i>E4</button>
                    </div>
                </div>

                <div class="pt-midi">
                    <label for="pt-midi-input">ENTRÉE MIDI</label>
                    <select id="pt-midi-input" data-midi-input disabled>
                        <option>Connecte le MIDI pour choisir un port</option>
                    </select>
                    <button type="button" class="pt-connect" data-midi-connect>Connecter le MIDI</button>
                    <p class="pt-midi-help" data-midi-help>Choisis l’entrée LoopMIDI qui reçoit Tempera depuis Ableton.</p>
                </div>

                <div class="pt-footer-actions">
                    <button type="button" class="pt-test" data-test-cell>Tester une cellule</button>
                    <button type="button" class="pt-fullscreen" data-fullscreen aria-label="Plein écran">⛶</button>
                </div>
            </aside>

            <section class="pt-visual-panel" aria-label="Feedback particulaire">
                <div class="pt-visual-meta">
                    <div>
                        <span class="pt-label">FEEDBACK VISUEL</span>
                        <span class="pt-visual-caption">les notes deviennent matière</span>
                    </div>
                    <span data-particle-count>0 particule</span>
                </div>
                <canvas class="pt-canvas" data-particle-canvas></canvas>
                <div class="pt-visual-hint">Note ON → émission · Note OFF → dispersion des particules</div>
            </section>
        </section>
    </main>
    <?php
    return ob_get_clean();
}
add_shortcode('pilami_tempera_feedback', 'pilami_tempera_feedback_shortcode');


function pilami_tempera_feedback_create_page() {
    if (!current_user_can('manage_options') || get_page_by_path('tempera', OBJECT, 'page')) {
        return;
    }
    wp_insert_post(array(
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => 'Tempera Feedback',
        'post_name' => 'tempera',
        'post_content' => '[pilami_tempera_feedback]',
    ));
}
add_action('admin_init', 'pilami_tempera_feedback_create_page');

add_filter('body_class', function ($classes) {
    if (is_singular()) {
        $page = get_post();
        if ($page && has_shortcode($page->post_content, 'pilami_tempera_feedback')) {
            $classes[] = 'pilami-tempera-page';
        }
    }
    return $classes;
});
