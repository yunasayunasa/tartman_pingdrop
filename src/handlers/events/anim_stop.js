// src/handlers/events/anim_stop.js

/**
 * [anim_stop] アクションタグ
 * ターゲットの現在のアニメーションを停止させます。
 * @param {ActionInterpreter} interpreter
 * @param {object} params - このタグではパラメータは使用しません
 * @param {Phaser.GameObjects.Sprite} target
 */
export default async function anim_stop(interpreter, params, target) {
    if (target && typeof target.stop === 'function') {
        target.stop();
    } else {
        const targetName = target ? target.name : 'unknown';
        console.warn(`[anim_stop] Target '${targetName}' cannot stop animation.`);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
anim_stop.define = {
    description: 'スプライトの現在のアニメーションを停止させ、最初のフレームに戻します。',
    // このタグはパラメータを取らないので、params配列は空にします。
    params: []
};