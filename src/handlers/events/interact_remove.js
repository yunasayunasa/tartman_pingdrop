// src/handlers/events/interact_remove.js

/**
 * [interact_remove] アクションタグ
 * プレイヤーのInteractorコンポーネントから、対話可能なオブジェクトを削除します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target - 対話不能になるオブジェクト
 */
export default async function interact_remove(interpreter, params, target) {
    const player = interpreter.scene.player;
    if (player && player.components && player.components.Interactor) {
        player.components.Interactor.remove(target);
    } else {
        console.warn(`[interact_remove] Player or Interactor component not found in scene.`);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
interact_remove.define = {
    description: 'ターゲットを、プレイヤーが「対話可能」なオブジェクトのリストから削除します。',
    params: []
};