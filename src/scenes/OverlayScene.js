// src/scenes/OverlayScene.js
//メニューやステータス、アイテム画面やショップなどサブシーンを作るための汎用オーバーレイシーンです
// uiRegistry は外部で定義されているので、インポートは不要な場合があります。
// もしエラーが出る場合は、適宜 import { uiRegistry } from '../ui/index.js'; などを追加してください。
import EngineAPI from '../core/EngineAPI.js'; 
export default class OverlayScene extends Phaser.Scene {
    
    constructor() {
        // ★★★ ポイント1: クラス名とキーを変更 ★★★
        super({ key: 'OverlayScene' }); 
        
        // UISceneと同じプロパティを持つ
        this.uiElements = new Map();
        this.componentsToUpdate = [];
        this.layoutDataKey = null; // どのレイアウトJSONを読み込むかを保持
    }

    // ★★★ ポイント2: init()でレイアウトキーを受け取る ★★★
    init(data) {
        this.layoutDataKey = data.layoutKey || null;
        // console.log(`[OverlayScene] Initialized with layout key: '${this.layoutDataKey}'`);
    }

    // createメソッドは非同期である必要はない
    create() {
        // console.log(`[OverlayScene] Creating overlay with layout '${this.layoutDataKey}'`);
        this.scene.bringToTop();

        // ★★★ ポイント3: onSceneTransition連携を削除し、ロジックを簡素化 ★★★
        const layoutData = this.cache.json.get(this.layoutDataKey);
        
        if (layoutData) {
            this.buildUiFromLayout(layoutData);

            // (オプション) このオーバーレイシーン自体をクリックしたら閉じる、という機能
            // this.input.on('pointerdown', () => this.close());
            
        } else {
            console.error(`[OverlayScene] Layout data for key '${this.layoutDataKey}' not found!`);
            const errorText = this.add.text(this.scale.width / 2, this.scale.height / 2, `Layout not found:\n${this.layoutDataKey}`, { color: 'red', align: 'center' }).setOrigin(0.5);
            // エラー表示をクリックしたらシーンを閉じる
            errorText.setInteractive();
            errorText.on('pointerdown', () => this.close());
        }
    }

    /**
     * このオーバーレイシーンを閉じるようSystemSceneに依頼する
     */
    close() {
       EngineAPI.requestCloseMenu(this.scene.key);
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
 // in src/scenes/OverlayScene.js (and optionally UIScene.js)

applyUiEvents(uiElement) {
    const events = uiElement.getData('events') || [];
    
    uiElement.off('onClick'); // 既存リスナーのクリア

    events.forEach(eventData => {
        if (eventData.trigger === 'onClick') {
            uiElement.on('onClick', () => {
                // ★★★ ここが修正の核心 ★★★
                // --------------------------------------------------------------------
                // this.registry ではなく、this.scene.manager.getScene('SystemScene').registry を使う
                const systemRegistry = this.scene.manager.getScene('SystemScene')?.registry;
                if (!systemRegistry) {
                    console.error("[ApplyEvents] CRITICAL: SystemScene registry not found.");
                    return;
                }
                
                const actionInterpreter = systemRegistry.get('actionInterpreter');
                // --------------------------------------------------------------------
                
                if (actionInterpreter) {
                    // プレイモードのチェックは、UIボタンでは不要なので削除
                    actionInterpreter.run(uiElement, eventData);
                } else {
                    console.error("[ApplyEvents] ActionInterpreter not found in SystemScene registry.");
                }
            });
        }
    });
}

}