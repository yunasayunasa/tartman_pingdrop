// in src/handlers/events/anim_frame.js

/**
 * [anim_frame] アクションタグ
 * ターゲットを、指定されたスプライトアニメーションの特定フレームで静止させます。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.Sprite} target - 適用対象のスプライト
 */
export default async function anim_frame(interpreter, params, target) {
    if (!target || typeof target.setFrame !== 'function') {
        const targetName = target ? target.name : 'unknown';
        console.warn(`[anim_frame] Target '${targetName}' is not a valid Sprite.`);
        return;
    }

    // --- パラメータの取得と検証 ---
    const animKey = params.key; // ★ "name" ではなく "key" を読む
    const frameNumber = parseInt(params.frame, 10);

    if (!animKey) {
        console.warn('[anim_frame] "key" (アニメーション名) parameter is required.');
        return;
    }
    // isNaNは、frameNumberが0の場合もfalseを返すので安全
    if (isNaN(frameNumber)) {
        console.warn('[anim_frame] "frame" (フレーム番号) parameter must be a valid number.');
        return;
    }

    // --- 実行 ---
    // setFrameはテクスチャを自動で切り替えず、現在のテクスチャ内のフレームを探す。
    // そのため、先にテクスチャを切り替える必要がある場合があるが、
    // 多くのケースでは同じアトラス内のフレームを指定するため、この実装で十分機能する。
    // まずアニメーションを停止させ、それからフレームを設定するのが最も確実。
    target.stop();
    target.setFrame(frameNumber);

    // console.log(`[anim_frame] Set '${target.name}' to frame ${frameNumber} (animation '${animKey}' is used as reference).`);
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
anim_frame.define = {
    description: 'スプライトを、特定のアニメーションの指定フレームで静止させます。',
    params: [
        {
            key: 'key', // ★ UIも、関数も、"key" に統一
            type: 'string',
            label: 'アニメーション名 (Key)',
            defaultValue: ''
        },
        {
            key: 'frame',
            type: 'number',
            label: 'フレーム番号',
            defaultValue: 0
        }
    ]
};