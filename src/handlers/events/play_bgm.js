// src/handlers/events/play_bgm.js

/**
 * [play_bgm] アクションタグ
 * BGMを再生します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function play_bgm(interpreter, params) {
    const key = params.key;
    if (!key) {
        console.warn(`[play_bgm] 'key' parameter is missing.`);
        return;
    }
    
    // params.loopが'false'の文字列である場合のみ、ループしない
    const loop = params.loop !== 'false';
    
    const soundManager = interpreter.scene.registry.get('soundManager');
    if (soundManager) {
        soundManager.playBgm(key, loop);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
play_bgm.define = {
    description: 'BGM（背景音楽）を再生します。すでに別のBGMが再生中の場合は、クロスフェードして切り替わります。',
    params: [
        { key: 'key', type: 'asset_key', assetType: 'audio',label: 'BGMアセット名', defaultValue: '' },
        { key: 'loop', type: 'select', options: ['true', 'false'], label: 'ループ再生', defaultValue: true }
    ]
};