<?php
// Shared snapshots are immutable text. They are never evaluated by WordPress.
if (!defined('ABSPATH')) { exit; }

function pilami_strudel_shares_table() {
    global $wpdb;
    return $wpdb->prefix . 'pilami_strudel_shares';
}

function pilami_strudel_shares_install() {
    global $wpdb;
    if (get_option('pilami_strudel_shares_schema') === '1') { return; }
    $table = pilami_strudel_shares_table();
    $collate = $wpdb->get_charset_collate();
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta("CREATE TABLE $table (
        id varchar(24) NOT NULL,
        fingerprint char(64) NOT NULL,
        payload longtext NOT NULL,
        created_at datetime NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY fingerprint (fingerprint),
        KEY created_at (created_at)
    ) $collate;");
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table) {
        update_option('pilami_strudel_shares_schema', '1', false);
    }
}
// Updates do not necessarily run the activation hook.
add_action('init', 'pilami_strudel_shares_install');

function pilami_strudel_share_validate($data) {
    if (is_array($data) && isset($data['v']) && $data['v'] === 2) {
        if (!isset($data['mode']) || !in_array($data['mode'], array('strudel','hydra','duo'), true)) {
            return new WP_Error('pilami_share_invalid', 'Le partage est invalide.', array('status' => 400));
        }
        $music = null; $visual = null;
        if ($data['mode'] !== 'hydra') {
            $part = isset($data['strudel']) && is_array($data['strudel']) ? $data['strudel'] : array();
            $part['v'] = 1;
            $music = pilami_strudel_share_validate($part);
            if (is_wp_error($music)) { return $music; }
            unset($music['v']);
        }
        if ($data['mode'] !== 'strudel') {
            $part = isset($data['hydra']) && is_array($data['hydra']) ? $data['hydra'] : array();
            $part['v'] = 1; $part['volume'] = 0;
            $visual = pilami_strudel_share_validate($part);
            if (is_wp_error($visual)) { return $visual; }
            unset($visual['v'], $visual['volume']);
        }
        return array('v' => 2, 'mode' => $data['mode'], 'strudel' => $music, 'hydra' => $visual);
    }
    if (!is_array($data) || !isset($data['v'], $data['code'], $data['name'], $data['volume']) ||
        $data['v'] !== 1 || !is_string($data['code']) || !is_string($data['name']) ||
        !is_numeric($data['volume']) || is_string($data['volume']) ||
        strlen($data['code']) > 65536 || strlen($data['name']) > 400 ||
        trim($data['code']) === '' || strpos($data['code'], "\0") !== false ||
        !is_finite((float) $data['volume']) || $data['volume'] < 0 || $data['volume'] > 100 ||
        wp_check_invalid_utf8($data['code']) !== $data['code'] || wp_check_invalid_utf8($data['name']) !== $data['name']) {
        return new WP_Error('pilami_share_invalid', 'Le morceau est invalide ou dépasse 64 Ko.', array('status' => 400));
    }
    return array('v' => 1, 'code' => $data['code'], 'name' => $data['name'], 'volume' => 0 + $data['volume']);
}

function pilami_strudel_share_create($request) {
    global $wpdb;
    if (strlen($request->get_body()) > 900000) {
        return new WP_Error('pilami_share_size', 'Le morceau dépasse la taille autorisée.', array('status' => 413));
    }
    $data = pilami_strudel_share_validate($request->get_json_params());
    if (is_wp_error($data)) { return $data; }
    if (get_option('pilami_strudel_shares_schema') !== '1') {
        return new WP_Error('pilami_share_storage', 'Le stockage des partages est indisponible.', array('status' => 503));
    }
    // Bound public write traffic; hash the connection address and never store it in snapshots.
    $address = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $rate_key = 'pilami_share_' . substr(hash_hmac('sha256', $address, wp_salt('nonce')), 0, 32);
    $rate = get_transient($rate_key);
    if (!is_array($rate) || $rate['until'] <= time()) { $rate = array('count' => 0, 'until' => time() + HOUR_IN_SECONDS); }
    if ($rate['count'] >= 60) {
        return new WP_Error('pilami_share_rate', 'Trop de demandes de partage. Réessaie dans une heure.', array('status' => 429));
    }
    $rate['count']++;
    set_transient($rate_key, $rate, max(1, $rate['until'] - time()));
    $table = pilami_strudel_shares_table();
    $payload = wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($payload)) { return new WP_Error('pilami_share_json', 'Le morceau est invalide.', array('status' => 400)); }
    $fingerprint = hash('sha256', $payload);
    $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE fingerprint = %s", $fingerprint));
    if ($existing) { return new WP_REST_Response(array('id' => $existing), 200); }
    // No automatic expiry: links remain usable. Bound disk use and new writes.
    $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table");
    $recent = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE created_at >= %s", gmdate('Y-m-d H:i:s', time() - DAY_IN_SECONDS)));
    if ($total >= 10000 || $recent >= 1000) {
        return new WP_Error('pilami_share_capacity', 'La création de nouveaux partages est momentanément indisponible.', array('status' => 429));
    }
    try { $id = bin2hex(random_bytes(12)); }
    catch (Exception $error) { return new WP_Error('pilami_share_random', 'La création du lien est indisponible.', array('status' => 503)); }
    $inserted = $wpdb->insert($table, array('id' => $id, 'fingerprint' => $fingerprint, 'payload' => $payload, 'created_at' => gmdate('Y-m-d H:i:s')), array('%s', '%s', '%s', '%s'));
    if ($inserted === false) {
        // Concurrent requests for the same snapshot reuse the unique fingerprint.
        $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE fingerprint = %s", $fingerprint));
        if ($existing) { return new WP_REST_Response(array('id' => $existing), 200); }
        return new WP_Error('pilami_share_write', 'Impossible d’enregistrer le morceau. Réessaie.', array('status' => 503));
    }
    return new WP_REST_Response(array('id' => $id), 201);
}

function pilami_strudel_share_get($request) {
    global $wpdb;
    $id = $request['id'];
    if (!is_string($id) || !preg_match('/^[a-f0-9]{24}$/D', $id)) {
        return new WP_Error('pilami_share_missing', 'Ce partage est introuvable.', array('status' => 404));
    }
    $table = pilami_strudel_shares_table();
    $payload = $wpdb->get_var($wpdb->prepare("SELECT payload FROM $table WHERE id = %s", $id));
    if (!is_string($payload)) { return new WP_Error('pilami_share_missing', 'Ce partage est introuvable.', array('status' => 404)); }
    $data = pilami_strudel_share_validate(json_decode($payload, true));
    if (is_wp_error($data)) { return new WP_Error('pilami_share_storage', 'Ce partage est illisible.', array('status' => 503)); }
    return new WP_REST_Response($data, 200);
}

add_action('rest_api_init', function () {
    register_rest_route('pilami-strudel/v1', '/shares', array(
        'methods' => 'POST', 'callback' => 'pilami_strudel_share_create', 'permission_callback' => '__return_true',
    ));
    register_rest_route('pilami-strudel/v1', '/shares/(?P<id>[a-f0-9]{24})', array(
        'methods' => 'GET', 'callback' => 'pilami_strudel_share_get', 'permission_callback' => '__return_true',
    ));
});
