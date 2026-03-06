// src/handlers/events/stop_bgm.js

/**
 * [stop_bgm] アクションタグ
 * 現在再生中のBGMを停止します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function stop_bgm(interpreter, params) {
    const time = parseInt(params.time, 10) || 0;
    
    const soundManager = interpreter.scene.registry.get('soundManager');
    if (soundManager) {
        soundManager.stopBgm(time);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
stop_bgm.define = {
    description: '現在再生中のBGMをフェードアウトして停止します。',
    params: [
        { key: 'time', type: 'number', label: 'フェード時間(ms)', defaultValue: 1000 }
    ]
};