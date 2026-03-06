// src/handlers/events/destroy.js

/**
 * [destroy] アクションタグ
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target - この引数は使わない
 * @param {object} context - runメソッドから渡される { source, target }
 */
export default async function destroy(interpreter, params, target_do_not_use, context) {
    let finalTarget = null;
    const targetId = params.target || 'source';

    if (targetId === 'source') {
        finalTarget = context.source;
    } else if (targetId === 'target') {
        finalTarget = context.target;
    } else {
        finalTarget = interpreter.findTarget(targetId, interpreter.scene, context.source, context.target);
    }
   if (finalTarget && finalTarget.active) {
        // ★★★ 次のフレームで安全に破棄する ★★★
        interpreter.scene.time.delayedCall(0, () => {
            if (finalTarget.active) {
                finalTarget.destroy();
            }
        });
    }
}
/**
 * ★ VSLエ-タ用の自己定義 ★
 */
destroy.define = {
    description: 'ターゲットのオブジェクトをシーンから破壊（削除）します。',
    params: [
        { 
            key: 'target', 
            type: 'select', 
            options: ['source', 'target'], // ★ 'self'をやめて、明確なキーワードにする
            label: 'ターゲット', 
            defaultValue: 'source' // ★ デフォルトも 'source' に
        }
    ]
};