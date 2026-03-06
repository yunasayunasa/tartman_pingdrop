import { uiRegistry, sceneUiVisibility } from '../ui/index.js';
import { ComponentRegistry } from '../components/index.js';

export default class UIScene extends Phaser.Scene {
    
    constructor() {
        super({ key: 'UIScene', active: false });
        this.uiElements = new Map();
        this.isPanelOpen = false;
        this.componentsToUpdate = [];
       this.activeNovelManager = null;
        // ★ this.menuButton や this.panel プロパティは削除しても良いが、互換性のために残してもOK
    }

  // src/scenes/UIScene.js (修正後のコード)

   async create() {
        this.scene.bringToTop();
        this.isFullyReady = false;

        try {
            const layoutData = this.cache.json.get(this.scene.key);
            await this.buildUiFromLayout(layoutData);

            const systemScene = this.scene.get('SystemScene');
            if (systemScene) {
                systemScene.events.on('transition-complete', this.onSceneTransition, this);
            } else {
                console.warn("UIScene: SystemSceneが見つかりませんでした。");
            }

            // ▼▼▼【ログ爆弾 START】▼▼▼
            // buildUiFromLayout が完了した後、安全に messageWindow を取得してリスナーを設定
            const messageWindow = this.uiElements.get('message_window');
            if (messageWindow) {
                // setInteractiveは registerUiElement の中で呼ばれているはずだが、念のため
                messageWindow.setInteractive();
                
                // 既存のリスナーを一度クリアしてから登録する
                messageWindow.off('pointerdown'); 
                messageWindow.on('pointerdown', (pointer) => {
                    console.log("%c[LOG BOMB | UIScene] messageWindow received a pointerdown event!", "background: orange; color: black;");
                    
                    if (this.activeNovelManager) {
                        console.log("%c[LOG BOMB | UIScene] -> Found activeNovelManager. Calling onClick().", "background: orange; color: black;");
                        this.activeNovelManager.onClick();
                    } else {
                        console.log("%c[LOG BOMB | UIScene] -> activeNovelManager is null. Doing nothing.", "background: orange; color: black;");
                    }
                });
                console.log("%c[LOG BOMB] UIScene: pointerdown listener for 'message_window' is now active.", "color: orange;");
            } else {
                console.error("[LOG BOMB] UIScene: Could not find 'message_window' after UI build.");
            }
            // ▲▲▲【ログ爆-弾 END】▲▲▲

            this.isFullyReady = true;
            this.events.emit('scene-ready');

        } catch (err) {
            console.error("UIScene: create処理中にエラーが発生しました。", err);
            this.add.text(this.scale.width / 2, this.scale.height / 2, 'UIScene FAILED TO INITIALIZE', { color: 'red', fontSize: '32px' }).setOrigin(0.5);
        }
    }
setActiveNovelManager(manager) {
        this.activeNovelManager = manager;
    }
 /***
  * 
  * 
  * コンポーネント系
  * 
  * 
  */

  /**
     * ★★★ 新規メソッド (BaseGameSceneから移植) ★★★
     * UIオブジェクトにコンポーネントをアタッチする
     * @param {Phaser.GameObjects.GameObject} target - アタッチ先のUIオブジェクト
     * @param {string} componentType - コンポーネントのクラス名 (e.g., 'PlayerTrackerComponent')
     * @param {object} [params={}] - コンポーネントに渡すパラメータ
     */
    addComponent(target, componentType, params = {}) {
        // ComponentRegistry は、ゲームのどこからでもアクセスできるように
        // registryに登録されていることを前提とします。
        const ComponentRegistry = this.registry.get('ComponentRegistry');
        if (!ComponentRegistry) {
            console.error("[UIScene] ComponentRegistry not found in game registry.");
            return;
        }

        const ComponentClass = ComponentRegistry[componentType];

        if (ComponentClass) {
            const componentInstance = new ComponentClass(this, target, params);

            if (!target.components) {
                target.components = {};
            }
            target.components[componentType] = componentInstance;

            // ★ もしコンポーネントが update メソッドを持っていたら、更新リストに追加
            if (typeof componentInstance.update === 'function') {
                this.componentsToUpdate.push(componentInstance);
            }

            // console.log(`[UIScene] Component '${componentType}' added to UI element '${target.name}'.`);
        } else {
            console.warn(`[UIScene] Attempted to add an unknown component: '${componentType}'`);
        }
    }

    /**
     * ★★★ 新規メソッド (Phaserのライフサイクルメソッド) ★★★
     * 毎フレーム呼び出され、コンポーネントの更新処理を実行する
     */
    
        update(time, delta) {
  
        // 更新リストに入っているすべてのコンポーネントのupdateを呼び出す
        for (const component of this.componentsToUpdate) {
            // オブジェクトが破棄されていたら、リストから削除する
            if (!component.gameObject || !component.gameObject.active) {
                this.componentsToUpdate = this.componentsToUpdate.filter(c => c !== component);
            } else {
                component.update(time, delta);
            }
        }
    }
/***
 * 
 * 
 * 
 * コンポーネント系ここまで
 * 
 * 
 * 
 */

   // src/scenes/UIScene.js -> buildUiFromLayout()

async buildUiFromLayout(layoutData) {
    // console.log("[UIScene] Starting UI build with FINAL routine.");
    if (!layoutData || !layoutData.objects) return;

    const uiRegistry = this.registry.get('uiRegistry');
    const stateManager = this.registry.get('stateManager');

    for (const layout of layoutData.objects) {
        try {
            const registryKey = layout.registryKey || layout.name;
            if (!registryKey) continue;

            let uiElement = null;

            // --- Step 1: オブジェクトのインスタンスを生成 ---
            if (registryKey === 'Text') {
                uiElement = this.add.text(0, 0, layout.text || '', layout.style || {});
            } else {
                const definition = uiRegistry[registryKey];
                if (definition && definition.component) {
                    const UiComponentClass = definition.component;
                    // ★ layoutにstateManagerを追加してコンストラクタに渡す
                    layout.stateManager = stateManager;
                    uiElement = new UiComponentClass(this, layout);
                }
            }

            if (!uiElement) {
                console.warn(`Could not create UI element for '${layout.name}'`);
                continue;
            }

            // --- Step 2: 重要なデータをオブジェクト自身に保存 ---
            uiElement.setData('registryKey', registryKey);

            // ★★★ ここで、JSONから読み込んだコンポーネント定義を、オブジェクトにアタッチする ★★★
            if (layout.components) {
                uiElement.setData('components', layout.components); // まず永続化データを保存
                layout.components.forEach(compDef => {
                    this.addComponent(uiElement, compDef.type, compDef.params);
                });
            }

            // --- Step 3: 共通の登録・設定処理を呼び出す ---
            // ★ paramsではなく、JSONから読み込んだ生の`layout`を渡すのが最も確実
            this.registerUiElement(layout.name, uiElement, layout);

        } catch (e) {
            console.error(`[UIScene] FAILED to create UI element '${layout.name}'.`, e);
        }
    }
}

// ... (registerUiElementは、当たり判定を与える「究極の解決策」版のままでOKです) ...
    /**
     * ★★★ 以下のメソッドで、既存の registerUiElement を完全に置き換えてください ★★★
     * (setSize/setInteractiveを安全に呼び出す最終確定版)
     */
    /**
     * UI要素を登録し、インタラクティブ化する (最終確定・完成版)
     * ★★★ 以下のメソッドで、既存の registerUiElement を完全に置き換えてください ★★★
     */
   
/**
 * UI要素を登録し、インタラクティブ化する (最終確定・完成版)
 * これまでの registerUiElement を、このメソッドで完全に置き換えてください。
 */
registerUiElement(name, element, params) {
    element.name = name;
    this.add.existing(element);
    this.uiElements.set(name, element);

    if (params.x !== undefined) element.x = params.x;
    if (params.y !== undefined) element.y = params.y;
    if (params.depth !== undefined) element.setDepth(params.depth);
      // ▼▼▼ ログ爆弾 No.1 ▼▼▼
        if (name === 'message_window') {
            // console.log(`%c[LOG BOMB 1] UIScene.registerUiElement: 'message_window' の初期depthを ${params.depth} に設定しました。`, 'color: yellow; font-size: 1.2em;');
        }
    if (params.group) element.setData('group', params.group);
if (params.events) {
        element.setData('events', params.events);
    }
    // --- 当たり判定 (Hit Area) の設定 ---
    let hitArea = null;
    let hitAreaCallback = null;

    // UI要素の当たり判定サイズを決定する
    // 優先順位: 1. params -> 2. element自身のサイズ -> 3. デフォルトサイズ
    const width = params.width || (element.width > 1 ? element.width : 200);
    const height = params.height || (element.height > 1 ? element.height : 100);
    
    // 当たり判定の領域と形状を設定
    element.setSize(width, height);
    hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
    // Containerの場合、当たり判定の中心を左上に合わせる
    hitArea.centerX = width / 2;
    hitArea.centerY = height / 2;
    hitAreaCallback = Phaser.Geom.Rectangle.Contains;

    // --- インタラクティブ化とエディタ登録 ---
    // ▼▼▼【ここが修正の核心です】▼▼▼
    
    // 1. まず、当たり判定を引数にして setInteractive を呼び出す
    element.setInteractive(hitArea, hitAreaCallback);

    // 2. 次に、Phaserの入力システムにドラッグ可能であることを伝える
    this.input.setDraggable(element);

    // 3. 最後に、完全に操作可能になったオブジェクトをエディタプラグインに登録する
    const editor = this.plugins.get('EditorPlugin');
    if (editor && editor.isEnabled) {
        editor.makeEditable(element, this);
    }
    this.applyUiEvents(element);
    // (任意) デバッグ用に当たり判定を可視化する
    // const debugRect = this.add.graphics().lineStyle(2, 0x00ff00).strokeRect(0, 0, width, height);
    // if (element instanceof Phaser.GameObjects.Container) {
    //     element.add(debugRect);
    // }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
}
  // src/scenes/UIScene.js

  // src/scenes/UIScene.js

onSceneTransition(newSceneKey) {
    // ▼▼▼【ここからが、タイミング問題を解決する最終FIXです】▼▼▼
    // --------------------------------------------------------------------
    
    // ★★★ メソッドが呼ばれるたびに、レジストリから最新の定義を直接取得する ★★★
    const uiRegistry = this.registry.get('uiRegistry');
    const sceneUiVisibility = this.registry.get('sceneUiVisibility'); 
    
    // ★★★ ガード節を強化 ★★★
    if (!uiRegistry || !sceneUiVisibility) {
        console.error(`[UIScene.onSceneTransition] CRITICAL: uiRegistry or sceneUiVisibility is not available.`);
        // 重要なデータがないので、UIをすべて非表示にしてエラーを防ぐのが安全
        for (const [name, uiElement] of this.uiElements.entries()) {
            uiElement.setVisible(false);
        }
        return; // 処理を中断
    }
    
    // --------------------------------------------------------------------
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const visibleGroups = sceneUiVisibility[newSceneKey] || [];
    // console.log(`[UIScene.onSceneTransition] Updating UI for '${newSceneKey}'. Visible groups: [${visibleGroups.join(', ')}]`);

    for (const [name, uiElement] of this.uiElements.entries()) {
        const registryKey = uiElement.getData('registryKey');

       if (registryKey) {
            // ▼▼▼【ここを、よりシンプルで確実なロジックに統一】▼▼▼
            const definition = uiRegistry[registryKey];
            
            // ★★★ definitionが存在し、groupsプロパティが配列であることだけを確認 ★★★
            if (definition && Array.isArray(definition.groups)) {
                // 'Text'でも'generic_button'でも、すべてのUIがこの同じロジックで処理される
                const shouldBeVisible = definition.groups.some(group => visibleGroups.includes(group));
                uiElement.setVisible(shouldBeVisible);
            } else {
                // 不明なものは非表示
                uiElement.setVisible(false);
            }
        } else {
            // keyがないものも非表示
            uiElement.setVisible(false);
        }
    }
}
     /**
     * ★★★ 新規追加 ★★★
     * 指定されたUI要素のdepth値を外部から設定するための公式な窓口
     * @param {string} key - 'message_window' などのuiElementsのキー
     * @param {number} depth - 新しいdepth値
     */
    setElementDepth(key, depth) {
        const element = this.uiElements.get(key);
        if (element) {
            element.setDepth(depth);
            // console.log(`[UIScene] Element '${key}' depth set to ${depth}`);
        } else {
            console.warn(`[UIScene] setElementDepth: Element with key '${key}' not found.`);
        }
    }
    
// src/scenes/UIScene.js

    // ... onSceneTransition メソッドなどの後に追加 ...

    /**
     * StateManagerからの変数変更通知を受け取り、
     * "監視" を登録しているUI要素に更新を自動的に委譲する。
     * 存在しないメソッド呼び出しによるTypeErrorを防ぎ、データ駆動の連携を完成させる。
     * @param {string} key - 変更された変数のキー (例: 'player_hp')
     * @param {*} value - 新しい値 (このメソッド内では直接使わないが、将来のために受け取っておく)
     */
   // src/scenes/UIScene.js

    updateHud(key, value) {
        // ★ uiRegistryを、シーンのプロパティとして保持しておくと便利
        if (!this.uiRegistry) this.uiRegistry = this.registry.get('uiRegistry');
        const stateManager = this.registry.get('stateManager');
        if (!this.uiRegistry || !stateManager) return;

        for (const [name, uiElement] of this.uiElements.entries()) {
            // ▼▼▼【ここを元に戻す】▼▼▼
            // registryKeyを元に、uiRegistryから定義を再取得する
            const registryKey = uiElement.getData('registryKey') || name;
            const definition = this.uiRegistry[registryKey];

            // ★★★ registryの'watch'定義に、変更があったキー(key)が含まれているかチェック ★★★
            if (definition && Array.isArray(definition.watch) && definition.watch.includes(key)) {
                
                if (typeof uiElement.updateValue === 'function') {
                    // StateManagerの最新の状態(f)を丸ごと渡す
                    uiElement.updateValue(stateManager.f);
                }
            }
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        }
    }

    
     
   

    /**
     * ★★★ GameSceneからコピー ★★★
     * オブジェクトにプロパティを適用する
     */
    applyProperties(gameObject, layout) {
        gameObject.name = layout.name;
        gameObject.setPosition(layout.x, layout.y);
        gameObject.setScale(layout.scaleX, layout.scaleY);
        gameObject.setAngle(layout.angle);
        gameObject.setAlpha(layout.alpha);
        
        // コンテナの場合、当たり判定のサイズもJSONから設定
        if (gameObject instanceof Phaser.GameObjects.Container) {
            if (layout.width && layout.height) {
                gameObject.setSize(layout.width, layout.height);
            }
        }

        gameObject.setInteractive(); // ★ ここでインタラクティブにする
        
        const editor = this.plugins.get('EditorPlugin');
        if (editor) {
            editor.makeEditable(gameObject, this);
        }
    }
  
   /**
     * 指定された名前のパネルUI要素の表示/非表示を切り替える (Depth制御付き)
     * @param {string} panelName - uiElementsマップに登録されたパネルの名前
     */
    togglePanelByName(panelName) {
        const panelToToggle = this.uiElements.get(panelName);
        if (!panelToToggle) {
            console.error(`togglePanelByName: Panel with name '${panelName}' not found.`);
            return;
        }

        this.isPanelOpen = !this.isPanelOpen;

        const gameHeight = this.scale.height;
        const panelHeight = panelToToggle.height || 120;
        const targetY = this.isPanelOpen 
            ? gameHeight - (panelHeight / 2) 
            : gameHeight + (panelHeight / 2);

       
        if (this.isPanelOpen) {
            // パネルを開くとき：
            // depthを非常に大きな値に設定し、強制的に最前面に持ってくる
            panelToToggle.setDepth(10000); 
            // console.log(`[UIScene] Bringing '${panelName}' to front with depth 100.`);
        }
        
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

        this.tweens.add({
            targets: panelToToggle,
            y: targetY,
            duration: 300,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                if (!this.isPanelOpen) {
                    // パネルを閉じた後：
                    // depthを元に戻すか、低い値に設定する（任意）
                    // これにより、他のUI要素との予期せぬ競合を防ぐ
                    panelToToggle.setDepth(50); // 例えば、通常のUIよりは手前だが、最前面ではない値
                    // console.log(`[UIScene] Resetting '${panelName}' depth to 50.`);
                }
            }
        });
    }
    /*togglePanel() {
        this.isPanelOpen = !this.isPanelOpen;
        const targetY = this.isPanelOpen ? 720 - 60 : 720 + 120;
        this.tweens.add({
            targets: this.panel,
            y: targetY,
            duration: 300,
            ease: 'Cubic.easeInOut'
        });
    }*/

    openScene(sceneKey, data = {}) {
        this.scene.pause('GameScene');
        // Config, Backlog, SaveLoadシーンを開くときは、UI自身も止める
      /*  if (['ConfigScene', 'BacklogScene', 'SaveLoadScene'].includes(sceneKey)) {
            this.scene.pause();
        }*/
        this.scene.launch(sceneKey, data);
    }
    
    toggleGameMode(mode) {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.scenarioManager) {
            const currentMode = gameScene.scenarioManager.mode;
            const newMode = currentMode === mode ? 'normal' : mode;
            gameScene.scenarioManager.setMode(newMode);
        }
    }
  setVisible(isVisible) {
        // console.log(`UIScene: setVisible(${isVisible}) が呼ばれました。`);
        // UIScene内の全ての表示オブジェクトの可視性を切り替える
        if (this.menuButton) this.menuButton.setVisible(isVisible);
        if (this.panel) this.panel.setVisible(isVisible); 
        
        // パネルが開いている状態でも、パネルを非表示にする
        if (!isVisible && this.isPanelOpen) {
            this.isPanelOpen = false; // 状態をリセット
            // Tweenなしで即座に隠す
            if (this.panel) this.panel.y = this.scale.height + 120; 
        }
    }
      /**
     * メッセージウィンドウを画面外へ隠す
     * @param {number} time - アニメーション時間(ms)
     * @returns {Promise<void>} アニメーション完了時に解決されるPromise
     */
    // showMessageWindow と hideMessageWindow を、これで置き換えてください

    hideMessageWindow(time = 0) { // アニメーションはオプションにする
        const messageWindow = this.uiElements.get('message_window');
        if (messageWindow) {
            // 即座に隠す
            messageWindow.y = this.scale.height + (messageWindow.height / 2);
        }
    }

    showMessageWindow(time = 0) {
        this.scene.bringToTop();
        const messageWindow = this.uiElements.get('message_window');
        const layoutData = this.cache.json.get('UIScene');
        if (messageWindow && layoutData) {
            const windowLayout = layoutData.objects.find(obj => obj.name === 'message_window');
            if (windowLayout) {
                // 即座に表示位置に戻す
                messageWindow.y = windowLayout.y;
            }
        }
    }

     /**
     * ★★★ 最終FIX版 ★★★
     * エディタからの要求に応じて、新しいUIコンポーネントを生成・追加する
     * @param {string} registryKey - uiRegistryのキー ('menu_button', 'player_hp_bar'など)
     * @param {string} newName - 新しいUIオブジェクトに付ける名前
     */
    addUiComponentFromEditor(registryKey, newName) {
        // ▼▼▼【ここが核心の修正です】▼▼▼
        // --------------------------------------------------------------------
        // テキストの場合は、これまで通り専用メソッドを呼び出す
        if (registryKey === 'Text') {
            return this.addTextUiFromEditor(newName);
        }

        const uiRegistry = this.registry.get('uiRegistry');
        const stateManager = this.registry.get('stateManager');
        if (!uiRegistry || !stateManager) return null;

        // --- 1. 指定されたキーで、uiRegistryから「設計図」を直接取得 ---
        const definition = uiRegistry[registryKey];

        if (!definition || !definition.component) {
            console.error(`[UIScene] UI definition for key '${registryKey}' not found in uiRegistry.`);
            return null;
        }

        // --- 2. デフォルトのパラメータを準備 ---
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        // ★★★ definition.params を最優先で使う ★★★
        const params = {
            ...definition.params,
            x: centerX,
            y: centerY,
            name: newName,
            stateManager: stateManager
        };

        // --- 3. クラスから新しいインスタンスを生成 ---
        const UiComponentClass = definition.component;
        const newUiElement = new UiComponentClass(this, params);

        // --- 4. シーンに登録し、編集可能にする ---
        this.registerUiElement(newName, newUiElement, params);
        newUiElement.setData('registryKey', registryKey);
        // console.log(`[UIScene] UI Component '${newName}' from registry key '${registryKey}' added.`);

        return newUiElement;
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }
     /**
     * ★★★ 新規メソッド ★★★
     * エディタから、新しいテキストUIオブジェクトを生成する
     */
   /**
     * ★★★ 最終FIX版 ★★★
     * エディタから、新しいテキストUIオブジェクトを生成する
     */
    addTextUiFromEditor(newName) {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        const textObject = this.add.text(centerX, centerY, 'New Text', { 
            fontSize: '32px', 
            fill: '#ffffff' 
        }).setOrigin(0.5);
        
        textObject.setData('registryKey', 'Text');

        // ▼▼▼【このifブロックを、完全に削除します】▼▼▼
        // --------------------------------------------------------------------
        /*
        if (layout.components) { // ← 'layout'は存在しないため、エラーになる
            layout.components.forEach(compDef => {
                this.addComponent(textObject, compDef.type, compDef.params);
            });
        }
        */
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        // registerUiElement を使って、共通のセットアップを行う
        this.registerUiElement(newName, textObject, { name: newName, x: centerX, y: centerY });

        return textObject;
    }
   /**
     * ★★★ グローバルInterpreterを使うように修正 ★★★
     * UIオブジェクトのイベント定義に基づいて、リスナーを設定する
     */
    // in src/scenes/UIScene.js

applyUiEvents(uiElement) {
    const events = uiElement.getData('events') || [];
    
    // 既存のリスナーをクリア
    uiElement.off('onClick');

    // ★★★ デバッグログ（ステップ1）★★★
    // このUI要素がイベント定義を持っているか確認
    if (events.length > 0) {
        // console.log(`[ApplyEvents] Found ${events.length} event(s) for '${uiElement.name}'. Setting up listeners...`);
    } else if (uiElement.name === 'debug_menu_button') {
        console.error(`[ApplyEvents] CRITICAL: '${uiElement.name}' has NO event data!`);
    }

    events.forEach(eventData => {
        // console.log(`[ApplyEvents] Processing event trigger '${eventData.trigger}' for '${uiElement.name}'`);
        if (eventData.trigger === 'onClick') {
            uiElement.on('onClick', () => {
                
                // ★★★ デバッグログ（ステップ2）★★★
                // onClickリスナーが実際に呼ばれたか確認
                // console.log(`%c[ApplyEvents] onClick fired for '${uiElement.name}'!`, 'color: violet');

                const actionInterpreter = this.registry.get('actionInterpreter');
                 // ★★★ 'currentMode' のチェックを完全に削除 ★★★
                if (actionInterpreter) {
                    // console.log(`%c[ApplyEvents] Running ActionInterpreter for '${uiElement.name}'...`, 'background: #222; color: #bada55');
                    actionInterpreter.run(uiElement, eventData);
                } else {
                    console.error("[ApplyEvents] ActionInterpreter not found in registry.");
                }
            });
        }
    });
}


    // in UIScene.js

    /**
     * ★★★ 新規メソッド ★★★
     * 指定されたグループに属する、すべてのUI要素の表示/非表示を切り替える
     * @param {string} groupName - 'hud', 'controls' などのグループ名
     * @param {boolean} visible - 表示するかどうか
     */
    setGroupVisible(groupName, visible) {
        // console.log(`[UIScene] Setting visibility of group '${groupName}' to ${visible}`);
        
        if (!this.uiRegistry) return;

        // すべての管理下にあるUI要素をループ
        for (const [key, uiElement] of this.uiElements.entries()) {
            const definition = this.uiRegistry[key];
            
            // その要素の定義に 'groups' があり、指定されたグループ名を含んでいるかチェック
            if (definition && Array.isArray(definition.groups) && definition.groups.includes(groupName)) {
                uiElement.setVisible(visible);
            }
        }
    }
    
     shutdown() {
        const systemScene = this.scene.get('SystemScene');
        if (systemScene) {
            systemScene.events.off('transition-complete', this.onSceneTransition, this);
        }
    }
}