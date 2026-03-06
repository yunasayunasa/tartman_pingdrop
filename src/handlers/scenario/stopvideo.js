/**
 * [stopvideo] タグの処理
 * 指定したレイヤーの動画をすべて停止・消去する
 */
export function handleStopVideo(manager, params) {
    const layerName = params.layer || 'background';
    const targetLayer = manager.layers[layerName];
    if (!targetLayer) { console.warn(`[stopvideo] レイヤー[${layerName}]が見つかりません。`); manager.finishTagExecution(); return; }

    // レイヤー内のすべてのVideoオブジェクトを探して処理
    targetLayer.list.forEach(item => {
        // Phaserの動画オブジェクトは 'stop' メソッドを持つかで判別
        if (item.stop) {
            // console.log(`動画を停止・消去します:`, item.texture.key);
            item.stop();
            item.destroy();
        }
    });

    manager.finishTagExecution();
}