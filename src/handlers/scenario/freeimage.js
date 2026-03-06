/**
 * [freeimage] タグ - 前景画像の全消去
 * 
 * 指定されたレイヤーにある全ての画像を、フェードアウトさせてから破棄します。
 * 主にイベントCGなどを画面から消去する際に使用します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} [params.layer='cg'] - 消去対象のレイヤー名 ('background', 'character', 'cg')
 * @param {number} [params.time=1000] - フェードアウト時間(ms)
 */
export default async function handleFreeImage(manager, params) {
    const { layer = 'cg', time = 1000 } = params;
    const scene = manager.scene;

    const targetLayer = manager.layers[layer];
    if (!targetLayer) {
        console.warn(`[freeimage] レイヤー[${layer}]が見つかりません。`);
        return;
    }
    
    // 消去対象のオブジェクトがない場合は、何もせずに即座に完了
    if (targetLayer.list.length === 0) {
        return;
    }

    const duration = Number(time);

    // --- アニメーション（フェードアウト） ---
    if (duration > 0) {
        // レイヤー内の全オブジェクトに対するTweenの完了を待つ
        await new Promise(resolve => {
            scene.tweens.add({
                targets: targetLayer.list, // レイヤー内の全オブジェクトが対象
                alpha: 0,
                duration: duration,
                ease: 'Linear',
                onComplete: resolve
            });
        });
    }
    
    // --- オブジェクトの破棄 ---
    // フェードアウト後、または即座に実行
    targetLayer.removeAll(true); // レイヤー内の全オブジェクトを破棄
    
    // もしキャラクターレイヤーをクリアした場合は、管理オブジェクトも空にする
    if (layer === 'character') {
        scene.characters = {};
    }
}