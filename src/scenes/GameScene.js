import ScenarioManager from '../core/ScenarioManager.js';
import { tagHandlers } from '../handlers/index.js';
import { uiRegistry } from '../ui/index.js';
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // プロパティの初期化
        this.scenarioManager = null; this.uiScene = null; this.soundManager = null;
        this.stateManager = null; this.layer = {}; this.charaDefs = {};
        this.characters = {}; this.isSceneFullyReady = false; this.loadSlot = null;
        this.choiceButtons = [];     // 表示されるボタンオブジェクトを保持する配列
        this.pendingChoices = [];    // [link]タグで定義された選択肢情報を保持する配列
        this.choiceInputBlocker = null; // クリックブロッカーへの参照
 
    }

    init(data) {
        this.charaDefs = data.charaDefs;
        this.startScenario = data.startScenario || 'test';
        this.loadSlot = data.loadSlot; // ロードするスロット番号を受け取る
        this.returnParams = data.returnParams || null;
    }

    preload() { this.load.text('test', 'assets/test.ks'); }

 async create(data) {
   
        // console.log("GameScene: create処理を開始します。");
        this.cameras.main.setBackgroundColor('#000000');
        
        this.soundManager = this.registry.get('soundManager');
        this.stateManager = this.registry.get('stateManager');
        

        // ★★★ 2. UISceneの準備が完了するまで待機する処理を追加 ★★★
        this.uiScene = this.scene.get('UIScene');
        // UISceneが'scene-ready'イベントを発行するのを待つ
        await new Promise(resolve => {
            if (this.uiScene.scene.isActive()) {
                // UISceneが既に準備完了している場合
                if (this.uiScene.uiElements.size > 0) {
                    resolve();
                } else {
                    // まだ準備中の場合、一度だけイベントを待つ
                    this.uiScene.events.once('scene-ready', resolve);
                }
            } else {
                // UISceneがアクティブでない異常系ケース（念のため）
                resolve();
            }
        });
        // console.log("GameScene: UISceneの準備完了を確認しました。");


        this.layer.background = this.add.container(0, 0).setDepth(0);
        this.layer.cg = this.add.container(0, 0).setDepth(5);
        this.layer.character = this.add.container(0, 0).setDepth(10);
        this.choiceInputBlocker = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height)
            .setInteractive().setVisible(false).setDepth(25);
        
        // ★★★ 3. この時点でmessageWindowは必ず取得できるので、早期リターンは削除 ★★★
        const messageWindow = this.uiScene.uiElements.get('message_window');
        if (!messageWindow) {
            console.error("重大なエラー: message_windowがUISceneに見つかりません。");
            // 致命的なエラーなので、ここで処理を止めるのは妥当
            return; 
        }
this.charaDefs = data.charaDefs || this.scene.get('SystemScene').globalCharaDefs || {};
    // console.log('[GameScene] Character definitions have been set to this scene.', this.charaDefs);
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

    // 2. ScenarioManagerは、コンストラクタの中で `this.scene.charaDefs` を参照して、
    //    自動的にキャラクター定義を取得する
    this.scenarioManager = new ScenarioManager(
        this, 
        messageWindow, 
        this.stateManager, 
        this.soundManager
        // ここに引数を追加する必要はない
    );
        for (const tagName in tagHandlers) { this.scenarioManager.registerTag(tagName, tagHandlers[tagName]); }
        this.stateManager.on('f-variable-changed', this.onFVariableChanged, this);

        // ★★★ 4. performLoadもawaitで待つように変更 ★★★
        if (this.loadSlot !== undefined) {
            await this.performLoad(this.loadSlot, this.returnParams);
            this._finalizeSetup(); // awaitの後に実行
        } else {
            // console.log("[GameScene] 新規ゲーム開始のため、ゲーム変数(f)を初期化します。");
            this.stateManager.f = {};
            await this.scenarioManager.loadScenario(this.startScenario); // loadScenarioも非同期の可能性があるのでawait
            this._finalizeSetup();
            this.performSave(0);
            this.time.delayedCall(10, () => this.scenarioManager.next());
        }
    }


    _finalizeSetup() {
        this.isSceneFullyReady = true;
        this.input.on('pointerdown', () => { if (this.scenarioManager) this.scenarioManager.onClick(); });
        this.events.emit('gameScene-load-complete');
        // console.log("GameScene: 準備完了。SystemSceneに通知しました。");
    }

     /**
     * StateManagerのf変数が変更されたときに呼び出されるリスナー
     * ★★★ 変更された変数がUIに関連する場合のみ、UISceneに通知する ★★★
     * @param {string} key - 変更された変数のキー
     * @param {*} value - 新しい値
     */
    onFVariableChanged(key, value) {
        // シーンの準備が完全に終わっていない場合は、何もしない
        if (!this.isSceneFullyReady) return;

        // ★★★ ここからが修正の核心 ★★★
        
        // 1. uiRegistryを取得する (SystemScene経由などが安全)
        const systemScene = this.scene.get('SystemScene');
        const uiRegistry = systemScene.registry.get('uiRegistry'); // SystemSceneで登録されていると仮定

        if (!uiRegistry) {
            console.warn('[GameScene] uiRegistry not found.');
            return;
        }

        // 2. 変更されたキー(key)が、いずれかのUI要素にwatchされているかチェック
        let isHudVariable = false;
        for (const definition of Object.values(uiRegistry)) {
            if (definition.watch && definition.watch.includes(key)) {
                isHudVariable = true;
                break; // 1つでも見つかればチェック終了
            }
        }
        
        // 3. HUDに関連する変数だった場合のみ、UISceneのupdateHudを呼び出す
        if (isHudVariable) {
            if (this.uiScene && typeof this.uiScene.updateHud === 'function') {
                this.uiScene.updateHud(key, value);
            }
        }
        
        // ★★★ ここまで修正 ★★★
        
        // f.love_meter など、UIに関係ない変数が変更された場合は、このメソッドは何もせずに終了する。
        // これにより、不要なupdateHud呼び出しとTypeErrorを防ぐ。
    }

    displayChoiceButtons() {
        // ブロッカーを表示。depthはcreateで設定済み
        this.choiceInputBlocker.setVisible(true);
        
        const totalButtons = this.pendingChoices.length;
        // Y座標の計算ロジックもあなたのものをそのまま使用
        const startY = (this.scale.height / 2) - ((totalButtons - 1) * 60); 

        this.pendingChoices.forEach((choice, index) => {
            const y = startY + (index * 120);
            
            // ボタンのスタイルもあなたのものをそのまま使用
            const button = this.add.text(this.scale.width / 2, y, choice.text, { fontSize: '40px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }})
                .setOrigin(0.5)
                .setInteractive()
                .setDepth(30); // ★ ボタンを最前面に持ってくる (ブロッカーより手前)
    
            button.on('pointerdown', (pointer, localX, localY, event) => {
                // イベントの伝播を止めて、下のGameSceneのクリックリスナーが反応しないようにする
                event.stopPropagation();
                
                this.scenarioManager.jumpTo(choice.target);
                this.clearChoiceButtons();
                this.scenarioManager.next(); 
            });
    
            this.choiceButtons.push(button);
        });
    
        // 選択肢を表示したら、保留リストはクリアするのが一般的
        this.pendingChoices = [];
    }

    clearChoiceButtons() {
        this.choiceInputBlocker.setVisible(false);
        this.choiceButtons.forEach(button => button.destroy());
        this.choiceButtons = [];
        this.pendingChoices = [];
        
        if (this.scenarioManager) {
            this.scenarioManager.isWaitingChoice = false;
        }
    }

    performSave(slot) {
        try {
            const gameState = this.stateManager.getState(this.scenarioManager);
            const jsonString = JSON.stringify(gameState, null, 2);
            localStorage.setItem(`save_data_${slot}`, jsonString);
            // console.log(`%cスロット[${slot}]にセーブしました。`, "color: limegreen;");
        } catch (e) {
            console.error(`セーブに失敗しました: スロット[${slot}]`, e);
        }
    }

    async performLoad(slot, returnParams = null) {
        
        // console.log(`スロット[${slot}]からのロード処理を開始します。`);
        try {
            const jsonString = localStorage.getItem(`save_data_${slot}`);
            if (!jsonString) {
                console.error(`スロット[${slot}]のセーブデータが見つかりません。`);
                return;
            }
            const loadedState = JSON.parse(jsonString);
            this.stateManager.setState(loadedState);

            if (returnParams) {
                // console.log("復帰パラメータを反映します:", returnParams);
                for (const key in returnParams) {
                    const value = returnParams[key];
                    let evalExp;

                    if (typeof value === 'string') {
                        evalExp = `${key} = \`${value.replace(/`/g, '\\`')}\``; 
                    } else if (typeof value === 'number' || typeof value === 'boolean') {
                        evalExp = `${key} = ${value}`;
                    } else if (typeof value === 'object' && value !== null) {
                        try {
                            const stringifiedValue = JSON.stringify(value).replace(/`/g, '\\`'); 
                            evalExp = `${key} = JSON.parse(\`${stringifiedValue}\`)`;
                        } catch (e) {
                            console.warn(`[GameScene] returnParamsでJSONシリアライズできないオブジェクトが検出されました。スキップします： ${key} =`, value, e);
                            continue; 
                        }
                    } else {
                        console.warn(`[GameScene] 未知の型のreturnParams値が検出されました。スキップします： ${key} =`, value);
                        continue; 
                    }

                    this.stateManager.eval(evalExp);
                }
            }

            await rebuildScene(this, loadedState, this.restoredBgmKey);
            
            this.events.emit('force-hud-update');

            if (loadedState.scenario.isWaitingClick || loadedState.scenario.isWaitingChoice) {
                // console.log("ロード完了: 待機状態のため、ユーザーの入力を待ちます。");
            } else {
                // console.log("ロード完了: 次の行からシナリオを再開します。");
                this.time.delayedCall(10, () => this.scenarioManager.next());
            }
        } catch (e) {
            console.error(`ロード処理でエラーが発生しました。`, e);
        }
    }

    shutdown() {
        if (this.input) this.input.off('pointerdown');
    }
}

async function rebuildScene(scene, loadedState, restoredBgmKey) {
    // console.log("--- 世界の再構築を開始 ---", loadedState);
    const manager = scene.scenarioManager;
try {
    // 1. 現在の表示と状態をクリア
    // scene.clearChoiceButtons(); // clearChoiceButtonsはGameSceneのメソッド
    // console.log("[rebuildScene] Step 1: Clearing current state...");
    scene.layer.background.removeAll(true);
    scene.layer.character.removeAll(true);
    scene.characters = {};
     if (manager.messageWindow) {
            manager.messageWindow.reset();
        } else {
            console.error("%c[rebuildScene] CRITICAL: manager.messageWindow is NULL before reset()!", "color: red; font-size: 1.5em;");
            // ここでエラーを投げて、以降の処理を止めるのが安全
            throw new Error("messageWindow is not available."); 
        }
    scene.cameras.main.resetFX();

    // 2. シナリオの論理的な状態を復元
    // console.log("[rebuildScene] Step 2: Restoring scenario state...");
    await manager.loadScenario(loadedState.scenario.fileName);
    manager.currentLine = loadedState.scenario.line;
    manager.ifStack = loadedState.scenario.ifStack || [];
    manager.callStack = loadedState.scenario.callStack || [];
    manager.isWaitingClick = loadedState.scenario.isWaitingClick;
    manager.isWaitingChoice = loadedState.scenario.isWaitingChoice;

    // 3. 背景を復元
    // console.log("[rebuildScene] Step 3: Restoring background...");
    if (loadedState.layers.background) {
        const bg = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, loadedState.layers.background);
        bg.setDisplaySize(scene.scale.width, scene.scale.height);
        scene.layer.background.add(bg);
    }
    
    // 4. キャラクターを復元
    // console.log("[rebuildScene] Step 4: Restoring characters...");
    if (loadedState.layers.characters) {
        for (const name in loadedState.layers.characters) {
            const charaData = loadedState.layers.characters[name];
            const chara = scene.add.image(charaData.x, charaData.y, charaData.storage);
            chara.setScale(charaData.scaleX, charaData.scaleY).setAlpha(charaData.alpha).setFlipX(charaData.flipX).setTint(charaData.tint);
            scene.layer.character.add(chara);
            scene.characters[name] = chara;
        }
    }

    // 5. BGMを復元
    // console.log("[rebuildScene] Step 5: Restoring BGM...");
    const targetBgmKey = restoredBgmKey || loadedState.sound.bgm;
    if (targetBgmKey) {
        manager.soundManager.playBgm(targetBgmKey);
    } else {
        manager.soundManager.stopBgm();
    }

    // 6. メッセージウィンドウと選択肢を復元
    // console.log("[rebuildScene] Step 6: Restoring message window content...");
    if (loadedState.scenario.isWaitingClick) {
        await manager.messageWindow.setText(loadedState.scenario.currentText, false, loadedState.scenario.speakerName);
        manager.messageWindow.showNextArrow();
    }
    // if (loadedState.scenario.isWaitingChoice) { ...選択肢の復元処理... }
    
    // console.log("--- 世界の再構築完了 ---");
     } catch (error) {
        // ★★★ どのステップでエラーが起きても、必ずここで捕捉される ★★★
        console.error("%c[rebuildScene] FATAL ERROR during scene reconstruction:", "color: red; font-size: 1.5em;", error);
     }
}