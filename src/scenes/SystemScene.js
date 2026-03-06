import SoundManager from '../core/SoundManager.js';
import GameFlowManager from '../core/GameFlowManager.js';
import EditorUI from '../editor/EditorUI.js';
import EngineAPI from '../core/EngineAPI.js';
import UIScene from './UIScene.js';
import GameScene from './GameScene.js';
import OverlayScene from './OverlayScene.js';
import ActionInterpreter from '../core/ActionInterpreter.js';
import SceneTransitionManager from '../core/SceneTransitionManager.js';
import OverlayManager from '../core/OverlayManager.js';
import TimeManager from '../core/TimeManager.js';

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene' });
        this.overlayManager = null;
        this.globalCharaDefs = null;
        this.isProcessingTransition = false;
        this.initialGameData = null;
        this.novelBgmKey = null;
        this.editorUI = null;
        this.transitionState = 'none';
        this.transitionData = null;
        this.timeManager = null;
        this.gameState = 'INITIALIZING';
        this.transitionManager = null;
        this.sceneStack = [];
    }

    init(data) {
        if (data && data.initialGameData) {
            this.initialGameData = data.initialGameData;
            this.globalCharaDefs = data.initialGameData.charaDefs;
            // console.log('[SystemScene] Global character definitions have been stored.');
        }
    }

    create() {
        // console.log('--- SURGICAL LOG BOMB in SystemScene.create ---');
        try {
            // console.log('this:', this);
            // console.log('this.scene:', this.scene);
            // console.log('this.scene.manager:', this.scene.manager);
            // console.log('this.scene.manager.events:', this.scene.manager.events);
        } catch (e) {
            console.error('!!! LOG BOMB FAILED !!!', e);
        }
        // console.log('--- END OF LOG BOMB ---');
        // console.log(`%c[SYSTEM LOG] SystemScene is now listening for 'request-pause-menu'.`, 'color: #4CAF50; font-size: 1.2em;');
        // console.log("SystemScene: 起動・グローバルサービスのセットアップを開始。");

        const soundManager = new SoundManager(this.game);
        this.registry.set('soundManager', soundManager);
        this.input.once('pointerdown', () => soundManager.resumeContext(), this);
        // console.log("SystemScene: SoundManagerを登録しました。");

        this.transitionManager = new SceneTransitionManager(this);
        this.overlayManager = new OverlayManager(this);
        this.timeManager = new TimeManager(this.game);
        // console.log("[SystemScene] All managers have been instantiated.");

        EngineAPI.init(this);
        // console.log('[SystemScene] EngineAPI has been initialized with all managers.');

        const uiSceneConfig = { physics: { matter: { enable: false } } };
        if (!this.scene.get('UIScene')) {
            this.scene.add('UIScene', UIScene, false, uiSceneConfig);
        }
        this.scene.run('UIScene');
        this.scene.bringToTop('UIScene');
        // console.log('%c[SystemScene] Platform ready: UIScene is now running permanently.', 'color: #4CAF50; font-weight: bold;');

        this.events.on('request-subscene', this._handleRequestSubScene, this);
        this.events.on('request-gamemode-toggle', (mode) => {
            const gameScene = this.scene.get('GameScene');
            if (gameScene && gameScene.scene.isActive() && gameScene.scenarioManager) {
                const currentMode = gameScene.scenarioManager.mode;
                const newMode = currentMode === mode ? 'normal' : mode;
                gameScene.scenarioManager.setMode(newMode);
                // console.log(`モード変更: ${currentMode} -> ${newMode}`);
            }
        });
        this.events.on('request-scene-resume', (sceneKey) => {
            const targetScene = this.scene.get(sceneKey);
            if (targetScene && targetScene.scene.isPaused()) {
                targetScene.scene.resume();
                // console.log(`[SystemScene] Command received. Scene '${sceneKey}' has been resumed.`);
            }
        });

        const actionInterpreter = new ActionInterpreter(this.game);
        this.registry.set('actionInterpreter', actionInterpreter);
        // console.log("SystemScene: ActionInterpreter has been registered globally.");

        this.events.on('request-time-resume', () => {
            this.isTimeStopped = false;
        });

        this.initializeEditor();

        const flowData = this.cache.json.get('game_flow');
        if (flowData) {
            this.gameFlowManager = new GameFlowManager(flowData);
            EngineAPI.gameFlowManager = this.gameFlowManager;
            this.gameFlowManager.start();
        } else {
            console.error('[SystemScene] FATAL: game_flow.json not found in cache.');
        }
    }

    _safeResumeScene(sceneKey, onComplete) {
        const targetScene = this.scene.get(sceneKey);
        if (!targetScene || !this.scene.isPaused(sceneKey)) {
            console.warn(`[SystemScene] _safeResumeScene: Scene '${sceneKey}' cannot be resumed.`);
            if (onComplete) onComplete();
            return;
        }
        targetScene.events.once('resume', () => {
            // console.log(`%c[SystemScene] RESUME COMPLETE for scene: '${sceneKey}'.`, 'color: lightgreen; font-weight: bold;');
            if (onComplete) {
                onComplete();
            }
        });
        this.scene.resume(sceneKey);
    }

    handleGameSceneShutdown() {
        if (EngineAPI.pendingJumpRequest) {
            // console.log(`%c[SystemScene] Detected shutdown of GameScene. Executing pending JUMP request.`, 'color: #4CAF50; font-weight: bold;');
            const request = EngineAPI.pendingJumpRequest;
            this.transitionManager.handleJumpTransition({
                from: 'GameScene',
                to: request.to,
                params: request.params
            });
            EngineAPI.pendingJumpRequest = null;
        }
    }

    handleSceneShutdown(scene) {
        if (scene.scene.key === 'GameScene' && EngineAPI.pendingJumpRequest) {
            // console.log(`%c[SystemScene] Detected shutdown of GameScene. Executing pending JUMP request.`, 'color: #4CAF50; font-weight: bold;');
            const request = EngineAPI.pendingJumpRequest;
            this.transitionManager.startInitialScene(request.to, request.params);
            EngineAPI.pendingJumpRequest = null;
        }
    }

    initializeEditor() {
        const currentURL = window.location.href;
        const isDebugMode = currentURL.includes('?debug=true') || currentURL.includes('&debug=true');
        if (isDebugMode) {
            // console.log("[SystemScene] Debug mode detected. Initializing Editor UI...");
            document.body.classList.add('debug-mode');
            const editorPlugin = this.plugins.get('EditorPlugin');
            if (editorPlugin && editorPlugin.isEnabled) {
                this.editorUI = new EditorUI(this.game, editorPlugin);
                editorPlugin.setUI(this.editorUI);
                this.editorUI.start();
            }
        }
    }

    _startInitialGame(initialData) {
        this.globalCharaDefs = initialData.charaDefs;
        // console.log(`[SystemScene] 初期ゲーム起動リクエストを受信。`);

        const uiSceneConfig = {
            physics: {
                matter: {
                    enable: false
                }
            }
        };

        if (!this.scene.get('UIScene')) {
            this.scene.add('UIScene', UIScene, false, uiSceneConfig);
            // console.log("[SystemScene] UISceneを「物理演算無効」で動的に追加しました。");
        }
        if (!this.scene.get('GameScene')) {
            this.scene.add('GameScene', GameScene, false);
            // console.log("[SystemScene] GameSceneを動的に追加しました。");
        }
        if (!this.scene.get('OverlayScene')) {
            this.scene.add('OverlayScene', OverlayScene, false);
            // console.log("[SystemScene] OverlaySceneを動的に追加しました。");
        }

        const uiScene = this.scene.get('UIScene');
        uiScene.events.once('scene-ready', () => {
            // console.log("[SystemScene] UIScene is ready. Now starting GameScene.");
            this.transitionManager.startInitialScene('GameScene', {
                charaDefs: this.globalCharaDefs,
                startScenario: initialData.startScenario,
            });
        });
        // console.log("[SystemScene] Running UIScene now.");
        this.scene.run('UIScene');
    }

    handleOpenPauseMenu(data) {
        const fromScene = data.from;
        const menuLayoutKey = data.layoutKey;
        const sceneToLaunch = 'OverlayScene';
        if (this.scene.isActive(fromScene)) {
            // console.log(`[SystemScene] Pausing '${fromScene}' to open overlay '${sceneToLaunch}' with layout '${menuLayoutKey}'.`);
            this.scene.pause(fromScene);
            this.sceneStack.push(fromScene);
            this.gameState = 'MENU';
            this.scene.launch(sceneToLaunch, { layoutKey: menuLayoutKey, ...data.params });
        }
    }

    handleClosePauseMenu(data) {
        // console.log("handleClosePauseMenu called with data:", data);
        const closingMenu = data.from;
        if (this.sceneStack.length === 0) {
            console.error("[SystemScene] Close menu requested, but scene stack is empty!");
            return;
        }
        const sceneToResume = this.sceneStack.pop();
        if (sceneToResume) {
            // console.log(`[SystemScene] Closing menu '${closingMenu}' and resuming '${sceneToResume}'.`);
            this.scene.stop(closingMenu);
            if (this.scene.isPaused(sceneToResume)) {
                this.scene.resume(sceneToResume);
            } else {
                this.scene.run(sceneToResume);
                this.scene.bringToTop(sceneToResume);
                this.scene.bringToTop('UIScene');
            }
            this.gameState = (sceneToResume === 'GameScene') ? 'NOVEL' : 'GAMEPLAY';
        }
    }

    _startTransition(data) {
        if (this.isProcessingTransition) return;
        // console.log(`[SystemScene] シーン遷移リクエスト(シンプル版): ${data.from} -> ${data.to}`);
        this.isProcessingTransition = true;
        this.game.input.enabled = false;
        this._performSceneSwitch(data);
    }

    _performSceneSwitch(data) {
        const sceneParams = data.params || {};
        const toScene = this.scene.get(data.to);
        if (!toScene) {
            console.error(`[SystemScene] 遷移先のシーンが見つかりません: ${data.to}`);
            this.isProcessingTransition = false;
            this.game.input.enabled = true;
            return;
        }
        const completionEvent = (data.to === 'GameScene') ? 'gameScene-load-complete' : 'scene-ready';
        toScene.events.once(completionEvent, () => {
            this.isProcessingTransition = false;
            this.game.input.enabled = true;
            // console.log(`[SystemScene] シーン[${data.to}]への遷移が完了しました。`);
            this.events.emit('transition-complete', data.to);
        });
        if (this.scene.isActive(data.from)) {
            this.scene.stop(data.from);
        }
        if (this.scene.isActive('UIScene')) {
            this.scene.get('UIScene').setVisible(false);
        }
        this.scene.run(data.to, sceneParams);
    }

    _onTransitionComplete(sceneKey) {
        this.isProcessingTransition = false;
        this.game.input.enabled = true;
        // console.log(`[SystemScene] シーン[${sceneKey}]の遷移が完了。ゲーム全体の入力を再有効化。`);
        this.events.emit('transition-complete', sceneKey);
    }

    _handleRequestSubScene(data) {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            // console.log(`[SystemScene] Sub-scene request for ${data.targetScene}. Preparing GameScene...`);
            gameScene.performSave(0);
            this.scene.pause('GameScene');
            // console.log("[SystemScene] GameScene has been put to sleep.");
            this.scene.launch(data.targetScene, data.launchData);
        } else {
            // console.log(`[SystemScene] Launching sub-scene ${data.targetScene} directly.`);
            this.scene.launch(data.targetScene, data.launchData);
        }
    }

    _handleRequestGameModeToggle(mode) {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.scene.isActive() && gameScene.scenarioManager) {
            const currentMode = gameScene.scenarioManager.mode;
            const newMode = currentMode === mode ? 'normal' : mode;
            gameScene.scenarioManager.setMode(newMode);
            // console.log(`モード変更: ${currentMode} -> ${newMode}`);
        }
    }

    hexToRgb(hex) {
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;
        return [r, g, b];
    }
}