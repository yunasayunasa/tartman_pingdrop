/**
 * [video] タグの処理
 * 指定したレイヤーで動画を再生する
 * @param {Object} params - {storage, layer, loop, mute, nowait}
 */
export function handleVideo(manager, params) {
    const storage = params.storage;
    if (!storage) { console.warn('[video] storageは必須です。'); manager.finishTagExecution(); return; }

    const layerName = params.layer || 'background'; // デフォルトは背景レイヤー
    const targetLayer = manager.layers[layerName];
    if (!targetLayer) { console.warn(`[video] レイヤー[${layerName}]が見つかりません。`); manager.finishTagExecution(); return; }
    
    // --- 動画オブジェクトの作成と設定 ---
    const video = manager.scene.add.video(0, 0, storage).setOrigin(0.5);
    
    // ★★★ DOM要素に、インライン再生とミュート自動再生のための属性を設定 ★★★
    const videoElement = video.video;
    if (videoElement) {
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('muted', 'true');
        videoElement.setAttribute('autoplay', 'true');
    }
    
    // --- 表示設定 ---
    // カメラのサイズを取得して、中央に配置
    const camera = manager.scene.cameras.main;
    video.setPosition(camera.width / 2, camera.height / 2);
    // 画面いっぱいに表示（ENVELOP風）
    const camAspectRatio = camera.width / camera.height;
    const videoAspectRatio = video.width / video.height;
    if (videoAspectRatio > camAspectRatio) {
        video.displayHeight = camera.height;
        video.displayWidth = camera.height * videoAspectRatio;
    } else {
        video.displayWidth = camera.width;
        video.displayHeight = camera.width / videoAspectRatio;
    }

    // ★★★ レイヤーに追加し、一番後ろに配置 ★★★
    targetLayer.add(video);
    if (layerName === 'background') {
        targetLayer.sendToBack(video);
    }
    
    // ★★★ 再生を開始 ★★★
    video.play(params.loop === 'true');

    // --- 完了処理 ---
    if (params.nowait === 'true' || params.loop === 'true') {
        // 待たずに、またはループ再生の場合はすぐに次に進む
        manager.finishTagExecution();
    } else {
        // 通常再生の場合は、再生終了を待つ
        return new Promise(resolve => {
            video.once('complete', () => {
                // console.log(`動画[${storage}]の再生が完了しました。`);
                video.destroy();
                resolve();
            });
        });
    }
}