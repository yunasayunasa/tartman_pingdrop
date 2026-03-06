// src/handlers/events/stop_sound.js

/**
 * [stop_sound] アクションタグ
 * 指定されたキーの（ループ再生中の）効果音を停止します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function stop_sound(interpreter, params) {
    const key = params.key;
    if (!key) {
        console.warn(`[stop_sound] 'key' parameter is missing.`);
        return;
    }

    const soundManager = interpreter.scene.registry.get('soundManager');
    if (soundManager) {
        soundManager.stopSe(key);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
stop_sound.define = {
    description: '指定したキーの効果音（ループ再生中）を停止します。',
    params: [
        { key: 'key', type: 'asset_key', assetType: 'audio',label: 'SEアセット名', defaultValue: '' }
    ]
};