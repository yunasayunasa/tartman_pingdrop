// src/handlers/events/wait.js

/**
 * [wait] アクションタグ
 * VSLの実行を、指定された時間だけ待機させます。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @returns {Promise<void>} 待機完了時に解決されるPromise
 */
export default async function wait(interpreter, params) {
    const time = parseInt(params.time, 10);

    if (isNaN(time) || time <= 0) {
        return; // 待たずに即座に終了
    }

    return new Promise(resolve => {
        interpreter.scene.time.delayedCall(time, resolve);
    });
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
wait.define = {
    description: '指定した時間(ミリ秒)、アクションの実行を待機します。',
    params: [
        { key: 'time', type: 'number', label: '待機時間(ms)', defaultValue: 1000 }
    ]
};