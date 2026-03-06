// src/handlers/events/play_sound.js

/**
 * [play_sound] アクションタグ
 * 効果音（SE）を再生します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function play_sound(interpreter, params) {
    const soundKey = params.key;
    if (!soundKey) {
        console.warn('[play_sound] Missing required parameter: "key".');
        return;
    }

    const soundManager = interpreter.scene.registry.get('soundManager');
    if (!soundManager) return;

    const config = {
        volume: params.volume ? parseFloat(params.volume) : undefined,
        loop: params.loop === 'true'
    };

    soundManager.playSe(soundKey, config);
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
play_sound.define = {
    description: '効果音（SE）を再生します。',
    params: [
      
        { 
            key: 'key', 
            type: 'asset_key',
            assetType: 'audio', // ★ 音声アセットを指定
            
            label: 'SEアセット名', 
            defaultValue: '' 
        },
        { key: 'volume', type: 'number', label: '音量 (0-1)', defaultValue: 1.0 },
        { key: 'loop', type: 'select', options: ['true', 'false'], label: 'ループ再生', defaultValue: false }
    ]
};