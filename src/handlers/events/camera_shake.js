// src/handlers/events/camera_shake.js

/**
 * [camera_shake] アクションタグ
 * カメラを揺らします。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @returns {Promise<void>} 揺れ完了時に解決されるPromise
 */
export default async function camera_shake(interpreter, params) {
    const time = parseInt(params.time, 10) || 500;
    const power = parseFloat(params.power) || 0.01;

    const camera = interpreter.scene.cameras.main;

    return new Promise(resolve => {
        camera.shake(time, power, false, (cam, progress) => {
            if (progress === 1) {
                resolve();
            }
        });
    });
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
camera_shake.define = {
    description: 'カメラを揺らします。',
    params: [
        { key: 'time', type: 'number', label: '時間(ms)', defaultValue: 500 },
        { key: 'power', type: 'number', label: '強さ (0-1)', defaultValue: 0.01 }
    ]
};