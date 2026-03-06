// src/handlers/events/flash_effect.js

/**
 * [flash_effect] アクションタグ
 * 指定ターゲットの位置に、一瞬だけ光るエフェクトを再生します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target
 */
export default async function flash_effect(interpreter, params, target) {
    if (!target || !target.scene) return;
    const scene = target.scene;

    // パラメータを、定義から取得したデフォルト値とマージ
    const texture = params.texture || flash_effect.define.params.find(p => p.key === 'texture').defaultValue;
    const scale = parseFloat(params.scale) || flash_effect.define.params.find(p => p.key === 'scale').defaultValue;
    const duration = parseInt(params.duration, 10) || flash_effect.define.params.find(p => p.key === 'duration').defaultValue;

    // エフェクト用の画像を生成
    const effect = scene.add.image(target.x, target.y, texture)
        .setScale(scale)
        .setDepth(target.depth + 1) // ターゲットより少しだけ手前に表示
        .setBlendMode(Phaser.BlendModes.ADD); // ★ 加算ブレンドで光らせる

    // Tweenで、一瞬で表示して消すアニメーション
    scene.tweens.add({
        targets: effect,
        alpha: { from: 1, to: 0 },
        duration: duration,
        onComplete: () => {
            effect.destroy();
        }
    });
}

/**
 * ★★★ これが、タグの「自己定義」です ★★★
 */
flash_effect.define = {
    // VSLノードに表示される説明
    description: 'ターゲットの位置に、閃光エフェクトを再生します。',
    // VSLノードが持つパラメータの定義
    params: [
        {
            key: 'texture',         // パラメータ名
            type: 'asset_key',      // UIのタイプ (asset_keyは、アセットブラウザから選ばせるイメージ)
            assetType: 'image',
            label: 'テクスチャ',      // UIに表示されるラベル
            defaultValue: 'spark'   // デフォルト値
        },
        {
            key: 'scale',
            type: 'number',
            label: '拡大率',
            defaultValue: 1.0
        },
        {
            key: 'duration',
            type: 'number',
            label: '表示時間(ms)',
            defaultValue: 200
        }
    ]
};