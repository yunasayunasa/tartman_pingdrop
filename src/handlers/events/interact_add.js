// src/handlers/events/interact_add.js

/**
 * [interact_add] アクションタグ
 * プレイヤーのInteractorコンポーネントに、対話可能なオブジェクトとしてターゲットを追加します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target - 対話可能になるオブジェクト
 */
export default async function interact_add(interpreter, params, target) {
    const player = interpreter.scene.player;
    if (player && player.components && player.components.Interactor) {
        player.components.Interactor.add(target);
    } else {
        console.warn(`[interact_add] Player or Interactor component not found in scene.`);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
interact_add.define = {
    description: 'ターゲットを、プレイヤーが「対話可能」なオブジェクトのリストに追加します。',
    params: [] // このタグはターゲット指定のみで、追加のパラメータは不要
};