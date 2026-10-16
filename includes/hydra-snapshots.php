<?php
if (!defined('ABSPATH')) { exit; }

function pilami_hydra_snapshot_valid_bank($bank) {
    if (!is_array($bank) || !isset($bank['signature'], $bank['slots'], $bank['from'], $bank['to'], $bank['duration'], $bank['easingEnabled'], $bank['easingMode'], $bank['easingShape']) ||
        !is_string($bank['signature']) || strlen($bank['signature']) > 131072 || wp_check_invalid_utf8($bank['signature']) !== $bank['signature'] ||
        !is_array(json_decode($bank['signature'], true)) || !is_array($bank['slots']) || !in_array(count($bank['slots']), array(4,10), true) || array_keys($bank['slots']) !== range(0,count($bank['slots'])-1) ||
        !is_int($bank['from']) || !is_int($bank['to']) || $bank['from'] < 0 || $bank['from'] >= count($bank['slots']) || $bank['to'] < 0 || $bank['to'] >= count($bank['slots']) ||
        !pilami_hydra_snapshot_number($bank['duration']) || $bank['duration'] < .1 || $bank['duration'] > 600 || !is_bool($bank['easingEnabled']) ||
        !in_array($bank['easingMode'], array('in','out','in-out'), true) || !in_array($bank['easingShape'], array('sine','quadratic','cubic'), true)) { return false; }
    $slots = array(); $labels = null;
    foreach ($bank['slots'] as $slot) {
        if ($slot === null) { $slots[] = null; continue; }
        if (!is_array($slot) || !isset($slot['values'], $slot['savedAt']) || !is_array($slot['values']) || count($slot['values']) < 1 || count($slot['values']) > 128 ||
            !is_string($slot['savedAt']) || strlen($slot['savedAt']) > 40 || !preg_match('/^[0-9TZ:.+\-]*$/D', $slot['savedAt'])) { return false; }
        $values = array(); $current_labels = array();
        foreach ($slot['values'] as $s) {
            if (!is_array($s) || !isset($s['label'], $s['kind'], $s['value'], $s['min'], $s['max'], $s['step'], $s['sliderStep']) || !array_key_exists('audio', $s) ||
                !is_string($s['label']) || strlen($s['label']) > 500 || wp_check_invalid_utf8($s['label']) !== $s['label'] ||
                !in_array($s['kind'], array('slider','knob','fader','toggle'), true) ||
                !pilami_hydra_snapshot_number($s['value']) || !pilami_hydra_snapshot_number($s['min']) || !pilami_hydra_snapshot_number($s['max']) ||
                $s['min'] >= $s['max'] || $s['value'] < $s['min'] || $s['value'] > $s['max'] ||
                !pilami_hydra_snapshot_step($s['step']) || !pilami_hydra_snapshot_step($s['sliderStep'])) { return false; }
            if ($s['kind'] === 'toggle' && ($s['min'] != 0 || $s['max'] != 1 || $s['step'] != 1 || !in_array($s['value'], array(0,1,0.0,1.0), true))) { return false; }
            $audio = null;
            if ($s['audio'] !== null) {
                $a = $s['audio'];
                if (!is_array($a) || !isset($a['band'], $a['depth']) || !is_int($a['band']) || $a['band'] < 0 || $a['band'] > 47 || !pilami_hydra_snapshot_number($a['depth'])) { return false; }
                $audio = array('band'=>$a['band'], 'depth'=>$a['depth']);
            }
            $current_labels[] = $s['label'];
            $values[] = array('label'=>$s['label'],'kind'=>$s['kind'],'value'=>$s['value'],'min'=>$s['min'],'max'=>$s['max'],'step'=>$s['step'],'sliderStep'=>$s['sliderStep'],'audio'=>$audio);
        }
        if ($labels !== null && $labels !== $current_labels) { return false; } $labels = $current_labels;
        $slots[] = array('values'=>$values,'savedAt'=>$slot['savedAt']);
    }
    $slots = array_pad($slots, 10, null);
    $midi = null;
    if (array_key_exists('midi', $bank)) { $midi = pilami_hydra_midi_valid($bank['midi'], $labels); if ($midi === false) { return false; } }
    $result = array('signature'=>$bank['signature'],'slots'=>$slots,'from'=>$bank['from'],'to'=>$bank['to'],'duration'=>$bank['duration'],
        'easingEnabled'=>$bank['easingEnabled'],'easingMode'=>$bank['easingMode'],'easingShape'=>$bank['easingShape']);
    if ($midi !== null) { $result['midi'] = $midi; }
    return $result;
}
function pilami_hydra_midi_valid($midi, $labels = null) {
    if (!is_array($midi) || !isset($midi['version'], $midi['mappings']) || $midi['version'] !== 1 || !is_array($midi['mappings']) || count($midi['mappings']) > 153 || ($midi['mappings'] && array_keys($midi['mappings']) !== range(0,count($midi['mappings'])-1))) { return false; }
    $result = array(); $seen = array(); $sources = array();
    foreach ($midi['mappings'] as $m) {
        if (!is_array($m) || !isset($m['target'],$m['label'],$m['type'],$m['number'],$m['channel'],$m['inputId'],$m['inputName'],$m['manufacturer']) || !is_string($m['target']) ||
            !preg_match('/^(?:control:(?:0|[1-9][0-9]{0,2})|snapshot:[0-9]|morph:snapshot:[0-9]|morph:(?:forward|reverse|stop|position|duration))$/D',$m['target']) || isset($seen[$m['target']]) ||
            !in_array($m['type'],array('note','cc'),true) || !is_int($m['number']) || $m['number'] < 0 || $m['number'] > 127 || !is_int($m['channel']) || $m['channel'] < 0 || $m['channel'] > 15 ||
            (in_array($m['target'],array('morph:position','morph:duration'),true) && $m['type'] !== 'cc')) { return false; }
        foreach (array('label','inputId','inputName','manufacturer') as $k) { if (!is_string($m[$k]) || strlen($m[$k]) > 1024 || wp_check_invalid_utf8($m[$k]) !== $m[$k]) { return false; } }
        if ($m['inputId'] === '' && $m['inputName'] === '') { return false; }
        if (array_key_exists('inverted',$m) && (!is_bool($m['inverted']) || $m['type'] !== 'cc' || strpos($m['target'],'control:') !== 0)) { return false; }
        if (strpos($m['target'],'control:') === 0) { $i = (int)substr($m['target'],8); if ($i >= 128 || ($labels !== null && (!isset($labels[$i]) || $labels[$i] !== $m['label']))) { return false; } }
        $source = wp_json_encode(array($m['type'],$m['number'],$m['channel'],$m['inputId'],$m['inputName'],$m['manufacturer']));
        $shareable = $m['type'] === 'cc' && strpos($m['target'],'control:') === 0;
        if (isset($sources[$source]) && (!$shareable || !$sources[$source])) { return false; }
        $sources[$source] = $shareable; $seen[$m['target']] = true;
        $result[] = array('target'=>$m['target'],'label'=>$m['label'],'type'=>$m['type'],'number'=>$m['number'],'channel'=>$m['channel'],'inputId'=>$m['inputId'],'inputName'=>$m['inputName'],'manufacturer'=>$m['manufacturer']);
        if (!empty($m['inverted'])) { $result[count($result)-1]['inverted'] = true; }
    }
    return array('version'=>1,'mappings'=>$result);
}
function pilami_hydra_snapshot_number($v) { return (is_int($v) || is_float($v)) && is_finite((float)$v); }
function pilami_hydra_snapshot_step($v) { return $v === 'any' || (pilami_hydra_snapshot_number($v) && $v > 0); }
function pilami_hydra_snapshot_meta($family) { return '_pilami_hydra_snapshot_' . $family; }
function pilami_hydra_snapshot_record($id, $family) {
    $raw = get_post_meta($id, pilami_hydra_snapshot_meta($family), true);
    $raw = is_string($raw) ? $raw : '';
    return array('bank'=>$raw === '' ? null : pilami_hydra_snapshot_valid_bank(json_decode($raw, true)), 'revision'=>hash('sha256',$raw));
}
function pilami_hydra_snapshot_catalog() {
    if (!current_user_can('manage_options')) { return array(); }
    $result = array();
    foreach (get_posts(array('post_type'=>'pilami_hydra','post_status'=>'publish','numberposts'=>-1,'fields'=>'ids')) as $id) {
        $banks = array();
        foreach (get_post_meta($id) as $key=>$values) {
            if (preg_match('/^_pilami_hydra_snapshot_([a-f0-9]{2,16})$/D', $key, $match)) {
                $record = pilami_hydra_snapshot_record($id, $match[1]); if (is_array($record['bank'])) { $banks[$match[1]] = $record; }
            }
        }
        if ($banks) { $result[(string)$id] = $banks; }
    }
    return $result;
}
function pilami_hydra_snapshot_endpoint($request) {
    $id = (int)$request['id']; $family = $request['family']; $post = get_post($id);
    if (!$post || $post->post_type !== 'pilami_hydra' || $post->post_status !== 'publish') { return new WP_Error('pilami_snapshot_missing','Ce preset Hydra est introuvable.',array('status'=>404)); }
    $record = pilami_hydra_snapshot_record($id, $family);
    if ($request->get_method() === 'GET') { return new WP_REST_Response($record,200); }
    $data = $request->get_json_params();
    if (!is_array($data) || strlen($request->get_body()) > 1048576 || !isset($data['bank'], $data['revision']) || !is_string($data['revision']) ||
        !preg_match('/^[a-f0-9]{64}$/D', $data['revision']) || !($bank = pilami_hydra_snapshot_valid_bank($data['bank']))) {
        return new WP_Error('pilami_snapshot_invalid','Les snapshots sont invalides ou dépassent 1 Mo.',array('status'=>400));
    }
    if (!hash_equals($record['revision'],$data['revision'])) { return new WP_Error('pilami_snapshot_conflict','Les snapshots ont changé dans WordPress. Recharge leur version avant de réessayer ; tes captures locales restent conservées.',array('status'=>409)); }
    $key = pilami_hydra_snapshot_meta($family); $previous = get_post_meta($id,$key,true); $json = wp_json_encode($bank, JSON_UNESCAPED_UNICODE);
    if (!$json || strlen($json) > 1048576) { return new WP_Error('pilami_snapshot_invalid','Les snapshots dépassent 1 Mo.',array('status'=>400)); }
    if ($json !== $previous) {
        $written = $previous === '' ? add_post_meta($id,$key,wp_slash($json),true) : update_post_meta($id,$key,wp_slash($json),$previous);
        if (!$written) { return new WP_Error('pilami_snapshot_write','Les snapshots ont changé ou leur enregistrement a échoué. Tes captures locales sont conservées.',array('status'=>409)); }
    }
    if (get_post_meta($id,$key,true) !== $json) { return new WP_Error('pilami_snapshot_write','Impossible de vérifier la sauvegarde WordPress.',array('status'=>503)); }
    return new WP_REST_Response(array('bank'=>$bank,'revision'=>hash('sha256',$json)),200);
}
add_action('rest_api_init', function() {
    register_rest_route('pilami-strudel/v1','/hydra-presets/(?P<id>[1-9][0-9]*)/snapshots/(?P<family>[a-f0-9]{2,16})',array(
        'methods'=>array('GET','POST'),'callback'=>'pilami_hydra_snapshot_endpoint',
        'permission_callback'=>function(){return current_user_can('manage_options');},
    ));
});
