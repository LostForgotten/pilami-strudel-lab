<?php
if (!defined('ABSPATH')) { exit; }

function pilami_strudel_is_lab_page() {
    if (is_admin() || !is_singular()) { return false; }
    $page = get_queried_object();
    return $page instanceof WP_Post && has_shortcode($page->post_content, 'pilami_strudel');
}

// Query and authentication are available on wp, before the front-end admin bar starts.
function pilami_strudel_lab_hide_admin_bar() {
    if (pilami_strudel_is_lab_page()) { show_admin_bar(false); }
}
add_action('wp', 'pilami_strudel_lab_hide_admin_bar');

// The public page can be cached: never embed a user's authenticated state in its HTML.
function pilami_strudel_lab_connection() {
    nocache_headers();
    header('Cache-Control: private, no-store, max-age=0');
    $authenticated = is_user_logged_in();
    wp_send_json_success(array(
        'authenticated' => $authenticated,
        'admin' => $authenticated && current_user_can('manage_options'),
    ));
}
add_action('wp_ajax_pilami_strudel_connection', 'pilami_strudel_lab_connection');
add_action('wp_ajax_nopriv_pilami_strudel_connection', 'pilami_strudel_lab_connection');
