// シナリオタグとして作るのが、演出には向いています

/**
 * [vignette] タグ
 * 画面にビネット効果（周辺減光）を追加、または削除します。
 * @param {ScenarioManager} manager
 * @param {object} params
 * @param {'on' | 'off'} params.mode - 'on'で表示、'off'で非表示。
 * @param {number} [params.alpha=0.7] - ビネットの暗さ（アルファ値）。
 * @param {number} [params.time=1000] - フェードイン/アウトの時間(ms)。
 */
export default async function vignette(manager, params) {
    const scene = manager.scene;
    const uiScene = scene.scene.get('UIScene'); // UIに重ねるのが簡単
    if (!uiScene) return;

    const VIGNETTE_KEY = 'vignette_overlay_image';
    let vignetteImage = uiScene.children.getByName(VIGNETTE_KEY);

    const mode = params.mode || 'on';
    const alpha = parseFloat(params.alpha) || 0.7;
    const time = parseInt(params.time, 10) || 1000;

    if (mode === 'on') {
        if (!vignetteImage) {
            vignetteImage = uiScene.add.image(
                uiScene.scale.width / 2,
                uiScene.scale.height / 2,
                'vignette_overlay' // ★ 事前にロードしておく画像キー
            );
            vignetteImage.setName(VIGNETTE_KEY);
            vignetteImage.setDepth(99999); // 最前面に
            vignetteImage.setAlpha(0);
        }
        
        // フェードイン
        uiScene.tweens.add({ targets: vignetteImage, alpha: alpha, duration: time });

    } else { // 'off'
        if (vignetteImage) {
            // フェードアウトして、完了後に破棄
            uiScene.tweens.add({
                targets: vignetteImage,
                alpha: 0,
                duration: time,
                onComplete: () => vignetteImage.destroy()
            });
        }
    }
}