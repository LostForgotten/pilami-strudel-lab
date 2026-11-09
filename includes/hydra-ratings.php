<?php
if (!defined('ABSPATH')) { exit; }

function pilami_hydra_rating($id) {
    return max(0, min(5, (int) get_post_meta($id, '_pilami_hydra_rating', true)));
}

function pilami_hydra_update_rating($request) {
    $id = (int) $request['id'];
    $post = get_post($id);
    if (!$post || $post->post_type !== 'pilami_hydra' || $post->post_status !== 'publish') {
        return new WP_Error('pilami_rating_missing', 'Ce preset Hydra est introuvable.', array('status' => 404));
    }
    $data = $request->get_json_params();
    if (!is_array($data) || !isset($data['rating'], $data['previous']) ||
        !is_int($data['rating']) || $data['rating'] < 0 || $data['rating'] > 5 ||
        !is_int($data['previous']) || $data['previous'] < 0 || $data['previous'] > 5) {
        return new WP_Error('pilami_rating_invalid', 'Choisis une note entière de 1 à 5 étoiles, ou 0 pour la retirer.', array('status' => 400));
    }
    $rating = pilami_hydra_rating($id);
    if ($rating !== $data['previous']) {
        return new WP_Error('pilami_rating_conflict', 'Cette note a changé dans un autre onglet. La note actuelle est affichée ; réessaie.', array('status' => 409, 'rating' => $rating));
    }
    // Keep rating separate from code, categories and snapshot revisions.
    if ($rating !== $data['rating']) {
        $stored = get_post_meta($id, '_pilami_hydra_rating', true);
        if ($stored === '') {
            $saved = add_post_meta($id, '_pilami_hydra_rating', $data['rating'], true);
        } else {
            $saved = update_post_meta($id, '_pilami_hydra_rating', $data['rating'], $stored);
        }
        $actual = pilami_hydra_rating($id);
        if (!$saved || $actual !== $data['rating']) {
            return new WP_Error('pilami_rating_write', 'La note n’a pas pu être enregistrée. Recharge la page avant de réessayer.', array('status' => 503));
        }
    }
    return new WP_REST_Response(array('id' => (string) $id, 'rating' => pilami_hydra_rating($id)), 200);
}

add_action('rest_api_init', function () {
    register_rest_route('pilami-strudel/v1', '/hydra-presets/(?P<id>[1-9][0-9]*)/rating', array(
        'methods' => 'POST', 'callback' => 'pilami_hydra_update_rating',
        'permission_callback' => function () { return current_user_can('manage_options'); },
    ));
});
