/**
 * Odyssey Engineの全てのグローバル機能への公式アクセスポイント。
 */
class EngineAPI {
    constructor() {
        this.systemScene = null;
        this.transitionManager = null;
        this.overlayManager = null;
        this.timeManager = null;
        this.gameFlowManager = null;
        this.pendingJumpRequest = null;
    }

    /**
     * SystemSceneによって呼び出され、全てのマネージャーを引き継ぐ。
     * @param {import('../scenes/SystemScene.js').default} systemSceneInstance
     */
    init(systemSceneInstance) {
        this.systemScene = systemSceneInstance;
        this.transitionManager = systemSceneInstance.transitionManager;
        this.overlayManager = systemSceneInstance.overlayManager;
        this.timeManager = systemSceneInstance.timeManager;
        // gameFlowManagerはSystemSceneが直接セットする
    }
    
    
        /**
     * ★★★ 新設：シーンを安全にレジュームするための公式API ★★★
     * GameFlowManagerからの要求を受け、SystemSceneに安全なレジューム処理を依頼する。
     * @param {string} sceneKey - レジュームするシーンのキー
     * @returns {Promise<void>} レジュームが完了したときに解決されるPromise
     */
    requestSafeResume(sceneKey) {
        return new Promise(resolve => {
            if (!this.systemScene || !sceneKey) {
                console.error('[EngineAPI] Cannot request resume. SystemScene or sceneKey is missing.');
                resolve();
                return;
            }
            
            // SystemSceneの内部メソッドを呼び出し、完了時にPromiseを解決する
            this.systemScene._safeResumeScene(sceneKey, () => {
                resolve();
            });
        });
    }


    /**
     * 現在アクティブな最前面のゲームプレイシーンのキーを取得するゲッター。
     * @returns {string | null}
     */
    get activeGameSceneKey() {
        if (!this.systemScene || this.systemScene.sceneStack.length === 0) {
            return null;
        }
        return this.systemScene.sceneStack[this.systemScene.sceneStack.length - 1];
    }

    /**
     * 時間が停止しているかどうかを問い合わせるゲッター。
     * @returns {boolean}
     */
    get isTimeStopped() {
        if (!this.timeManager) return false;
        return this.timeManager.isTimeStopped;
    }
    
    /**
     * APIが利用可能かどうかを確認する。
     * @returns {boolean}
     */
    isReady() {
        return this.systemScene !== null;
    }

    // src/core/EngineAPI.js

/**
 * ゲームフローの状態遷移を要求するイベントを発行する。
 * @param {string} eventName 
 * @param {object} [data={}] イベントに関連するデータ
 */
fireGameFlowEvent(eventName, data = {}) { // ★ data引数を追加
// // console.log(`%c[EngineAPI] Game Flow Event Fired: ${eventName}. Relaying to GameFlowManager.`, 'color: #2196F3; font-weight: bold;');
    if (!this.gameFlowManager) return;
    this.gameFlowManager.handleEvent(eventName, data); // ★ dataを渡す
}

    // --- Scene Transitions ---
    requestSimpleTransition(fromSceneKey, toSceneKey, params = {}) {
        if (!this.transitionManager) return;
        this.transitionManager.handleSimpleTransition({ from: fromSceneKey, to: toSceneKey, params });
    }

    requestReturnToNovel(fromSceneKey, params = {}) {
        if (!this.transitionManager) return;
        this.transitionManager.handleReturnToNovel({ from: fromSceneKey, params });
    }

    requestJump(fromSceneKey, toSceneKey, params = {}) {
// // console.log(`%c[EngineAPI] JUMP request received and PENDING. Waiting for ${fromSceneKey} to shut down.`, 'color: #FFC107; font-weight: bold;');
        this.pendingJumpRequest = { to: toSceneKey, params: params };
    }

    // --- Overlays ---
    requestPauseMenu(fromSceneKey, layoutKey, params = {}) {
        if (!this.overlayManager) return;
        this.overlayManager.openMenuOverlay({ from: fromSceneKey, layoutKey, params });
    }

    runScenarioAsOverlay(fromSceneKey, scenarioFile, blockInput) {
        if (!this.overlayManager || !this.systemScene) {
            return Promise.resolve(); // APIが準備できていなければ即時解決
        }
        
        // Promiseを返すことで、呼び出し元(GameFlowManager)が await できるようにする
        return new Promise(resolve => {
            // 1. "オーバーレイが閉じた" という公式イベントを一度だけリッスンする
            this.systemScene.events.once('overlay-closed', (data) => {
// // console.log(`[EngineAPI] 'overlay-closed' event received. Resolving the promise for runScenarioAsOverlay.`);
                
                // 3. イベントを受け取ったら、Promiseを解決して待機を終了させる
                resolve();
            });

            // 2. オーバーレイの表示をリクエストする
            //    このメソッドの実行自体はすぐに終わる
            this.overlayManager.openNovelOverlay({
                from: fromSceneKey,
                scenario: scenarioFile,
                block_input: blockInput
            });
        });
    }


    requestCloseOverlay(fromSceneKey, overlayData = {}) {
        if (!this.overlayManager) return;
        this.overlayManager.closeOverlay({ from: fromSceneKey, ...overlayData });
    }

    // --- Time Management ---
    stopTime() {
        if (!this.timeManager) return;
        this.timeManager.stopTime();
    }

    resumeTime() {
        if (!this.timeManager) return;
        this.timeManager.resumeTime();
    }

    // --- Misc ---
    fireEvent(eventName, data = null) {
        if (!this.systemScene) return;
        this.systemScene.events.emit(eventName, data);
    }
    
} // ★★★ ここがクラスの正しい閉じ括弧 ★★★

const engineAPI = new EngineAPI();
export default engineAPI;