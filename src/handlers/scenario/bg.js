/**
 * [bg] タグ - 背景の表示・切り替え
 * 
 * 背景画像またはビデオを表示します。
 * 既存の背景がある場合は、クロスフェードで切り替えます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.storage - 表示する画像またはビデオのアセットキー (必須)
 * @param {number} [params.time=1000] - クロスフェード時間(ms)
 */
export default async function handleBg(manager, params) {
    const { storage, time = 1000 } = params;
    const scene = manager.scene;

    if (!storage) {
        console.warn('[bg] storage属性は必須です。');
        return;
    }

    const bgLayer = manager.layers.background;
    const gameWidth = scene.scale.width;
    const gameHeight = scene.scale.height;

    // --- 1. 新しい背景オブジェクトを作成 ---
    let newBg;
    if (scene.cache.video.has(storage)) {
        newBg = scene.add.video(gameWidth / 2, gameHeight / 2, storage);
        // SoundManagerから現在のBGM音量を取得して設定
        newBg.setVolume(manager.soundManager.getVolume('bgm'));
        newBg.play(true); // ループ再生
    } else if (scene.textures.exists(storage)) {
        newBg = scene.add.image(gameWidth / 2, gameHeight / 2, storage);
    } else {
        console.warn(`[bg] アセット[${storage}]が見つかりません。`);
        return;
    }

    newBg.setDisplaySize(gameWidth, gameHeight);
    newBg.setAlpha(0);
    bgLayer.add(newBg);
    
    // --- 2. クロスフェード処理 ---
    const duration = Number(time);
    const oldBg = bgLayer.list.length > 1 ? bgLayer.getAt(0) : null;
    const promises = [];

    // a. 新しい背景をフェードイン
    const fadeInPromise = new Promise(resolve => {
        scene.tweens.add({
            targets: newBg,
            alpha: 1,
            duration: duration,
            ease: 'Linear',
            onComplete: resolve
        });
    });
    promises.push(fadeInPromise);

    // b. 古い背景があればフェードアウトして破棄
    if (oldBg) {
        const fadeOutPromise = new Promise(resolve => {
            scene.tweens.add({
                targets: oldBg,
                alpha: 0,
                duration: duration,
                ease: 'Linear',
                onComplete: () => {
                    if (typeof oldBg.stop === 'function') { // is a video
                        oldBg.stop();
                    }
                    oldBg.destroy();
                    resolve();
                }
            });
        });
        promises.push(fadeOutPromise);
    }
    
    // c. ★★★ 全てのアニメーションが完了するのを待つ ★★★
    await Promise.all(promises);
}