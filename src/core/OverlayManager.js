import NovelOverlayScene from '../scenes/NovelOverlayScene.js';

export default class OverlayManager {
    /** @type {import('../scenes/SystemScene.js').default} */
    systemScene;

    constructor(systemSceneInstance) {
        this.systemScene = systemSceneInstance;
    }

    openMenuOverlay(data) {
        // console.log(`%c[OverlayManager] Launching Menu Overlay (Layout: ${data.layoutKey})`, "color: #00BCD4; font-weight: bold;");
        this.systemScene.scene.launch('OverlayScene', { layoutKey: data.layoutKey, ...data.params });
    }

    openNovelOverlay(data) {
        // console.log(`%c[OverlayManager] Opening Novel Overlay (Scenario: ${data.scenario})`, "color: #00BCD4; font-weight: bold;");
        const { from, scenario, block_input } = data;
        const sceneToLaunch = 'NovelOverlayScene';

        // ★★★ add/removeのロジックは closeOverlay 側に集約するので、ここではシンプルに launch する ★★★
        const shouldBlockInput = (block_input !== false);
        if (shouldBlockInput) {
            const fromScene = this.systemScene.scene.get(from);
            if (fromScene?.scene.isActive()) {
                fromScene.input.enabled = false;
            }
        }

        // 毎回新しいインスタンスで起動するために、キーをユニークにするという手もあるが、
        // shutdownを待つ方が確実。ここではまずaddする。
        if (!this.systemScene.scene.get(sceneToLaunch)) {
             this.systemScene.scene.add(sceneToLaunch, NovelOverlayScene, false);
        }

        this.systemScene.scene.launch(sceneToLaunch, {
            scenario,
            charaDefs: this.systemScene.globalCharaDefs,
            returnTo: from,
            inputWasBlocked: shouldBlockInput
        });
    }

    /**
     * ★★★ ライフサイクル準拠の最終FIX版 ★★★
     * オーバーレイを閉じるリクエストを受け付け、安全にシャットダウンさせてから後処理を行う。
     */
    closeOverlay(data) {
        console.group(`%c[OverlayManager] Group: closeOverlay (Lifecycle-Compliant)`, "color: #00BCD4;");
        // console.log(`Request data:`, data);

        const closingSceneKey = data.from;
        const sceneToClose = this.systemScene.scene.get(closingSceneKey);

        if (!sceneToClose || !sceneToClose.scene.isActive()) {
            console.warn(`[OverlayManager] Scene to close '${closingSceneKey}' not found or not active.`);
            console.groupEnd();
            return;
        }

        // 1. 閉じるシーンの 'shutdown' イベントを一度だけリッスンする
        sceneToClose.events.once('shutdown', () => {
            // console.log(`%c[OverlayManager] CONFIRMED: Scene '${closingSceneKey}' has shut down.`, "color: #E91E63; font-weight: bold;");

            // 3. shutdownが完了したこのタイミングで、シーンを完全に削除する
            //    これにより「キー重複エラー」を完全に防ぐ
            if (closingSceneKey === 'NovelOverlayScene') {
                this.systemScene.scene.remove(closingSceneKey);
                // console.log(`[OverlayManager] Scene '${closingSceneKey}' was completely removed.`);
            }

            // --- ここからが、安全なタイミングで実行される後処理 ---
            const sceneToResumeKey = this.systemScene.sceneStack.length > 0
                ? this.systemScene.sceneStack[this.systemScene.sceneStack.length - 1]
                : null;
            
            if (sceneToResumeKey) {
                const uiScene = this.systemScene.scene.get('UIScene');
                if (uiScene) {
                    uiScene.onSceneTransition(sceneToResumeKey);
                }
            }
            
            if (data.inputWasBlocked) {
                const returnScene = this.systemScene.scene.get(data.returnTo);
                if (returnScene?.scene.isPaused()) {
                    returnScene.input.enabled = true;
                }
            }

            this.systemScene.events.emit('overlay-closed', { from: closingSceneKey, to: sceneToResumeKey });
            // console.log(`Event 'overlay-closed' emitted.`);
            console.groupEnd();
        });

        // 2. シーンに停止命令を出す。後はPhaserが良きに計らってくれる。
        // console.log(`[OverlayManager] Requesting STOP for scene '${closingSceneKey}'. Awaiting shutdown event...`);
        this.systemScene.scene.stop(closingSceneKey);
    }
}