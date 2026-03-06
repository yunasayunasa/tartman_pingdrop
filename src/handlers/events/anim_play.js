// in src/handlers/events/anim_play.js

/**
 * [anim_play] アクションタグ
 * ターゲットのスプライトアニメーションを再生します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.Sprite} target
 */
export default async function anim_play(interpreter, params, target) {
    // --- ガード節: ターゲットが有効か、アニメーションを再生できるオブジェクトかを確認 ---
    if (!target || typeof target.play !== 'function') {
        const targetName = target ? target.name : 'unknown';
        console.warn(`[anim_play] Target '${targetName}' is not a valid Sprite or cannot play animations.`);
        return;
    }

    // --- パラメータの取得 ---
    const animKey = params.key; // ★ "name" ではなく "key" を読む

    // --- パラメータの検証 ---
    if (!animKey) {
        console.warn(`[anim_play] 'key' (アニメーション名) parameter is missing for target '${target.name}'.`);
        return;
    }

    // --- 実行 ---
    // Phaserのplayメソッドは、存在しないキーを再生しようとしてもエラーにはならず、
    // 現在のアニメーションを停止するだけなので、安全に呼び出せる。
    target.play(animKey, true); // ignoreIfPlaying = true
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
anim_play.define = {
    description: 'スプライトの特定のアニメーションを再生します。',
    params: [
        {
            key: 'key', // ★ UIも、関数も、"key" に統一
            type: 'string',
            label: 'アニメーション名 (Key)',
            defaultValue: ''
        }
    ]
};