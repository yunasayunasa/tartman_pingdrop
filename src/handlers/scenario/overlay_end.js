import EngineAPI from '../../core/EngineAPI.js';

export default async function handleOverlayEnd(manager) {
    const overlayScene = manager.scene; // NovelOverlaySceneのインスタンス
    const overlaySceneKey = overlayScene.scene.key;

    // console.log(`%c[overlay_end] Requesting system to close overlay: ${overlaySceneKey}`, "color: green; font-weight: bold;");

    // ★ 汎用的な「閉じる」メソッドに、このシーンが持つ固有の情報を渡す
    EngineAPI.requestCloseOverlay(overlaySceneKey, {
        returnTo: overlayScene.returnTo,
        inputWasBlocked: overlayScene.inputWasBlocked
    });
    
    // 自身のシナリオマネージャーを停止する
    manager.stop();
}