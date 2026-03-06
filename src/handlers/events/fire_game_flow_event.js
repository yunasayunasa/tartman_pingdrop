// in src/handlers/events/fire_game_flow_event.js

import EngineAPI from '../../core/EngineAPI.js';

/**
 * [fire_game_flow_event]
 * GameFlowManagerにイベントを発行し、ゲーム全体の状態遷移をトリガーする。
 */
export default async function fire_game_flow_event(interpreter, params) {
    const eventName = params.event;

    // --- パラメータのバリデーション ---
    if (!eventName) {
        console.error('[fire_game_flow_event] "event" parameter is required.');
        return;
    }
    
    // --- イベントに付随するデータ (data) の準備 ---
    let eventData = {};
    if (params.data) {
        try {
            // VSLエディタから渡される文字列 '{ "key": "value" }' を
            // JavaScriptが扱えるオブジェクト { key: "value" } に変換する。
            // シングルクォートをダブルクォートに置換して、JSONとしてパース可能にする。
            const jsonString = params.data.replace(/'/g, '"');
            eventData = JSON.parse(jsonString);
        } catch (e) {
            console.error(`[fire_game_flow_event] Invalid format for "data" parameter. Must be a valid JSON string. Received: ${params.data}`, e);
            return;
        }
    }
    
    // --- EngineAPIを通じてイベントを発行 ---
    console.log(`[VSL] Firing Game Flow Event: ${eventName}`, eventData);
    EngineAPI.fireGameFlowEvent(eventName, eventData);
}


// VSLエディタのための定義情報
fire_game_flow_event.define = {
    description: 'ゲーム全体の流れ（ゲームフロー）を制御するイベントを発行します。',
    
    // このタグはオブジェクトをターゲットにしないので、targetパラメータは不要
    isTargeted: false,

    params: [
        { 
            key: 'event', 
            type: 'game_flow_event_select', // ★ 新しいtype: ゲームフローイベントのドロップダウン
            label: 'イベント名', 
            required: true 
        },
        { 
            key: 'data', 
            type: 'string', 
            label: '追加データ (JSON形式)', 
            defaultValue: '{}',
            description: 'イベントに追加情報を渡します。例: {\'scenario\':\'event_01.ks\'}'
        }
    ]
};