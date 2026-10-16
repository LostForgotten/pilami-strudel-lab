<?php
if (!defined('ABSPATH')) { exit; }

// Resolve authentication dynamically: the public page can be cached.
function pilami_hydra_editor_session() {
    nocache_headers();
    header('Cache-Control: private, no-store, max-age=0');
    if (!current_user_can('manage_options')) {
        wp_send_json_success(array('allowed' => false, 'catalog' => pilami_hydra_catalog()));
    }
    wp_send_json_success(array(
        'allowed' => true,
        'nonce' => wp_create_nonce('wp_rest'),
        'api' => rest_url('pilami-strudel/v1/hydra-presets'),
        'media_api' => current_user_can('upload_files') ? rest_url('wp/v2/media') : null,
        'catalog' => pilami_hydra_catalog(),
        'category_options' => pilami_hydra_category_options(),
        'snapshot_banks' => pilami_hydra_snapshot_catalog(),
    ));
}
add_action('wp_ajax_pilami_hydra_editor_session', 'pilami_hydra_editor_session');
add_action('wp_ajax_nopriv_pilami_hydra_editor_session', 'pilami_hydra_editor_session');

function pilami_hydra_category_options() {
    $terms = get_terms(array('taxonomy' => 'pilami_hydra_cat', 'hide_empty' => false, 'orderby' => 'name', 'order' => 'ASC'));
    if (is_wp_error($terms)) { return array(); }
    $options = array();
    foreach ($terms as $term) { $options[] = array('id' => (int) $term->term_id, 'name' => $term->name); }
    return $options;
}

function pilami_hydra_import_result($id, $created) {
    $post = get_post($id);
    $code = get_post_meta($id, '_pilami_hydra_code', true);
    $terms = wp_get_object_terms($id, 'pilami_hydra_cat', array('orderby'=>'name', 'order'=>'ASC'));
    $categories = array(); $colors = array(); $ids = array(); $appearance = pilami_strudel_appearance();
    if (!is_wp_error($terms)) { foreach ($terms as $term) { $categories[] = $term->name; $ids[] = (int) $term->term_id; $colors[$term->name] = pilami_strudel_hydra_category_color($term, $appearance); } }
    sort($ids, SORT_NUMERIC);
    return new WP_REST_Response(array(
        'id' => (string) $id, 'name' => $post->post_title, 'code' => $code,
        'revision' => pilami_hydra_preset_revision($code, $post->post_title), 'created' => $created,
        'categories' => $categories ?: array('Sans catégorie'), 'category_colors' => $colors,
        'category_ids' => $ids, 'category_revision' => is_wp_error($terms) ? null : pilami_hydra_category_revision($ids),
        'category_options' => pilami_hydra_category_options(),
    ), $created ? 201 : 200);
}

function pilami_hydra_create_preset($request) {
    $data = $request->get_json_params();
    if (!is_array($data) || !isset($data['code'], $data['name']) ||
        !is_string($data['code']) || !is_string($data['name']) ||
        trim($data['code']) === '' || strlen($data['code']) > 65536 || strlen($data['name']) > 400 ||
        strpos($data['code'], "\0") !== false || strpos($data['name'], "\0") !== false ||
        wp_check_invalid_utf8($data['code']) !== $data['code'] || wp_check_invalid_utf8($data['name']) !== $data['name']) {
        return new WP_Error('pilami_import_invalid', 'Le fichier est invalide ou dépasse 64 Ko.', array('status' => 400));
    }
    $title = sanitize_text_field($data['name']);
    if ($title === '') {
        return new WP_Error('pilami_import_invalid', 'Le nom du preset est vide ou invalide.', array('status' => 400));
    }
    // The editor parses imports with Acorn before sending them. Do not classify
    // arbitrary JavaScript/GLSL with the legacy migration regex here: comments,
    // templates and custom generators can be mistaken for Strudel. As with the
    // update endpoint, the server validates admin access, UTF-8 and size limits.
    // Importing the same unchanged file again reuses its preset.
    $fingerprint = hash('sha256', $title . "\0" . $data['code']);
    $existing = get_posts(array('post_type' => 'pilami_hydra', 'post_status' => 'publish',
        'numberposts' => -1, 'fields' => 'ids', 'meta_key' => '_pilami_import_fingerprint', 'meta_value' => $fingerprint));
    foreach ($existing as $id) {
        if (get_post($id)->post_title === $title && get_post_meta($id, '_pilami_hydra_code', true) === $data['code']) {
            return pilami_hydra_import_result($id, false);
        }
    }
    $term = term_exists('Imports', 'pilami_hydra_cat');
    if (!$term) { $term = wp_insert_term('Imports', 'pilami_hydra_cat'); }
    if (is_wp_error($term) && $term->get_error_code() === 'term_exists') {
        $term = array('term_id' => $term->get_error_data('term_exists'));
    }
    if (is_wp_error($term)) {
        return new WP_Error('pilami_import_category', 'Impossible de préparer la catégorie Imports.', array('status' => 503));
    }
    // Publish only after the complete code and category have been stored.
    $id = wp_insert_post(array('post_type' => 'pilami_hydra', 'post_status' => 'draft', 'post_title' => wp_slash($title)), true);
    if (is_wp_error($id) || !$id) {
        return new WP_Error('pilami_import_write', 'Impossible de créer le preset.', array('status' => 503));
    }
    update_post_meta($id, '_pilami_hydra_code', wp_slash($data['code']));
    update_post_meta($id, '_pilami_import_fingerprint', $fingerprint);
    $assigned = wp_set_object_terms($id, array((int) $term['term_id']), 'pilami_hydra_cat');
    if (get_post_meta($id, '_pilami_hydra_code', true) !== $data['code'] ||
        get_post_meta($id, '_pilami_import_fingerprint', true) !== $fingerprint || is_wp_error($assigned)) {
        wp_delete_post($id, true);
        return new WP_Error('pilami_import_write', 'Impossible d’enregistrer le code et sa catégorie.', array('status' => 503));
    }
    $published = wp_update_post(array('ID' => $id, 'post_status' => 'publish'), true);
    if (is_wp_error($published) || !$published || get_post($id)->post_status !== 'publish') {
        wp_delete_post($id, true);
        return new WP_Error('pilami_import_write', 'Impossible de publier le preset.', array('status' => 503));
    }
    return pilami_hydra_import_result($id, true);
}

function pilami_hydra_update_preset($request) {
    $id = (int) $request['id'];
    $post = get_post($id);
    if (!$post || $post->post_type !== 'pilami_hydra' || $post->post_status !== 'publish') {
        return new WP_Error('pilami_preset_missing', 'Ce preset Hydra est introuvable.', array('status' => 404));
    }
    $data = $request->get_json_params();
    if (!is_array($data) || !isset($data['code'], $data['revision']) ||
        !is_string($data['code']) || !is_string($data['revision']) ||
        !preg_match('/^[a-f0-9]{64}$/D', $data['revision']) ||
        trim($data['code']) === '' || strlen($data['code']) > 65536 ||
        strpos($data['code'], "\0") !== false || wp_check_invalid_utf8($data['code']) !== $data['code']) {
        return new WP_Error('pilami_preset_invalid', 'Le code est invalide ou dépasse 64 Ko.', array('status' => 400));
    }
    $title = $post->post_title;
    if (array_key_exists('name', $data)) {
        if (!is_string($data['name']) || strlen($data['name']) > 400 || strpos($data['name'], "\0") !== false || wp_check_invalid_utf8($data['name']) !== $data['name']) {
            return new WP_Error('pilami_preset_name', 'Le nom du preset est invalide.', array('status' => 400));
        }
        $title = sanitize_text_field($data['name']);
        if ($title === '') { return new WP_Error('pilami_preset_name', 'Donne un nom au preset.', array('status' => 400)); }
    }
    $previous = get_post_meta($id, '_pilami_hydra_code', true);
    if (!is_string($previous) || !hash_equals(pilami_hydra_preset_revision($previous, $post->post_title), $data['revision'])) {
        return new WP_Error('pilami_preset_conflict', 'Ce preset a changé depuis son chargement. Exporte ton code, puis recharge la page avant de réessayer.', array('status' => 409));
    }
    if ($previous !== $data['code']) {
        // Match the previous value too, so a concurrent update is not overwritten.
        $updated = update_post_meta($id, '_pilami_hydra_code', wp_slash($data['code']), $previous);
        if (!$updated) {
            return new WP_Error('pilami_preset_write', 'Le preset a changé ou l’enregistrement a échoué. Ton code reste dans l’éditeur.', array('status' => 409));
        }
    }
    if (get_post_meta($id, '_pilami_hydra_code', true) !== $data['code']) {
        return new WP_Error('pilami_preset_write', 'Impossible de vérifier l’enregistrement du preset.', array('status' => 503));
    }
    if ($title !== $post->post_title) {
        $renamed = wp_update_post(array('ID' => $id, 'post_title' => wp_slash($title)), true);
        if (is_wp_error($renamed) || !$renamed || get_post($id)->post_title !== $title) {
            return new WP_Error('pilami_preset_name_write', 'Le code a été enregistré, mais le nom n’a pas pu être modifié. Recharge le preset avant de réessayer.', array('status' => 503));
        }
    }
    return new WP_REST_Response(array('id' => (string) $id, 'name' => $title,
        'code' => $data['code'], 'revision' => pilami_hydra_preset_revision($data['code'], $title)), 200);
}
function pilami_hydra_update_categories($request) {
    $id = (int) $request['id'];
    $post = get_post($id);
    if (!$post || $post->post_type !== 'pilami_hydra' || $post->post_status !== 'publish') {
        return new WP_Error('pilami_preset_missing', 'Ce preset Hydra est introuvable.', array('status' => 404));
    }
    $data = $request->get_json_params();
    if (!is_array($data) || !isset($data['category_ids'], $data['category_revision']) ||
        !is_array($data['category_ids']) || count($data['category_ids']) > 100 ||
        !is_string($data['category_revision']) || !preg_match('/^[a-f0-9]{64}$/D', $data['category_revision'])) {
        return new WP_Error('pilami_categories_invalid', 'La sélection des catégories est invalide.', array('status' => 400));
    }
    $ids = array();
    foreach ($data['category_ids'] as $term_id) {
        if (!is_int($term_id) || $term_id < 1) {
            return new WP_Error('pilami_categories_invalid', 'La sélection des catégories est invalide.', array('status' => 400));
        }
        $term = get_term($term_id, 'pilami_hydra_cat');
        if (!$term || is_wp_error($term)) {
            return new WP_Error('pilami_category_missing', 'Une catégorie n’existe plus. Recharge la page avant de réessayer.', array('status' => 400));
        }
        $ids[] = $term_id;
    }
    $ids = array_values(array_unique($ids)); sort($ids, SORT_NUMERIC);
    $previous = wp_get_object_terms($id, 'pilami_hydra_cat', array('fields' => 'ids'));
    if (is_wp_error($previous)) {
        return new WP_Error('pilami_categories_read', 'Impossible de lire les catégories de ce preset.', array('status' => 503));
    }
    if (!hash_equals(pilami_hydra_category_revision($previous), $data['category_revision'])) {
        return new WP_Error('pilami_categories_conflict', 'Le classement a changé depuis son chargement. Recharge la page avant de réessayer ; ton code reste dans le brouillon.', array('status' => 409));
    }
    $assigned = wp_set_object_terms($id, $ids, 'pilami_hydra_cat', false);
    if (is_wp_error($assigned)) {
        return new WP_Error('pilami_categories_write', 'Impossible d’enregistrer les catégories du preset.', array('status' => 503));
    }
    $actual = wp_get_object_terms($id, 'pilami_hydra_cat', array('fields' => 'ids'));
    if (is_wp_error($actual)) {
        return new WP_Error('pilami_categories_write', 'Impossible de vérifier les catégories enregistrées. Recharge la page avant de réessayer.', array('status' => 503));
    }
    $actual = array_map('intval', $actual); sort($actual, SORT_NUMERIC);
    if ($actual !== $ids) {
        return new WP_Error('pilami_categories_write', 'Le classement a changé pendant l’enregistrement. Recharge la page avant de réessayer.', array('status' => 409));
    }
    // This action only changes the taxonomy. Unsaved name/code remain in the editor.
    return pilami_hydra_import_result($id, false);
}
function pilami_hydra_delete_preset($request) {
    $id = (int) $request['id'];
    $post = get_post($id);
    if (!$post || $post->post_type !== 'pilami_hydra' || $post->post_status !== 'publish') {
        return new WP_Error('pilami_preset_missing', 'Ce preset Hydra est introuvable.', array('status' => 404));
    }
    $data = $request->get_json_params();
    if (!is_array($data) || !isset($data['revision'], $data['category_revision']) ||
        !is_string($data['revision']) || !preg_match('/^[a-f0-9]{64}$/D', $data['revision']) ||
        !is_string($data['category_revision']) || !preg_match('/^[a-f0-9]{64}$/D', $data['category_revision'])) {
        return new WP_Error('pilami_preset_invalid', 'La demande de suppression est invalide.', array('status' => 400));
    }
    $code = get_post_meta($id, '_pilami_hydra_code', true);
    $categories = wp_get_object_terms($id, 'pilami_hydra_cat', array('fields' => 'ids'));
    if (is_wp_error($categories)) {
        return new WP_Error('pilami_categories_read', 'Impossible de vérifier les catégories du preset.', array('status' => 503));
    }
    if (!is_string($code) || !hash_equals(pilami_hydra_preset_revision($code, $post->post_title), $data['revision']) ||
        !hash_equals(pilami_hydra_category_revision($categories), $data['category_revision'])) {
        return new WP_Error('pilami_preset_conflict', 'Ce preset a changé depuis son chargement. Recharge la page avant de réessayer ; ton code reste dans le brouillon.', array('status' => 409));
    }
    // Never turn this UI action into permanent deletion when trash is disabled.
    if (defined('EMPTY_TRASH_DAYS') && (int) EMPTY_TRASH_DAYS <= 0) {
        return new WP_Error('pilami_preset_trash_disabled', 'La corbeille WordPress est désactivée. Active-la pour retirer ce preset sans suppression définitive.', array('status' => 503));
    }
    $trashed = wp_trash_post($id);
    $actual = get_post($id);
    if (!$trashed || !$actual || $actual->post_status !== 'trash') {
        return new WP_Error('pilami_preset_delete_write', 'Impossible de placer le preset dans la corbeille WordPress.', array('status' => 503));
    }
    return new WP_REST_Response(array('id' => (string) $id, 'name' => $post->post_title, 'trashed' => true), 200);
}

add_action('rest_api_init', function () {
    register_rest_route('pilami-strudel/v1', '/hydra-presets/(?P<id>[1-9][0-9]*)/categories', array(
        'methods' => 'POST', 'callback' => 'pilami_hydra_update_categories',
        'permission_callback' => function () { return current_user_can('manage_options'); },
    ));
    register_rest_route('pilami-strudel/v1', '/hydra-presets', array(
        'methods' => 'POST', 'callback' => 'pilami_hydra_create_preset',
        'permission_callback' => function () { return current_user_can('manage_options'); },
    ));
    register_rest_route('pilami-strudel/v1', '/hydra-presets/(?P<id>[1-9][0-9]*)', array(
        array('methods' => 'POST', 'callback' => 'pilami_hydra_update_preset',
            'permission_callback' => function () { return current_user_can('manage_options'); }),
        array('methods' => 'DELETE', 'callback' => 'pilami_hydra_delete_preset',
            'permission_callback' => function ($request) { return current_user_can('manage_options') && current_user_can('delete_post', (int) $request['id']); }),
    ));
});
