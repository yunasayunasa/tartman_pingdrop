// src/handlers/events/vignette.js

/**
 * [vignette] アクションタグ
 * 画面にビネット効果（周辺減光）を追加、または削除します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function vignette(interpreter, params) {
    // ★ interpreterから、現在実行中のシーンを取得
    const scene = interpreter.scene;
    if (!scene) return;

    // ビネット画像の管理用キー
    const VIGNETTE_KEY = '__VIGNETTE_OVERLAY__';
    let vignetteImage = scene.children.getByName(VIGNETTE_KEY);

    // パラメータを取得
    const mode = params.mode || 'on';
    const alpha = parseFloat(params.alpha) || 0.7;
    const time = parseInt(params.time, 10) || 1000;
    const texture = params.texture || 'vignette_overlay'; // ★ 事前にロードしておく画像キー

    // カメラの情報を取得
    const cam = scene.cameras.main;
    const camWidth = cam.width;
    const camHeight = cam.height;

    if (mode === 'on') {
        if (!vignetteImage) {
            vignetteImage = scene.add.image(cam.scrollX + camWidth / 2, cam.scrollY + camHeight / 2, texture)
                .setName(VIGNETTE_KEY)
                .setDepth(100000)      // ★ 非常に高いdepthで、常に最前面に
                .setScrollFactor(0); // ★ カメラがスクロールしても、追従しない（画面に固定）
            
            // ★ 画像サイズを、強制的に画面サイズに合わせる
            vignetteImage.setDisplaySize(camWidth, camHeight);
        }
        
        // フェードイン
        vignetteImage.setAlpha(0);
        scene.tweens.add({
            targets: vignetteImage,
            alpha: alpha,
            duration: time
        });

    } else { // 'off'
        if (vignetteImage) {
            // フェードアウトして、完了後に破棄
            scene.tweens.add({
                targets: vignetteImage,
                alpha: 0,
                duration: time,
                onComplete: () => {
                    vignetteImage.destroy();
                }
            });
        }
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
vignette.define = {
    description: '画面全体にビネット効果（周辺減光）を適用します。',
    params: [
        {
            key: 'mode',
            type: 'string', // 将来的に'select'タイプにして 'on'/'off' を選ばせたい
            label: 'モード',
            defaultValue: 'on'
        },
        {
            key: 'alpha',
            type: 'number',
            label: '暗さ (0-1)',
            defaultValue: 0.7
        },
        {
            key: 'time',
            type: 'number',
            label: '時間(ms)',
            defaultValue: 1000
        },
        {
            key: 'texture',
            type: 'asset_key',
            assetType: 'image',
            label: 'ビネット画像',
            defaultValue: 'vignette_overlay'
        }
    ]
};