import { SCENE_MAP } from './GameFlowManager.js';

export default class SceneTransitionManager {
    /** @type {import('../scenes/SystemScene.js').default} */
    systemScene;

    constructor(systemSceneInstance) {
        this.systemScene = systemSceneInstance;
        this.isProcessing = false;
    }

    /**
     * [jump]や[transition_scene]から呼ばれる、最も基本的なシーン遷移
     * @param {object} data - { from, to, params }
     */
    // src/core/SceneTransitionManager.js
    handleSimpleTransition(data) {
        console.group(`%c[SceneTransitionManager] Group: handleSimpleTransition`, "color: #FF9800;");
        // console.log(`Transition requested:`, data);

        const { from, to, params } = data;
        const finalParams = { ...params };
        // [load_game] の場合
        if (finalParams.loadData && finalParams.loadData.layoutDataKey) {
            finalParams.layoutDataKey = finalParams.loadData.layoutDataKey;
        }
        // [transition_scene] の場合、dataパラメータをlayoutDataKeyとして引き継ぐ
        else if (finalParams.data) {
            finalParams.layoutDataKey = finalParams.data;
        }
        this.systemScene.gameState = (to === 'GameScene') ? 'NOVEL' : 'GAMEPLAY';
        this.systemScene.sceneStack = [to];

        const sceneToStop = this.systemScene.scene.get(from);

        if (sceneToStop?.scene.isActive() && from !== 'UIScene') { // ?.で安全に
            sceneToStop.events.once('shutdown', () => {
                this._startAndMonitorScene(to, finalParams); // ★ 修正したfinalParamsを渡す
            });
            this.systemScene.scene.stop(from);
        } else {
            this._startAndMonitorScene(to, finalParams); // ★ 修正したfinalParamsを渡す
        }
        console.groupEnd();
    }

    /**
     * [return_novel]から呼ばれる、ノベルパートへの復帰
     * @param {object} data - { from, params }
     */
    handleReturnToNovel(data) {
        // console.log(`%c[SceneTransitionManager] Handling return to novel from ${data.from}`, "color: #FF9800; font-weight: bold;");
        const { from, params } = data; // paramsを受け取る

        if (this.systemScene.scene.isActive(from) && from !== 'UIScene') {
            this.systemScene.scene.stop(from);
        }

        // ★ GameSceneに渡すパラメータを構築
        const sceneParams = {
            ...params, // return_novelタグから渡されたパラメータ
            loadSlot: 0,
            charaDefs: this.systemScene.globalCharaDefs
        };
        this._startAndMonitorScene('GameScene', sceneParams);

        this.systemScene.gameState = 'NOVEL';
        this.systemScene.sceneStack = ['GameScene'];
    }


    /**
     * 中核となるシーン起動ヘルパー (SystemSceneから移植)
     * @private
     */
    _startAndMonitorScene(sceneKey, params = {}) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.systemScene.game.input.enabled = false;

        // ★★★ 追加: もし登録されていないシーンなら、動的に追加を試みる ★★★
        if (!this.systemScene.scene.get(sceneKey)) {
            const SceneClass = SCENE_MAP[sceneKey];
            if (SceneClass) {
                this.systemScene.scene.add(sceneKey, SceneClass, false);
            }
        }

        const targetScene = this.systemScene.scene.get(sceneKey);
        if (sceneKey === 'GameScene') {
            // console.log(`[SceneTransitionManager] Attaching a one-time shutdown listener to GameScene.`);
            // GameSceneがシャットダウンするイベントを、一度だけリッスンする
            targetScene.events.once('shutdown', () => {
                // GameSceneが死んだら、SystemSceneのハンドラを呼び出す
                this.systemScene.handleGameSceneShutdown();
            });
        }
        const completionEvent = (sceneKey === 'GameScene') ? 'gameScene-load-complete' : 'scene-ready';

        // src/core/SceneTransitionManager.js
        targetScene.events.once(completionEvent, () => {
            // console.log(`%c[SceneTransitionManager] Event: Scene '${sceneKey}' is READY. Re-enabling input NOW.`, "color: #4CAF50; font-weight: bold;");

            // ★★★ 1. シーンの準備ができたこの瞬間に、入力を再有効化する ★★★
            this.isProcessing = false;
            this.systemScene.game.input.enabled = true;

            // 2. UISceneに通知
            const uiScene = this.systemScene.scene.get('UIScene');
            if (uiScene) {
                uiScene.onSceneTransition(sceneKey);
                this.systemScene.scene.bringToTop('UIScene'); // ★ 念のためここでも一番手前に
            }

            // 3. カメラのフェードインは、入力が有効になった後で行う
            this.systemScene.cameras.main.fadeFrom(300, 0, 0, 0); // コールバックはもう不要

            // 4. 遷移完了イベントも、このタイミングで発行してよい
            this.systemScene.events.emit('transition-complete', sceneKey);
        });

        this.systemScene.scene.run(sceneKey, params);
    }

    // src/core/SceneTransitionManager.js

    /**
     * ゲームの初期シーン（通常はGameScene）を起動する特別なメソッド。
     * @param {string} sceneKey 
     * @param {object} params 
     */
    startInitialScene(sceneKey, params = {}) {
        // console.log(`%c[SceneTransitionManager] Starting initial scene: ${sceneKey}`, "color: #FF9800; font-weight: bold;");
        // プライベートメソッドを呼び出して、実際の処理を開始する
        this._startAndMonitorScene(sceneKey, params);
    }

    // src/core/SceneTransitionManager.js

    /**
     * [jump]タグ専用のシーン遷移ハンドラ。
     * 呼び出し元のScenarioManagerが既にstop()されていることを前提とするため、
     * fromシーンのshutdownを待たずに、即座に次のシーンを開始する。
     * @param {object} data - { from, to, params }
     */
    // src/core/SceneTransitionManager.js
    handleJumpTransition(data) {
        // console.log(`%c[SceneTransitionManager] Handling JUMP transition: ${data.from} -> ${data.to}`, "color: #FF9800; font-weight: bold;");
        const { from, to, params } = data;

        this.systemScene.gameState = 'GAMEPLAY';
        this.systemScene.sceneStack = [to];

        // ★ fromシーンの停止処理は、全てScenarioManagerに任せる。
        // ★ ここでは何もしない。

        // ★ ただ、新しいシーンを開始するだけ。
        this._startAndMonitorScene(to, params);
    }
}