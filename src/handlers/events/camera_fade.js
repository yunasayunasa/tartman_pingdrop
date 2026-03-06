// src/handlers/events/camera_fade.js

/**
 * [camera_fade] アクションタグ
 * カメラをフェードインまたはフェードアウトさせます。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @returns {Promise<void>} フェード完了時に解決されるPromise
 */
export default async function camera_fade(interpreter, params) {
    const time = parseInt(params.time, 10) || 1000;
    const type = params.type || 'out';
    const colorStr = params.color || '0x000000';
    
    // 16進数文字列を数値に変換
    const red = parseInt(colorStr.substring(2, 4), 16);
    const green = parseInt(colorStr.substring(4, 6), 16);
    const blue = parseInt(colorStr.substring(6, 8), 16);

    const camera = interpreter.scene.cameras.main;

    return new Promise(resolve => {
        if (type === 'in') {
            camera.fadeIn(time, red, green, blue, (cam, progress) => {
                if (progress === 1) resolve();
            });
        } else { // 'out'
            camera.fadeOut(time, red, green, blue, (cam, progress) => {
                if (progress === 1) resolve();
            });
        }
    });
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
camera_fade.define = {
    description: '画面全体を特定の色でフェードイン/アウトさせます。',
    params: [
        { key: 'type', type: 'string', label: 'タイプ', defaultValue: 'out' },
        { key: 'time', type: 'number', label: '時間(ms)', defaultValue: 1000 },
        { key: 'color', type: 'string', label: '色 (16進数)', defaultValue: '0x000000' }
    ]
};