/**
 * [image] タグ - 前景画像の表示
 * 
 * 指定されたレイヤーに画像をフェードインで表示します。
 * 主にイベントCGなどの表示に使用します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.storage - 表示する画像のアセットキー (必須)
 * @param {string} [params.layer='cg'] - 表示先のレイヤー名 ('background', 'character', 'cg')
 * @param {number} [params.x] - X座標 (デフォルトは画面中央)
 * @param {number} [params.y] - Y座標 (デフォルトは画面中央)
 * @param {number} [params.time=1000] - フェードイン時間(ms)
 */
export default async function handleImage(manager, params) {
    const { storage, layer = 'cg', x: paramX, y: paramY, time = 1000 } = params;
    const scene = manager.scene;

    if (!storage) {
        console.warn('[image] storage属性は必須です。');
        return;
    }

    const targetLayer = manager.layers[layer];
    if (!targetLayer) {
        console.warn(`[image] レイヤー[${layer}]が見つかりません。有効なレイヤー: background, character, cg`);
        return;
    }
    
    // --- 座標を決定 ---
    const x = paramX !== undefined ? Number(paramX) : scene.scale.width / 2;
    const y = paramY !== undefined ? Number(paramY) : scene.scale.height / 2;

    // --- オブジェクトの生成 ---
    const image = scene.add.image(x, y, storage);
    image.setAlpha(0); //最初は透明
    targetLayer.add(image);

    // --- アニメーション（フェードイン） ---
    const duration = Number(time);
    if (duration > 0) {
        // Tweenの完了をPromiseを使って待つ
        await new Promise(resolve => {
            scene.tweens.add({
                targets: image,
                alpha: 1,
                duration: duration,
                ease: 'Linear',
                onComplete: resolve
            });
        });
    } else {
        // 即時表示
        image.setAlpha(1);
    }
}