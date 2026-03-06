// src/handlers/events/reload_scene.js

/**
 * [reload_scene] アクションタグ
 * 現在のシーンをリロード（再起動）します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function reload_scene(interpreter, params) {
    const scene = interpreter.scene;
    // console.log(`%c[Action] Reloading scene: ${scene.scene.key}`, 'color: red; font-weight: bold;');
    scene.scene.restart();
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
reload_scene.define = {
    description: '現在のシーンをリロード（再起動）します。すべてのオブジェクトが初期状態に戻ります。',
    params: []
};