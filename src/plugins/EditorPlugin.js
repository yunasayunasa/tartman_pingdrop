import { ComponentRegistry } from '../components/index.js';
/**
 * Odyssey EngineのインゲームIDE機能を提供するPhaserプラグイン。
 * オブジェクトの選択、プロパティ編集、レイアウトのエクスポート機能などを管理する。
 */
export default class EditorPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);
        this.selectedObject = null;
        this.editableObjects = new Map();
        this.isEnabled = false;
        this.editorUI = null;
        this.currentMode = 'select'; 
        // DOM要素の参照
        this.editorPanel = null;
        this.editorTitle = null;
        this.editorPropsContainer = null;
        this.animEditorOverlay = null;
        this.animEditorCloseBtn = null;
        this.eventEditorOverlay = null;
        this.eventEditorCloseBtn = null;

        // UI更新処理の無限再帰呼び出しを防ぐためのフラグ
        this._isUpdatingPanel = false;

        this.layerStates = []; // ★ レイヤーの状態を保持
        this.selectedLayer = null;
       
    }
   

    init() {
        // デバッグモードでなければ即時終了
        const currentURL = window.location.href;
        if (!currentURL.includes('debug=true')) return;
        this.isEnabled = true;

        // DOM要素を取得
        this.editorPanel = document.getElementById('editor-panel');
        this.editorTitle = document.getElementById('editor-title');
        this.editorPropsContainer = document.getElementById('editor-props');
        
        this.animEditorOverlay = document.getElementById('anim-editor-overlay');
        this.animEditorCloseBtn = document.getElementById('animation-editor-close-btn');
        if (this.animEditorCloseBtn) {
            this.animEditorCloseBtn.addEventListener('click', () => this.closeAnimationEditor());
        }
        
        this.eventEditorOverlay = document.getElementById('event-editor-overlay');
        this.eventEditorCloseBtn = document.getElementById('event-editor-close-btn');
     

        console.warn("[EditorPlugin] Debug mode activated.");
    }
   
 /**
     * ★★★ 復活させるメソッド ★★★
     * すべてのシーンの `create` が完了した後に一度だけ呼ばれる。
     * このタイミングでUIにPhaserのイベントリスンを開始させるのが最も安全。
     */
    start() {
        if (!this.isEnabled) return;
        if (this.editorUI) {
            // ★ UIの準備ができたことを通知し、レイヤーパネルを初期構築させる
            this.editorUI.onPluginReady(); 
            this.editorUI.startListeningToGameInput();
            
        }
    }
    getActiveGameScene() { // ★ EditorUIから移動・統合
        const scenes = this.pluginManager.game.scene.getScenes(true);
        for (const scene of scenes) {
            const key = scene.scene.key;
            // UISceneやSystemSceneを除外する条件をより堅牢に
            if (scene.sys.isActive() && key !== 'UIScene' && key !== 'SystemScene' && key !== 'PreloadScene') {
                return scene;
            }
        }
        return null;
    }
    setUI(editorUI) {
        this.editorUI = editorUI;
        // ★★★ このメソッドは、UIへの参照を保持するだけにする ★★★
        // ★★★ イベントリスナーの登録は、ここで行わない ★★★
    }

 /**
     * ★★★ 修正版 ★★★
     * UIから渡された最新のレイヤー状態を保存し、シーンに即時反映させる
     */
    updateLayerStates(layers) {
        this.layerStates = layers;
        this.applyLayerStatesToScene(); // ★ 状態が更新されたら、すぐに適用処理を呼び出す
    }
// in src/plugins/EditorPlugin.js

/**
 * ★★★ 最終・最シンプル版 ★★★
 * 現在アクティブなゲームシーンをリスタートさせることで、エディタの状態を完全にリフレッシュする
 */
refresh() {
    console.log('%c[EditorPlugin] Refreshing via Scene Restart...', 'color: #FF9800; font-weight: bold;');

    // 1. 現在アクティブな「ゲームプレイシーン」を取得する
    let activeScene = null;
    const allScenes = this.pluginManager.game.scene.getScenes(true);
    for (const scene of allScenes) {
        if (scene.scene.key !== 'SystemScene' && scene.scene.key !== 'UIScene') {
            activeScene = scene;
            break;
        }
    }

    if (activeScene) {
        // 2. シーンに再起動を命令する
        console.log(`[EditorPlugin] Restarting scene: '${activeScene.scene.key}'`);
        activeScene.scene.restart();

        // alertは不要（シーンがリロードされるので）
    } else {
        console.warn('[EditorPlugin] No active game scene found to restart.');
        alert('リスタートするアクティブなゲームシーンが見つかりません。');
    }
}
    panCamera(dx, dy) {
        if (!this.isEnabled) return;
        const camera = this.getActiveGameCamera();
        if (camera) {
            camera.scrollX += dx / camera.zoom;
            camera.scrollY += dy / camera.zoom;
        }
    }

    zoomCamera(amount) {
        if (!this.isEnabled) return;
        const camera = this.getActiveGameCamera();
        if (camera) {
            const newZoom = Phaser.Math.Clamp(camera.zoom + amount, 0.2, 5);
            camera.setZoom(newZoom);
        }
    }

    resetCamera() {
        if (!this.isEnabled) return;
        const camera = this.getActiveGameCamera();
        if (camera) {
            camera.setZoom(1);
            camera.centerOn(camera.width / 2, camera.height / 2);
        }
    }

    getActiveGameCamera() {
        const scenes = this.pluginManager.game.scene.getScenes(true);
        for (const scene of scenes) {
            const key = scene.scene.key;
            if (key !== 'GameScene' && key !== 'UIScene' && key !== 'SystemScene') {
                return scene.cameras.main;
            }
        }
        return null;
    }

   // in EditorPlugin.js

    // in src/plugins/EditorPlugin.js
/**
* タイルマップ用メソッド
*/
// in EditorPlugin.js

/**
 * ★★★ 新設 ★★★
 * EditorUIからの依頼で、クロップされたタイルマップ断片の配置をゲームシーンに指示する
 * @param {string} tilemapKey - 元となるタイルマップのアセットキー
 * @param {{x: number, y: number, width: number, height: number}} cropRect - クロップする矩形範囲
 */
placeCroppedTilemap(tilemapKey, cropRect) {
    const scene = this.getActiveGameScene();
    if (!scene) {
        alert("Cannot place tilemap chunk: No active game scene found.");
        return;
    }

    if (typeof scene.addCroppedTilemapChunk !== 'function') {
        alert("Error: The active scene does not support adding cropped tilemap chunks.");
        return;
    }

    // ゲームシーンの専門メソッドに処理を丸投げする
    scene.addCroppedTilemapChunk(tilemapKey, cropRect);
}
/**
 * ★★★ アニメーションボタン復活・最終確定版 ★★★
 * プロパティパネルを更新する。
 * 複数選択、単体選択、レイヤー選択、無選択の4つの状態を正しく処理する。
 */
updatePropertyPanel() {
    // --- ガード節1: 多重実行防止 ---
    if (this._isUpdatingPanel) return;
    this._isUpdatingPanel = true;

    try {
        // --- ガード節2: 必須DOM要素の確認 ---
        if (!this.editorPropsContainer || !this.editorTitle) {
            console.warn("[EditorPlugin] Property panel DOM elements not found. Aborting update.");
            return;
        }
        
        // --- UIクリア ---
        this.editorPropsContainer.innerHTML = '';

        // --- 状態確認: 選択オブジェクトが破棄されていないか ---
        if (this.selectedObject && (!this.selectedObject.scene || !this.selectedObject.active)) {
            this.selectedObject = null;
        }
        if (this.selectedObjects && this.selectedObjects.length > 0) {
            this.selectedObjects = this.selectedObjects.filter(obj => obj && obj.active);
            if (this.selectedObjects.length === 0) {
                this.deselectAll();
                return;
            }
        }
        
        // ================================================================
        // --- ケース1：複数オブジェクト選択中 ---
        // ================================================================
        if (this.selectedObjects && this.selectedObjects.length > 0) {
            this.editorTitle.innerText = `${this.selectedObjects.length} objects selected`;
            this.safeCreateUI(this.createMultiSelectUI);
        }  
        // ================================================================
        // --- ケース2：単体オブジェクト選択中 ---
        // ================================================================
        else if (this.selectedObject) {
            this.editorTitle.innerText = `編集中: ${this.selectedObject.name}`;
            
            // --- Step 1: オブジェクトの種類を判定する ---
            const uiRegistry = this.game.registry.get('uiRegistry');
            let isUiComponent = false;
            let registryKey = null;

            if (uiRegistry) {
                for (const key in uiRegistry) {
                    // ▼▼▼【ここがエラーを解決する修正です】▼▼▼
                    // --------------------------------------------------------------------
                    // ★★★ 1. uiRegistry[key].component が有効な関数(クラス)であるか、まずチェック ★★★
                    const componentClass = uiRegistry[key]?.component;

                    if (typeof componentClass === 'function' && this.selectedObject instanceof componentClass) {
                        isUiComponent = true;
                        registryKey = key;
                        break;
                    }
                    // --------------------------------------------------------------------
                    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
                }
            }
            if (this.selectedObject instanceof Phaser.GameObjects.Text) {
                isUiComponent = true;
            }

            // --- Step 2: UIを順番に生成していく ---
            // (共通ヘッダーUIは変更なし)
            this.safeCreateUI(this.createArrayToolSection);
            this.editorPropsContainer.appendChild(document.createElement('hr'));
            this.safeCreateUI(this.createNameInput);
            this.safeCreateUI(this.createLayerSelect);
            this.safeCreateUI(this.createGroupInput);
            this.editorPropsContainer.appendChild(document.createElement('hr'));
            
            // --- 種類別の専用UI ---
            if (isUiComponent) {
                // (UIコンポーネントの場合のロジックは変更なし)
                if (this.selectedObject instanceof Phaser.GameObjects.Text) {
                    this.safeCreateUI(this.createTextPropertiesUI);
                } else if (registryKey?.includes('button')) {
                    this.safeCreateUI(this.createUIButtonPropertiesUI);
                } else if (registryKey?.includes('bar')) {
                    this.safeCreateUI(this.createUIBarPropertiesUI);
                }
            } else {
                // ★ UIコンポーネントではない、通常のゲームオブジェクトの場合
                this.safeCreateUI(this.createPhysicsSection);
                this.editorPropsContainer.appendChild(document.createElement('hr'));

                // 1. もしオブジェクトがSpriteなら、「アニメーション設定」ボタンを表示
                if (this.selectedObject instanceof Phaser.GameObjects.Sprite) {
                    this.safeCreateUI(this.createAnimationSection);
                    this.editorPropsContainer.appendChild(document.createElement('hr'));
                }
                // 2. もしオブジェクトがImageなら、「スプライトに変換」ボタンを表示
                else if (this.selectedObject instanceof Phaser.GameObjects.Image) {
                    const convertButton = document.createElement('button');
                    convertButton.innerText = 'スプライトに変換してアニメーションを設定';
                    convertButton.onclick = () => { this.convertImageToSprite(); };
                    this.editorPropsContainer.appendChild(convertButton);
                    this.editorPropsContainer.appendChild(document.createElement('hr'));
                }
            }

            // --- すべてのオブジェクトで共通のUI ---
            // (createTransformInputs, createEventSectionなどは変更なし)
            this.safeCreateUI(this.createTransformInputs);
            this.safeCreateUI(this.createDepthInput);
            this.editorPropsContainer.appendChild(document.createElement('hr'));
            this.safeCreateUI(this.createEventSection);
            this.editorPropsContainer.appendChild(document.createElement('hr'));
            this.safeCreateUI(this.createComponentSection);
            this.editorPropsContainer.appendChild(document.createElement('hr'));
            this.safeCreateUI(this.createAnimationPrefixInput);
            this.editorPropsContainer.appendChild(document.createElement('hr'));
this.safeCreateUI(this.createCustomDataSection);
this.editorPropsContainer.appendChild(document.createElement('hr'));
            // --- 共通フッターUI ---
            this.safeCreateUI(this.createExportButton);
            this.safeCreateUI(this.createExportPrefabButton);
            this.safeCreateUI(this.createDeleteObjectButton);
        } 
    
        // ================================================================
        // --- ケース3：レイヤー選択中 ---
        // ================================================================
        else if (this.selectedLayer) {
            this.editorTitle.innerText = `Editing Layer: ${this.selectedLayer.name}`;
            this.safeCreateUI(this.createLayerPropertiesUI);
        } 
        // ================================================================
        // --- ケース4：何も選択されていない ---
        // ================================================================
        else {
            this.editorTitle.innerText = 'No Object Selected';
        }

    } catch (error) {
        console.error("%c[updatePropertyPanel] UNEXPECTED FATAL CRASH:", "color: red; font-size: 1.2em;", error);
    } 
    finally {
        // --- 最後に必ずフラグを戻す ---
        this._isUpdatingPanel = false;
    }
}
// in src/plugins/EditorPlugin.js

/**
 * ★★★ 新設 ★★★
 * オブジェクトの汎用カスタムデータを編集するためのUIを生成する
 */
createCustomDataSection() {
    const title = document.createElement('h4');
    title.innerText = 'カスタムデータ';
    title.style.margin = '10px 0 5px 0';
    this.editorPropsContainer.appendChild(title);

    const dataContainer = document.createElement('div');
    dataContainer.style.display = 'flex';
    dataContainer.style.flexDirection = 'column';
    dataContainer.style.gap = '5px';
    
    const target = this.selectedObject;

    // --- 既存のデータを表示 ---
    // 'data.values' には、setDataで設定された全てのキーと値が入っている
    for (const key in target.data.values) {
        // groupやlayerなど、専用UIがあるものは除外する
        if (['group', 'layer', 'anim_prefix', 'components', 'events', 'cropSource', 'textureData', 'fixedRotation', 'ignoreGravity', 'shape'].includes(key)) {
            continue;
        }

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '5px';

        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.value = key;
        keyInput.disabled = true; // キーは編集不可
        keyInput.style.flex = '1';

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.value = target.data.values[key];
        valueInput.style.flex = '2';
        valueInput.addEventListener('input', (e) => {
            // 値が変更されたら、setDataで更新
            target.setData(key, e.target.value);
        });

        const removeBtn = document.createElement('button');
        removeBtn.innerText = '×';
        removeBtn.style.width = 'auto';
        removeBtn.onclick = () => {
            if (confirm(`カスタムデータ '${key}' を削除しますか？`)) {
                target.data.remove(key); // データマネージャーから削除
                this.updatePropertyPanel(); // UIを再描画
            }
        };

        row.append(keyInput, valueInput, removeBtn);
        dataContainer.appendChild(row);
    }

    this.editorPropsContainer.appendChild(dataContainer);

    // --- 新しいデータを追加するボタン ---
    const addButton = document.createElement('button');
    addButton.innerText = 'カスタムデータを追加';
    addButton.style.marginTop = '10px';
    addButton.style.backgroundColor = '#444';
    addButton.onclick = () => {
        const newKey = prompt('追加するデータの「キー」を入力してください (例: nextWaypoint):');
        if (newKey && !target.data.has(newKey)) {
            const newValue = prompt(`キー '${newKey}' に設定する「値」を入力してください:`);
            if (newValue !== null) {
                target.setData(newKey, newValue);
                this.updatePropertyPanel(); // UIを再描画
            }
        } else if (newKey) {
            alert(`キー '${newKey}' は既に使用されています。`);
        }
    };
    this.editorPropsContainer.appendChild(addButton);
}
/**
 * ★★★ 新規追加 ★★★
 * アニメーションのプレフィックス名を設定するためのUIを生成する。
 */
createAnimationPrefixInput() {
    const target = this.selectedObject;
    // Sprite または Image の場合のみ表示する
    if (!(target instanceof Phaser.GameObjects.Sprite || target instanceof Phaser.GameObjects.Image)) {
        return;
    }

    const row = document.createElement('div');
    const label = document.createElement('label');
    label.innerText = 'Anim Prefix: ';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g., tartman, slime';
    // 現在設定されている anim_prefix データを取得して表示
    input.value = target.getData('anim_prefix') || '';
    
    // 値が変更されたら、オブジェクトのデータとして保存する
    input.addEventListener('input', (e) => {
        if (this.selectedObject) {
            this.selectedObject.setData('anim_prefix', e.target.value);
            // AnimationControllerがもし存在すれば、prefixを更新してあげるとより親切
            const animController = this.selectedObject.components?.AnimationController;
            if (animController) {
                animController.animPrefix = e.target.value;
            }
        }
    });

    row.append(label, input);
    this.editorPropsContainer.appendChild(row);
}
    // 動的UI系

     /**
     * ★★★ 完成版 ★★★
     * UIテキスト専用のプロパティ編集UIを生成する。
     * 文章、フォントサイズ、色を編集できるようにする。
     */
    createUITextPropertiesUI() {
        const target = this.selectedObject;

        // --- 表示テキスト ---
        const textRow = document.createElement('div');
        textRow.innerHTML = `<label>テキスト:</label>`;
        const textInput = document.createElement('textarea');
        textInput.value = target.text;
        textInput.addEventListener('input', (e) => {
            target.setText(e.target.value);
            // ★ テキストが変わるとサイズが変わるので、当たり判定も更新
            this.updateHitArea(target); 
        });
        textRow.appendChild(textInput);
        this.editorPropsContainer.appendChild(textRow);

        // --- フォントサイズ ---
        const sizeRow = document.createElement('div');
        sizeRow.innerHTML = `<label>フォントサイズ:</label>`;
        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.value = parseInt(target.style.fontSize);
        sizeInput.addEventListener('input', (e) => {
            target.setFontSize(parseInt(e.target.value) || 32);
            this.updateHitArea(target);
        });
        sizeRow.appendChild(sizeInput);
        this.editorPropsContainer.appendChild(sizeRow);
        
        // --- 色 ---
        const colorRow = document.createElement('div');
        colorRow.innerHTML = `<label>色:</label>`;
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = target.style.color;
        colorInput.addEventListener('input', (e) => {
            target.setColor(e.target.value);
        });
        colorRow.appendChild(colorInput);
        this.editorPropsContainer.appendChild(colorRow);
    }

    /**
     * ★★★ 完成版 ★★★
     * UIボタン専用のプロパティ編集UIを生成する。
     * ラベルテキストを編集できるようにする。
     */
    createUIButtonPropertiesUI() {
        const target = this.selectedObject;

        // ボタンクラスがテキスト部分を 'textObject' というプロパティで持っていると仮定
        if (target.textObject && typeof target.setText === 'function') {
            const labelRow = document.createElement('div');
            labelRow.innerHTML = `<label>ラベル:</label>`;
            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.value = target.textObject.text; // コンテナ内のTextオブジェクトのtextプロパティ
            labelInput.addEventListener('input', (e) => {
                target.setText(e.target.value);
                this.updateHitArea(target);
            });
            labelRow.appendChild(labelInput);
            this.editorPropsContainer.appendChild(labelRow);
        }
          // --- ラベル(label)の編集UI ---
    if (target.textObject && typeof target.setText === 'function') {
        this.createTextInput(this.editorPropsContainer, 'Label', target.textObject.text, (newValue) => {
            target.setText(newValue);
        });
    }
    
    // --- スケール(scale)の編集UI ---
    this.createRangeInput(this.editorPropsContainer, 'Scale', target.scaleX, 0.5, 3, 0.05, (newValue) => {
        // ★ setVisualScaleではなく、Phaser標準のsetScaleを直接呼び出す
        target.setScale(newValue);
    });
        
        // ★ 将来的に、ここで「クリックされた時に実行するアクション」を編集するUIを追加する
        // (イベントエディタを呼び出すボタンなど)
    }
    
    /**
     * ★★★ 新規ヘルパー ★★★
     * オブジェクトのサイズ変更に伴い、インタラクティブエリアを更新する
     */
    updateHitArea(target) {
        // setSizeで更新し、setInteractiveで当たり判定を再設定
        target.setSize(target.width, target.height);
        target.setInteractive(); 
    }

    //---レイヤー系
     /**
     * ★★★ 新規メソッド ★★★
     * レイヤーを選択する
     * @param {object} layerObject - 選択されたレイヤーのデータオブジェクト
     */
    selectLayer(layerObject) {
        // console.log(`[EditorPlugin] Layer selected:`, layerObject);
        // 他の選択をすべて解除
        this.deselectAll();
        
        this.selectedLayer = layerObject;
        
        // UIを更新
        this.updatePropertyPanel();
        this.editorUI.buildLayerPanel(); // レイヤーパネルのハイライトを更新
    }
    
    /**
     * ★★★ 新規メソッド ★★★
     * レイヤープロパティ編集用のUIを生成する
     */
    createLayerPropertiesUI() {
        const layer = this.selectedLayer;
        // (ここに、レイヤー名変更や、表示/ロックのトグルなど、レイヤー自体のプロパティを編集するUIを作る)
        const nameRow = document.createElement('div');
        const nameLabel = document.createElement('label');
        nameLabel.innerText = 'Name:';
        const nameInput = document.createElement('input');
        nameInput.value = layer.name;
        nameInput.onchange = (e) => {
            // TODO: レイヤー名変更ロジック
            layer.name = e.target.value;
            this.editorUI.buildLayerPanel(); // 名前を即時反映
        };
        nameRow.append(nameLabel, nameInput);
        this.editorPropsContainer.appendChild(nameRow);
        this.editorPropsContainer.appendChild(document.createElement('hr'));
        
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete Layer';
        deleteButton.style.backgroundColor = '#e65151';
        deleteButton.onclick = () => {
            if (this.editorUI) {
                this.editorUI.deleteLayer(this.selectedLayer.name);
            }
        };
        this.editorPropsContainer.appendChild(deleteButton);
    }

    
    /**
     * ★★★ 新規メソッド ★★★
     * オブジェクトが所属するレイヤーを選択するためのUI（ドロップダウン）を生成する
     */
    createLayerSelect() {
        const target = this.selectedObject;
        const currentLayerName = target.getData('layer');

        const row = document.createElement('div');
        const label = document.createElement('label');
        label.innerText = 'Layer:';
        
        const select = document.createElement('select');
        this.layerStates.forEach(layer => {
            const option = document.createElement('option');
            option.value = layer.name;
            option.innerText = layer.name;
            if (layer.name === currentLayerName) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        select.onchange = (e) => {
            const newLayerName = e.target.value;
            target.setData('layer', newLayerName);
            this.applyLayerStatesToScene(); // 深度などを再計算させる
        };
        
        row.append(label, select);
        this.editorPropsContainer.appendChild(row);
    }

    /**
     * ★★★ 新規メソッド ★★★
     * 現在のレイヤー状態（表示/非表示など）をシーンのGameObjectに適用する
     */
    /**
     * ★★★ 修正版 ★★★
     * 現在のレイヤー状態（表示/非表示など）をシーンのGameObjectに適用する
     */
    applyLayerStatesToScene() {
        const scene = this.getActiveGameScene();
        if (!scene) return;
        // console.log("[EditorPlugin] Applying layer states to all scene objects...");

        // editableObjects はシーンごとのMapなので、現在のシーンのSetを取得
        const allObjects = this.editableObjects.get(scene.scene.key);
        if (!allObjects) return;

        for (const gameObject of allObjects) {
            const objectLayerName = gameObject.getData('layer');
            const layer = this.layerStates.find(l => l.name === objectLayerName);
            
            if (layer) {
                // --- 1. 表示/非表示を適用 ---
                gameObject.setVisible(layer.visible);
                
                // --- 2. ロック状態を適用（入力の有効/無効を切り替える） ---
                if (gameObject.input) { // inputコンポーネントがあるか確認
                    gameObject.input.enabled = !layer.locked;
                }
            } else {
                // どのレイヤーにも所属していないオブジェクトは、常に表示・操作可能にする
                gameObject.setVisible(true);
                if (gameObject.input) {
                    gameObject.input.enabled = true;
                }
            }
        }
    }
    //---レイヤー系ここまで
//レイヤー



 /**
     * ★★★ 最終代替案 ★★★
     * 汎用的な「範囲配置ツール」UIセクションを生成する。
     * クリックではなく、ドラッグ操作の起点(mousedown)をトリガーにする。
     */
    createArrayToolSection() {
        const title = document.createElement('h4');
        title.innerText = 'Array Tool';
        title.style.margin = '10px 0 5px 0';
        
        const button = document.createElement('button');
        button.innerText = 'Drag to Fill Range'; // ボタンのテキストを変更
        button.style.backgroundColor = '#2a9d8f';
        
        // ▼▼▼【ここが修正箇所】▼▼▼
        // 'onclick' から 'onmousedown' に変更
        button.onmousedown = (event) => {
            // イベントのデフォルト動作（ドラッグ選択など）をキャンセル
            event.preventDefault();

            if (this.editorUI) {
                // EditorUIに、ドラッグ操作の開始を通知
                this.editorUI.startRangeFillDrag(this.selectedObject);
            }
        };
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        
        this.editorPropsContainer.append(title, button);
    }
  
    /**
     * UI生成関数を安全に実行するためのラッパー関数。
     * @param {function} createUIFunction - UIを生成する関数 (thisを束縛するためアロー関数を推奨)
     */
    safeCreateUI(createUIFunction) {
        try {
            // thisをEditorPluginインスタンスに束縛して実行
            createUIFunction.call(this);
        } catch (error) {
            const funcName = createUIFunction.name || 'anonymous function';
            console.error(`[EditorPlugin] Failed to create UI section: '${funcName}'`, error);
        }
    }

       /**
     * ★★★ 新規ヘルパーメソッド ★★★
     * テキストオブジェクト専用のプロパティ編集UIを生成する
     */
    createTextPropertiesUI() {
        const target = this.selectedObject;

        // --- Text Content ---
        const textRow = document.createElement('div');
        const textLabel = document.createElement('label');
        textLabel.innerText = 'Text:';
        const textInput = document.createElement('textarea');
        textInput.style.minHeight = '40px';
        textInput.value = target.text;
        textInput.addEventListener('input', (e) => {
            target.setText(e.target.value);
        });
        textRow.append(textLabel, textInput);
        this.editorPropsContainer.appendChild(textRow);

       // --- Font Family ---
        const familyRow = document.createElement('div');
        const familyLabel = document.createElement('label');
        familyLabel.innerText = 'Font:';
        const familyInput = document.createElement('input');
        familyInput.type = 'text';
        familyInput.placeholder = 'Arial, sans-serif';
        familyInput.value = target.style.fontFamily;
        familyInput.addEventListener('input', (e) => {
            target.setFontFamily(e.target.value);
        });
        familyRow.append(familyLabel, familyInput);
        this.editorPropsContainer.appendChild(familyRow);

        // --- Font Size & Style (統合) ---
        const styleRow = document.createElement('div');
        // Size
        const sizeLabel = document.createElement('label');
        sizeLabel.innerText = 'Size:';
        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.style.width = '60px'; // 幅を固定
        sizeInput.value = parseInt(target.style.fontSize);
        sizeInput.addEventListener('input', (e) => {
            target.setFontSize(parseInt(e.target.value));
        });
        // Style (Bold/Italic)
        const styleSelect = document.createElement('select');
        ['normal', 'bold', 'italic', 'bold italic'].forEach(style => {
            const option = document.createElement('option');
            option.value = style;
            option.innerText = style;
            if (target.style.fontStyle === style) option.selected = true;
            styleSelect.appendChild(option);
        });
        styleSelect.addEventListener('change', (e) => {
            target.setFontStyle(e.target.value);
        });
        styleRow.append(sizeLabel, sizeInput, styleSelect);
        this.editorPropsContainer.appendChild(styleRow);
        // --- Color ---
        const colorRow = document.createElement('div');
        const colorLabel = document.createElement('label');
        colorLabel.innerText = 'Color:';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = target.style.color;
        colorInput.addEventListener('input', (e) => {
            target.setColor(e.target.value);
        });
        colorRow.append(colorLabel, colorInput);
        this.editorPropsContainer.appendChild(colorRow);
         // --- Shadow (ドロップシャドウ) ---
        const shadowTitle = document.createElement('h5'); // 少し小さい見出し
        shadowTitle.innerText = 'Shadow';
        shadowTitle.style.margin = '10px 0 5px 0';
        this.editorPropsContainer.appendChild(shadowTitle);

        const shadowRow = document.createElement('div');
        // Color
        const shadowColorLabel = document.createElement('label');
        shadowColorLabel.innerText = 'Color:';
        const shadowColorInput = document.createElement('input');
        shadowColorInput.type = 'color';
        shadowColorInput.value = target.style.shadowColor || '#000000';
        // Offset X/Y
        const shadowXInput = document.createElement('input');
        shadowXInput.type = 'number';
        shadowXInput.title = 'Shadow Offset X';
        shadowXInput.value = target.style.shadowOffsetX || 2;
        const shadowYInput = document.createElement('input');
        shadowYInput.type = 'number';
        shadowYInput.title = 'Shadow Offset Y';
        shadowYInput.value = target.style.shadowOffsetY || 2;
        
        const updateShadow = () => {
            target.setShadow(
                parseInt(shadowXInput.value),
                parseInt(shadowYInput.value),
                shadowColorInput.value,
                2 // Blur (固定)
            );
        };
        shadowColorInput.addEventListener('input', updateShadow);
        shadowXInput.addEventListener('input', updateShadow);
        shadowYInput.addEventListener('input', updateShadow);

        shadowRow.append(shadowColorLabel, shadowColorInput, shadowXInput, shadowYInput);
        this.editorPropsContainer.appendChild(shadowRow);
    
    }
    createExportPrefabButton() {
        const button = document.createElement('button');
        button.innerText = 'Export Selection as Prefab';
        button.style.backgroundColor = '#4a8a4a'; // 分かりやすいように色を変える
        button.addEventListener('click', () => this.exportSelectionToPrefab());
        this.editorPropsContainer.appendChild(button);
    }
    // --- 物理セクションを独立したメソッドに分離 ---
    createPhysicsSection() {
        const physicsTitle = document.createElement('h4');
        physicsTitle.innerText = '物理ボディ (Matter.js)';
        this.editorPropsContainer.appendChild(physicsTitle);

        // ★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここが最終防衛ライン ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★
        const hasBody = this.selectedObject && this.selectedObject.body;

        if (hasBody) {
            this.createMatterPropertiesUI(this.selectedObject);
            this.createRemoveBodyButton();
        } else {
            this.createAddBodyButton();
        }
    }


/**
 * ボディ削除ボタン (再構築を呼び出す方式)
 */
createRemoveBodyButton() {
    const removeButton = document.createElement('button');
    removeButton.innerText = '物理ボディ 削除';
    removeButton.style.backgroundColor = '#e65151';
    
    removeButton.onclick = () => {
        // 物理オプションを「なし」にして再構築を呼び出す
        this.recreateBodyByReconstruction(null); // nullを渡すのがポイント
    };
    this.editorPropsContainer.appendChild(removeButton);
}


/**
 * ボディを「完全な再構築」によって安全に再生成、または削除する最終メソッド
 * @param {object | null} changedPhysicsOption - 変更オプション。nullが渡された場合はボディを削除する。
 */
recreateBodyByReconstruction(changedPhysicsOption) {
    const targetObject = this.selectedObject;
    if (!targetObject || !targetObject.scene) return;

    // --- 1. レイアウト情報を抽出 (物理以外) ---
    const layout = {
        name: targetObject.name,
        type: (targetObject instanceof Phaser.GameObjects.Sprite) ? 'Sprite' : 'Image',
        texture: targetObject.texture.key,
        x: targetObject.x,
        y: targetObject.y,
        depth: targetObject.depth,
        scaleX: targetObject.scaleX,
        scaleY: targetObject.scaleY,
        angle: targetObject.angle,
        alpha: targetObject.alpha,
        group: targetObject.getData('group'),
        animation_data: targetObject.getData('animation_data'),
        events: targetObject.getData('events'),
        components: targetObject.getData('components'),
    };
    
    // --- 2. 物理情報を、安全なプロパティだけを抽出して作成 ---
    if (changedPhysicsOption !== null) {
        const currentBody = targetObject.body;
        // ★★★ 必要なプロパティだけを明示的にコピーする ★★★
        const basePhysics = currentBody ? {
            isStatic: currentBody.isStatic,
            ignoreGravity: currentBody.ignoreGravity,
            gravityScale: currentBody.gravityScale,
            friction: currentBody.friction,
            restitution: currentBody.restitution,
            shape: targetObject.getData('shape') || 'rectangle'
        } : {}; // ボディがなければ空オブジェクトから始める

        // 抽出した安全な情報に、今回の変更をマージ
        layout.physics = { ...basePhysics, ...changedPhysicsOption };
        
    }
    // changedPhysicsOptionがnullなら、layout.physicsはundefinedのまま = ボディなし
// console.log('%c[EditorPlugin] Reconstructing with layout:', 'color: cyan;', layout);
    // --- 3. 再構築プロセス ---
    const scene = targetObject.scene;
    const sceneKey = scene.scene.key;
    if (this.editableObjects.has(sceneKey)) {
        this.editableObjects.get(sceneKey).delete(targetObject);
    }
    targetObject.destroy();
    const newGameObject = scene.createObjectFromLayout(layout);
    scene.applyProperties(newGameObject, layout);
    this.selectedObject = newGameObject;
    
    // --- 4. UIを更新 ---
    this.updatePropertyPanel();
}
    // --- `updatePropertyPanel`から呼び出されるUI生成ヘルパーメソッド群 ---

    createNameInput() {
        const row = document.createElement('div');
        const label = document.createElement('label');
        label.innerText = 'Name: ';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.selectedObject.name || '';
        input.addEventListener('input', (e) => {
            if (this.selectedObject) this.selectedObject.name = e.target.value;
            this.editorTitle.innerText = `Editing: ${e.target.value}`;
        });
        row.append(label, input);
        this.editorPropsContainer.appendChild(row);
    }

   // in EditorPlugin.js

    /**
     * ★★★ 拡張版 ★★★
     * グループの入力欄に、「グループから離脱/選択オブジェクトをグループ化」ボタンを追加する
     */
    createGroupInput() {
        const target = this.selectedObject;
        const currentGroup = target.getData('group') || '';
        
        const row = document.createElement('div');
        row.style.flexWrap = 'wrap'; // ボタンがはみ出たら改行

        const label = document.createElement('label');
        label.innerText = 'Group: ';

        // --- グループID入力欄 ---
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'e.g., floor, enemies';
        input.value = currentGroup;
        input.addEventListener('input', (e) => {
            if (this.selectedObject) {
                this.selectedObject.setData('group', e.target.value);
            }
        });

        row.append(label, input);

        // --- グループ操作ボタン ---
        // 1. もしオブジェクトがグループに所属しているなら、「離脱」ボタンを表示
        if (currentGroup) {
            const leaveButton = document.createElement('button');
            leaveButton.innerText = 'Leave Group';
            leaveButton.title = `Leave group '${currentGroup}'`;
            leaveButton.style.flexGrow = '1'; // 幅を合わせる
            leaveButton.onclick = () => {
                if (confirm(`'${target.name}'をグループ'${currentGroup}'から離脱させますか？`)) {
                    target.setData('group', ''); // groupデータを空にするだけ
                    this.updatePropertyPanel(); // UIを更新
                }
            };
            row.appendChild(leaveButton);
        }

        // ★ 将来の機能：複数選択したオブジェクトを新しいグループにするボタンもここに追加できる
        // if (this.selectedObjects.length > 1) {
        //     const groupButton = document.createElement('button');
        //     // ...
        // }

        this.editorPropsContainer.appendChild(row);
    }

   
createTransformInputs() {
    // オブジェクトから安全にプロパティ値を読み込むためのヘルパー関数
    const getSafeValue = (propertyKey, defaultValue) => {
        // オブジェクトが存在しない、またはアクティブでない場合はデフォルト値を返す
        if (!this.selectedObject || !this.selectedObject.active) {
            return defaultValue;
        }
        try {
            const value = this.selectedObject[propertyKey];
            // undefinedやnullも有効な値ではないため、デフォルト値にフォールバック
            return (value !== undefined && value !== null) ? value : defaultValue;
        } catch (e) {
            // プロパティへのアクセス自体がエラーを引き起こした場合
            console.warn(`Could not access property '${propertyKey}'. Defaulting to ${defaultValue}.`);
            return defaultValue;
        }
    };

    // --- x, y ---
    ['x', 'y'].forEach(key => {
        const row = document.createElement('div');
        const label = document.createElement('label');
        label.innerText = `${key}:`;
        const input = document.createElement('input');
        input.type = 'number';
        input.value = getSafeValue(key, 0);
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && this.selectedObject) {
                this.selectedObject[key] = val;
            }
        });
        row.append(label, input);
        this.editorPropsContainer.appendChild(row);
    });

    // --- scale (まとめて処理) ---
    const scaleRow = document.createElement('div');
    const scaleLabel = document.createElement('label');
    scaleLabel.innerText = 'scale:';
    const scaleInput = document.createElement('input');
    scaleInput.type = 'range';
    scaleInput.min = 0.1;
    scaleInput.max = 5;
    scaleInput.step = 0.01;
    const scaleX = getSafeValue('scaleX', 1);
    const scaleY = getSafeValue('scaleY', 1);
    scaleInput.value = (scaleX === scaleY) ? scaleX : 1.0;
    scaleInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && this.selectedObject) {
            this.selectedObject.setScale(val);
            this.rebuildPhysicsBodyOnScaleChange();
        }
    });
    scaleRow.append(scaleLabel, scaleInput);
    this.editorPropsContainer.appendChild(scaleRow);


    // --- angle, alpha ---
    ['angle', 'alpha'].forEach(key => {
        const row = document.createElement('div');
        const label = document.createElement('label');
        label.innerText = `${key}:`;
        const input = document.createElement('input');
        input.type = 'range';
        const defaultValue = (key === 'alpha') ? 1 : 0;
        input.min = (key === 'angle') ? -180 : 0;
        input.max = (key === 'angle') ? 180 : 1;
        input.step = (key === 'angle') ? 1 : 0.01;
        input.value = getSafeValue(key, defaultValue);
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && this.selectedObject) {
                if (key === 'angle') this.selectedObject.setAngle(val);
                
                else if (key === 'alpha') this.selectedObject.setAlpha(val);
            }
        });
        row.append(label, input);
        this.editorPropsContainer.appendChild(row);
    });
}
// in EditorPlugin.js

    // in EditorPlugin.js

    /**
     * ★★★ 最後のFIX版 ★★★
     * スケール変更に応じて、物理ボディを安全に再生成する。
     * ターゲットがContainerの場合の処理を正しく記述する。
     */
   rebuildPhysicsBodyOnScaleChange() {
        const target = this.selectedObject;
        if (!target || !target.body) return;

        // console.log(`[EditorPlugin | Final Fix] Rebuilding physics body for '${target.name}'.`);

        // --- 1. 既存のボディからプロパティを記憶 ---
        const oldBodyOptions = {
            isStatic: target.body.isStatic,
            isSensor: target.body.isSensor,
            friction: target.body.friction,
            restitution: target.body.restitution
        };
        const shape = target.getData('shape') || 'rectangle';

        // --- 2. 既存のボディをワールドから削除 ---
        target.scene.matter.world.remove(target.body);

        // ▼▼▼【ここからが核心の修正です】▼▼▼
        // --------------------------------------------------------------------
        
        // --- 3. ターゲットがContainerか、それ以外かで処理を分岐 ---
        if (target instanceof Phaser.GameObjects.Container) {
            
            // --- Containerの場合 ---
            // コンテナのサイズと新しいスケールから、物理ボディの寸法を計算
            const bodyWidth = target.width * target.scaleX;
            const bodyHeight = target.height * target.scaleY;

            // 新しい寸法の物理ボディを「独立して」作成
            const newBody = target.scene.matter.bodies.rectangle(0, 0, bodyWidth, bodyHeight, oldBodyOptions);
            
            // setExistingBodyを使って、コンテナに新しいボディを合体させる
            target.setExistingBody(newBody);

        } else { // Image, Spriteなどの場合

            // --- 通常のGameObjectの場合 ---
            const bodyWidth = target.width * target.scaleX;
            const bodyHeight = target.height * target.scaleY;

            if (shape === 'circle') {
                const radius = (bodyWidth + bodyHeight) / 4;
                target.setCircle(radius, oldBodyOptions);
            } else { // rectangle
                target.setBody({
                    type: 'rectangle',
                    width: bodyWidth,
                    height: bodyHeight
                }, oldBodyOptions);
            }
        }
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        
        // UIを更新
        this.updatePropertyPanel();
    }
    createDepthInput() {
        const row = document.createElement('div');
        const label = document.createElement('label');
        label.innerText = 'depth:';
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 1;
        input.value = this.selectedObject.depth;
        input.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && this.selectedObject) {
                this.selectedObject.setDepth(val);
            }
        });
        row.append(label, input);
        this.editorPropsContainer.appendChild(row);
    }

    /**
 * 物理ボディを付与するボタンを生成する。
 */
/**
 * 物理ボディを付与するボタンを生成する。
 */
createAddBodyButton() {
    const addButton = document.createElement('button');
    addButton.innerText = '物理ボディ 付与';
    addButton.onclick = () => {
        if (this.selectedObject && !this.selectedObject.body) { // 二重付与を防止
            this.selectedObject.scene.matter.add.gameObject(this.selectedObject, { isStatic: false });
            this.selectedObject.setData('shape', 'rectangle');
            setTimeout(() => this.updatePropertyPanel(), 0);
        }
    };
    this.editorPropsContainer.appendChild(addButton);
}

  
  
/**
 * Matter.js用のプロパティUIを生成する (Phaser公式API準拠・最終版)
 */
createMatterPropertiesUI(gameObject) {
    const body = gameObject.body;
    const isTextObject = (gameObject instanceof Phaser.GameObjects.Text);
    // --- 静的ボディ ---
    this.createCheckbox(this.editorPropsContainer, '静的ボディ', body.isStatic, (isChecked) => {
        if (this.selectedObject) {
            // 公式API: .setStatic()
            this.selectedObject.setStatic(isChecked);
            // UIを更新して、他の部分の表示を正しくする
            this.updatePropertyPanel(); 
        }
    });

 // --- センサー (すり抜け) ---
    this.createCheckbox(this.editorPropsContainer, 'センサー', body.isSensor, (isChecked) => {
        if (this.selectedObject) {
            // setSensorも安全なので、直接呼び出す
            this.selectedObject.setSensor(isChecked);
            if (isChecked) {
                // センサーON時は、再構築せずにsetDataで重力無視を設定
                this.selectedObject.setData('ignoreGravity', true);
            }
            this.updatePropertyPanel(); 
        }
    });
   
    // --- 重力無視 ---
    this.createCheckbox(this.editorPropsContainer, '重力無視', gameObject.getData('ignoreGravity') === true, (isChecked) => {
        if (this.selectedObject) {
            // ★★★ ここで処理を分岐 ★★★
            if (isTextObject) {
                // テキストオブジェクトの場合：再構築せず、setDataで状態を更新するだけ
                this.selectedObject.setData('ignoreGravity', isChecked);
                // console.log(`[EditorPlugin] Set ignoreGravity=${isChecked} for Text object (no reconstruction).`);
                // UIの表示を更新するために、PropertyPanelの更新だけは呼び出す
                this.updatePropertyPanel();
            } else {
                // 画像・スプライトの場合：これまで通り、安全な再構築メソッドを呼び出す
                this.recreateBodyByReconstruction({ ignoreGravity: isChecked });
            }
        }
    });
   this.createCheckbox(this.editorPropsContainer, '回転を固定', gameObject.getData('fixedRotation') === true, (isChecked) => {
    if (this.selectedObject?.body) {
        this.selectedObject.setFixedRotation(isChecked);
        // ★ 永続化のためにデータもセットする
        this.selectedObject.setData('fixedRotation', isChecked);
    }
});


    // --- 重力スケール ---
    if (!body.ignoreGravity) {
        this.createRangeInput(this.editorPropsContainer, '重力スケール', body.gravityScale.y, -2, 2, 0.1, (value) => {
            if (this.selectedObject && this.selectedObject.body) {
                // gravityScaleは特殊なので、bodyに直接代入するのが公式な方法
                this.selectedObject.body.gravityScale.y = value;
                this.selectedObject.body.gravityScale.x = 0; // x軸は常に0に
            }
        });
    }
    this.createRangeInput(this.editorPropsContainer, '空気抵抗', body.frictionAir, 0, 0.1, 0.001, (value) => {
    if (this.selectedObject) {
        // 公式API: .setFrictionAir()
        this.selectedObject.setFrictionAir(value);
    }
});
    // --- 摩擦 & 反発 ---
    this.createRangeInput(this.editorPropsContainer, '摩擦', body.friction, 0, 1, 0.01, (value) => {
        if (this.selectedObject) {
            // 公式API: .setFriction()
            this.selectedObject.setFriction(value);
        }
    });
    this.createRangeInput(this.editorPropsContainer, '反発', body.restitution, 0, 1, 0.01, (value) => {
        if (this.selectedObject) {
            // 公式API: .setBounce()
            this.selectedObject.setBounce(value);
        }
    });

    // --- 形状 ---
    const currentShape = gameObject.getData('shape') || 'rectangle';
    this.createSelect(this.editorPropsContainer, '形状', currentShape, ['rectangle', 'circle'], (newShape) => {
        if (this.selectedObject) {
            this.selectedObject.setData('shape', newShape);
            // 形状の変更は、ボディの再生成が必要
            // ボディ削除→ボディ付与、という流れで実現する
            if (this.selectedObject.body) {
                const scene = this.selectedObject.scene;
                scene.matter.world.remove(this.selectedObject.body);
                scene.matter.add.gameObject(this.selectedObject); // デフォルトで再付与
                // 新しい形状を適用
                if (newShape === 'circle') this.selectedObject.setCircle();
                else this.selectedObject.setRectangle();
            }
            this.updatePropertyPanel();
        }
    });
    this.editorPropsContainer.appendChild(document.createElement('hr'));
        const collisionTitle = document.createElement('h5');
        collisionTitle.innerText = 'Collision Rules';
        this.editorPropsContainer.appendChild(collisionTitle);

        // --- 物理定義を取得 ---
        const physicsDefine = this.game.registry.get('physics_define');
        if (!physicsDefine || !physicsDefine.categories) {
            this.editorPropsContainer.innerHTML += "<p>Error: physics_define.json not found.</p>";
            return;
        }
        const categories = physicsDefine.categories;
        
        // --- 1. カテゴリ設定 (自分は誰か) ---
        const categoryRow = document.createElement('div');
        categoryRow.innerHTML = `<label>Category:</label>`;
        const categorySelect = document.createElement('select');
        for (const name in categories) {
            const option = document.createElement('option');
            option.value = categories[name]; // 値は 1, 2, 4...
            option.innerText = name;
            if (body.collisionFilter.category === categories[name]) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        }
        categorySelect.onchange = (e) => {
            gameObject.setCollisionCategory(parseInt(e.target.value));
            gameObject.setData('collision_category', newCategoryValue);
            // UIも更新
            setTimeout(() => this.updatePropertyPanel(), 0);
        };
        categoryRow.appendChild(categorySelect);
        this.editorPropsContainer.appendChild(categoryRow);

        // --- 2. マスク設定 (誰と衝突するか) ---
        const maskRow = document.createElement('div');
        maskRow.innerHTML = `<label style="align-self: flex-start;">Collides With:</label>`;
        const maskContainer = document.createElement('div');
        maskContainer.style.flexDirection = 'column';
        maskContainer.style.alignItems = 'flex-start';
        for (const name in categories) {
            const checkboxLabel = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.categoryValue = categories[name];
            
            if (body.collisionFilter.mask & categories[name]) {
                checkbox.checked = true;
            }
            
            checkbox.onchange = () => this.updateCollisionMask(gameObject);
            
            checkboxLabel.append(checkbox, ` ${name}`);
            maskContainer.appendChild(checkboxLabel);
        }
        maskRow.appendChild(maskContainer);
        this.editorPropsContainer.appendChild(maskRow);
    }

 /**
     * チェックボックスの状態から、新しい衝突マスクを計算して適用する
     */
    updateCollisionMask(gameObject) {
        let newMask = 0;
        const checkboxes = this.editorPropsContainer.querySelectorAll('input[type="checkbox"][data-category-value]');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                newMask |= parseInt(checkbox.dataset.categoryValue);
            }
        });
        gameObject.setCollidesWith(newMask);
        gameObject.setData('collision_mask', newMask);
    }

    
    createAnimationSection() {
        const title = document.createElement('h4');
        title.innerText = 'スプライトシート';
        title.style.margin = '10px 0 5px 0';
        const button = document.createElement('button');
        button.innerText = 'アニメーション設定';
        button.onclick = () => this.openAnimationEditor();
        this.editorPropsContainer.append(title, button);
    }

       createEventSection() {
        const title = document.createElement('h4');
        title.innerText = 'ロジック';
        title.style.margin = '10px 0 5px 0';
        const button = document.createElement('button');
        button.innerText = 'イベント・エディタを開く';

        button.onclick = () => {
            if (this.selectedObject) {
                // ★ 1. まず、イベントデータ構造を「新しい形式」に初期化・移行する
                this.initializeEventData(this.selectedObject);
                
                // ★ 2. 次に、EditorUIにモーダルを開くよう依頼する
                if (this.editorUI) {
                    this.editorUI.openEventEditor(this.selectedObject);
                }
            } else {
                alert('先にイベントを編集するオブジェクトを選択してください。');
            }
        };
        
        this.editorPropsContainer.append(title, button);
    }

    // src/plugins/EditorPlugin.js (createCheckboxなどのヘルパーがある場所に追加)

    /**
     * ★★★ 新規ヘルパー ★★★
     * 汎用的なテキスト入力欄をコンテナ内に生成する
     * @param {HTMLElement} container - 追加先の親要素
     * @param {string} label - 表示ラベル
     * @param {string} initialValue - 初期値
     * @param {function} callback - 値が変更されたときに呼ばれる関数
     */
    createTextInput(container, label, initialValue, callback) {
        const row = document.createElement('div');
        const labelEl = document.createElement('label');
        labelEl.innerText = label + ' ';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = initialValue;
        
        // inputイベントは入力の度に発火。changeイベントはフォーカスが外れた時に発火。
        input.addEventListener('change', () => {
            callback(input.value);
        });

        row.append(labelEl, input);
        container.appendChild(row);
    }

createComponentSection() {
    const title = document.createElement('h4');
    title.innerText = 'Components';
    this.editorPropsContainer.appendChild(title);
    
    const attachedComponents = this.selectedObject.getData('components') || [];
    const targetObject = this.selectedObject;

    // --- 1. 特別なアクションボタンを先に表示する ---
    const hasStateMachine = attachedComponents.some(c => c.type === 'StateMachineComponent');
    if (hasStateMachine) {
        const sm_button = document.createElement('button');
        sm_button.innerText = 'ステートマシン・エディタを開く';
        sm_button.style.backgroundColor = '#4a8a4a';
        sm_button.style.width = '100%';
        sm_button.style.marginBottom = '10px';
        sm_button.onclick = () => {
            if (this.editorUI) {
                this.editorUI.openStateMachineEditor(targetObject);
            }
        };
        this.editorPropsContainer.appendChild(sm_button);
    }

    // --- 2. 各コンポーネントのパラメータ編集UIを、動的に生成する ---
    attachedComponents.forEach((componentDef, index) => {
        // コンテナとヘッダーの作成
        const containerDiv = document.createElement('div');
        containerDiv.style.border = '1px solid #444';
        containerDiv.style.padding = '8px';
        containerDiv.style.marginBottom = '8px';
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        const compTitle = document.createElement('strong');
        compTitle.innerText = componentDef.type;
        const removeBtn = document.createElement('button');
        removeBtn.innerText = '×';
        removeBtn.onclick = () => {
            if (confirm(`Component '${componentDef.type}' を削除しますか？`)) {
        const currentComps = targetObject.getData('components') || [];
                currentComps.splice(index, 1);
                targetObject.setData('components', currentComps);
                if (targetObject.scene?.initComponentsAndEvents) {
                    targetObject.scene.initComponentsAndEvents(targetObject);
                }
                this.updatePropertyPanel();
            }
        };
        headerDiv.append(compTitle, removeBtn);
        containerDiv.appendChild(headerDiv);
        
        // パラメータUIのコンテナ
        const paramsContainer = document.createElement('div');
        paramsContainer.style.display = 'block'; // 横並びを防ぐ
        containerDiv.appendChild(paramsContainer);

        const ComponentClass = ComponentRegistry[componentDef.type];
        if (!ComponentClass) { return; }

        // `define`プロパティを読み込んでUIを生成
        const define = ComponentClass.define;
        if (define && Array.isArray(define.params)) {
            define.params.forEach(paramDef => {
                const currentValue = componentDef.params[paramDef.key] ?? paramDef.defaultValue;
                
                // ★ onValueChangeは外に出して共通化
                const onValueChange = (newValue) => {
                    componentDef.params[paramDef.key] = newValue;
                    targetObject.setData('components', attachedComponents);
                    if (targetObject.scene?.initComponentsAndEvents) {
                        targetObject.scene.initComponentsAndEvents(targetObject);
                    }
                    // ★ プレビューを更新するために updatePropertyPanel を呼ぶのが良い
                    this.updatePropertyPanel();
                };

                // ▼▼▼ この if/else if ブロックを修正 ▼▼▼
                // -----------------------------------------------------------------
                // ★★★ 1. 新しい 'asset:*' の判定を最優先で行う ★★★
                if (typeof paramDef.options === 'string' && paramDef.options.startsWith('asset:')) {
                    const assetType = paramDef.options.split(':')[1];
                    // ★ 新しいヘルパーメソッドを呼び出す
                    this.createAssetSelect(paramsContainer, paramDef.label, currentValue, assetType, onValueChange);
                
                } else if (paramDef.type === 'range') {
                    this.createRangeInput(paramsContainer, paramDef.label, currentValue, paramDef.min, paramDef.max, paramDef.step, onValueChange);
                } else if (paramDef.type === 'checkbox') {
                    this.createCheckbox(paramsContainer, paramDef.label, currentValue, onValueChange);
                   }   else if (paramDef.type === 'select') {
                    this.createSelect(paramsContainer, paramDef.label, currentValue, paramDef.options, onValueChange);
                        }     else if (paramDef.type === 'color') {
    // ★ 新しいヘルパーメソッドを呼び出す
    this.createColorInput(paramsContainer, paramDef.label, currentValue, onValueChange);

                } else {
                    this.createTextInput(paramsContainer, paramDef.label, currentValue, onValueChange);
                }
            });
        }
        
        this.editorPropsContainer.appendChild(containerDiv);
    });

    // --- 3. 「コンポーネントを追加」ドロップダウンの表示 (変更なし) ---
    const availableComponents = Object.keys(ComponentRegistry).filter(name => !attachedComponents.some(c => c.type === name));
    if (availableComponents.length > 0) {
        availableComponents.sort();

    const select = document.createElement('select');
    select.innerHTML = '<option value="">コンポーネントを追加...</option>';
    
    // ★★★ 2. ソート済みの配列でループする ★★★
    availableComponents.forEach(compName => {
        select.innerHTML += `<option value="${compName}">${compName}</option>`;
    });
       
        select.onchange = (e) => {
            const compToAdd = e.target.value;
            if (!compToAdd) return;
            const currentComps = targetObject.getData('components') || [];
            currentComps.push({ type: compToAdd, params: {} });
            targetObject.setData('components', currentComps);
            if (targetObject.scene?.initComponentsAndEvents) {
                targetObject.scene.initComponentsAndEvents(targetObject);
            }
            this.updatePropertyPanel();
        };
        this.editorPropsContainer.appendChild(select);
    }
}
    createExportButton() {
        const button = document.createElement('button');
        button.innerText = 'エクスポート レイアウト (to Console)';
        button.style.marginTop = '15px';
        button.addEventListener('click', () => this.exportLayoutToJson());
        this.editorPropsContainer.appendChild(button);
    }
 /**
     * ★★★ 新規ヘルパーメソッド ★★★
     * アセットリストから特定のタイプのアセットを選択する<select>要素を生成する
     */
    createAssetSelect(container, label, currentValue, assetType, onChange) {
        // this.assetListは、事前にEditorUIから渡してもらうか、ここで取得する必要がある
        const assetList = this.pluginManager.game.registry.get('asset_list') || [];

        const select = document.createElement('select');
        
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '--- None ---';
        select.appendChild(noneOption);
        if (!currentValue) {
            noneOption.selected = true;
        }

        assetList
            .filter(asset => asset.type === assetType)
            .sort((a, b) => a.key.localeCompare(b.key)) // ★ついでにアセット名もソート
            .forEach(asset => {
                const option = document.createElement('option');
                option.value = asset.key;
                option.textContent = asset.key;
                if (asset.key === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        
        select.addEventListener('change', (e) => {
            onChange(e.target.value || null);
        });

        // ラベルとselect要素をコンテナに追加する (createTextInputなどと同じ形式で)
        const labelEl = document.createElement('label');
        labelEl.innerText = label;
        const controlWrapper = document.createElement('div');
        controlWrapper.className = 'prop-control';
        controlWrapper.append(labelEl, select);
        container.appendChild(controlWrapper);
    }

/** ★★★ 新規追加 ★★★
 * カラーピッカー入力欄を生成するヘルパーメソッド
 */
createColorInput(container, label, initialValue, callback) {
    const row = document.createElement('div');
    const labelEl = document.createElement('label');
    labelEl.innerText = label + ' ';

    const input = document.createElement('input');
    input.type = 'color';
    // カラーピッカーは'#rrggbb'形式を扱うので、'0x'形式から変換する
    input.value = '#' + initialValue.toString(16).padStart(6, '0');

    input.addEventListener('input', () => {
        // ユーザーが色を選んだら、'#rrggbb'形式を'0xrrggbb'形式に変換してコールバック
        callback('0x' + input.value.substring(1));
    });

    row.append(labelEl, input);
    container.appendChild(row);
}
    /**
     * ★★★ 以下のメソッドで、既存の createDeleteObjectButton を完全に置き換えてください ★★★
     */
    createDeleteObjectButton() {
        const button = document.createElement('button');
        button.innerText = 'オブジェクト 削除';
        button.style.backgroundColor = '#e65151';
        button.style.marginTop = '10px';
        
        button.addEventListener('click', () => {
            // クリックされた瞬間の選択オブジェクトを、ローカル変数に固定する
            const objectToDelete = this.selectedObject;
            
            if (objectToDelete && objectToDelete.scene && confirm(`本当に '${objectToDelete.name}' を削除しますか？`)) {
                
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                // ★★★ "targetObject" を、全て "objectToDelete" に修正 ★★★
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                const sceneKey = objectToDelete.scene.scene.key;
                
                if (this.editableObjects.has(sceneKey)) {
                    this.editableObjects.get(sceneKey).delete(objectToDelete);
                }
                
                objectToDelete.destroy();
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

                // 選択を解除し、UIを更新する
                this.selectedObject = null;
                this.updatePropertyPanel();
            }
        });
        
        this.editorPropsContainer.appendChild(button);
    }
    // --- 汎用UI生成ヘルパー ---

    createCheckbox(container, label, initialValue, callback) {
        const row = document.createElement('div');
        const labelEl = document.createElement('label');
        labelEl.innerText = label + ' ';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = initialValue;
           if (label === '静的ボディ') checkbox.id = 'prop-isStatic';
    if (label === '重力無視') checkbox.id = 'prop-ignoreGravity';
        checkbox.addEventListener('change', () => callback(checkbox.checked));
        row.append(labelEl, checkbox);
        container.appendChild(row);
    }

    createRangeInput(container, label, initialValue, min, max, step, callback) {
        const row = document.createElement('div');
        const labelEl = document.createElement('label');
        labelEl.innerText = label + ' ';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = initialValue;
          if (label === '重力スケール') slider.id = 'prop-gravityScale';
    if (label === '摩擦') slider.id = 'prop-friction';
    if (label === '反発') slider.id = 'prop-restitution';
        const valueEl = document.createElement('span');
        valueEl.innerText = Number(initialValue).toFixed(2);
        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            valueEl.innerText = value.toFixed(2);
            callback(value);
        });
        row.append(labelEl, slider, valueEl);
        container.appendChild(row);
    }

    createSelect(container, label, initialValue, options, callback) {
        const row = document.createElement('div');
        const labelEl = document.createElement('label');
        labelEl.innerText = label + ' ';
        const select = document.createElement('select');
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt;
            optionEl.innerText = opt.charAt(0).toUpperCase() + opt.slice(1);
            if (opt === initialValue) optionEl.selected = true;
            select.appendChild(optionEl);
        });
        select.addEventListener('change', (e) => callback(e.target.value));
        row.append(labelEl, select);
        container.appendChild(row);
    }

    // in src/plugins/EditorPlugin.js

/**
 * ★★★ 新設 ★★★
 * 全ての編集可能オブジェクトのドラッグ状態を切り替える
 * @param {boolean} isDraggable - ドラッグを有効にするか
 */
setAllObjectsDraggable(isDraggable) {
    if (!this.isEnabled) return;

    // console.log(`[EditorPlugin] Setting all objects draggable: ${isDraggable}`);

    // editableObjects は Map<string, Set> なので、全てのSetをループ
    for (const sceneObjectSet of this.editableObjects.values()) {
        for (const gameObject of sceneObjectSet) {
            if (gameObject.scene && gameObject.input) {
                // Phaserの公式な方法で、個別にドラッグを有効/無効化
                gameObject.scene.input.setDraggable(gameObject, isDraggable);
            }
        }
    }
}
 /**
     * ★★★ 修正版 ★★★
     * ゲームオブジェクトをエディタで編集可能にする。
     * タイルマップモードでは選択できないようにガードを追加する。
     */
    makeEditable(gameObject, scene) {
        if (!this.isEnabled) return;
        const sceneKey = scene.scene.key;
        if (!this.editableObjects.has(sceneKey)) {
            this.editableObjects.set(sceneKey, new Set());
        }
        this.editableObjects.get(sceneKey).add(gameObject);
const currentMode = this.game.registry.get('editor_mode');
    if (currentMode === 'play') {
        return; // プレイモードなら、エディタは何もしない
    }
        if (!gameObject.input) {
            gameObject.setInteractive();
        }
        
        // setDraggableは一度だけで良い
        scene.input.setDraggable(gameObject);

        // --- 既存リスナーをクリア ---
        gameObject.off('pointerdown');
        gameObject.off('drag');
        gameObject.off('pointerover');
        gameObject.off('pointerout');

        
        // ▼▼▼【ここからがダブルタップ検知のロジックです】▼▼▼
        // --------------------------------------------------------------------
        
        // --- タップ情報を記録するための変数をGameObjectに持たせる ---
       gameObject.setData('lastTap', 0);

            gameObject.on('pointerdown', (pointer) => {
    const currentMode = this.game.registry.get('editor_mode');
    
    // プレイモードの場合は、Buttonが発火させた'onClick'などの処理に任せる
    if (currentMode === 'play') {
        // --- プレイモードの場合 ---
        const events = gameObject.getData('events') || [];
        const onClickEvent = events.find(e => e.trigger === 'onClick');

        if (onClickEvent) {
            const actionInterpreter = this.game.registry.get('actionInterpreter');
            if (actionInterpreter) {
                // ActionInterpreterに直接実行を依頼
                actionInterpreter.run(gameObject, onClickEvent, null);
            }
        }
        return; // エディタの選択処理は行わない
    }

    // ▼▼▼【ここが誤爆を防ぐ核心です】▼▼▼
    // エディットモード（'select'など）でクリックされた場合は、
    // これ以降のイベント（Buttonの'onClick'など）が発火しないように、伝播を止める
    pointer.event.stopPropagation();
            // ▼▼▼【ロック状態をチェックするガード節を追加】▼▼▼
          const layerName = gameObject.getData('layer');
            const layer = this.layerStates.find(l => l.name === layerName);
            // レイヤーがロックされている場合は、選択もダブルタップも一切させない
            if (layer && layer.locked) {
                // console.log(`Object '${gameObject.name}' on locked layer '${layerName}' cannot be selected.`);
                return; 
            }
            const now = Date.now();
            const lastTap = gameObject.getData('lastTap');
            const diff = now - lastTap;
            
            gameObject.setData('lastTap', now);

            if (diff < 300) { // ダブルタップの処理
                const groupId = gameObject.getData('group');
                
                // ▼▼▼【ここからが修正箇所です】▼▼▼
                if (groupId && typeof scene.getObjectsByGroup === 'function') {
                    // ★ BaseGameSceneの新しいメソッドを呼び出して、グループメンバーを取得
                    const groupObjects = scene.getObjectsByGroup(groupId);
                    
                    // console.log(`[EditorPlugin] Double tap detected. Selecting ${groupObjects.length} objects in group: ${groupId}`);
                    this.selectMultipleObjects(groupObjects);
                } else {
                    // グループがない場合は、通常通りシングルオブジェクトを選択
                    this.selectSingleObject(gameObject);
                }
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            } else { // シングルタップの処理
               setTimeout(() => {
                    if (gameObject.getData('lastTap') === now) {
                        this.selectSingleObject(gameObject);
                    }
                }, 300);
            }
        });
        
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        
        // ▼▼▼【ここからが追加修正箇所】▼▼▼
        // --------------------------------------------------------------------
        // --- drag ---
         // ▼▼▼ グループドラッグのロジックをここに追加 ▼▼▼
        gameObject.off('dragstart');
        gameObject.on('dragstart', (pointer) => {
              // ▼▼▼【ここにもロック状態チェックを追加】▼▼▼
             // ▼▼▼【ここにも同様のガード節を追加】▼▼▼
            const layerName = gameObject.getData('layer');
            const layer = this.layerStates.find(l => l.name === layerName);
            if (layer && layer.locked) {
                // ドラッグ不可にするおまじない
                if(gameObject.input) gameObject.input.draggable = false;
                return;
            }
            if(gameObject.input) gameObject.input.draggable = true;
            // もし複数選択中なら、各オブジェクトの初期位置を記憶
            if (this.selectedObjects && this.selectedObjects.length > 0) {
                this.selectedObjects.forEach(obj => {
                    obj.setData('dragStartX', obj.x);
                    obj.setData('dragStartY', obj.y);
                });
            }
        });

        gameObject.off('drag');
        gameObject.on('drag', (pointer, dragX, dragY) => {
            
            // ▼▼▼【ここからが修正の核心です】▼▼▼
            // --- ポインターの移動差分を取得 ---
            const dx = pointer.x - pointer.prevPosition.x;
            const dy = pointer.y - pointer.prevPosition.y;

            // --- カメラのズームを考慮して、移動量を補正 ---
            const camera = this.getActiveGameCamera();
            const zoom = camera ? camera.zoom : 1;
            const moveX = dx / zoom;
            const moveY = dy / zoom;

            // --- もし複数選択中なら、グループ全体を動かす ---
            if (this.selectedObjects && this.selectedObjects.length > 0) {
                this.selectedObjects.forEach(obj => {
                    obj.x += moveX;
                    obj.y += moveY;
                    if (obj.body) {
                        // ボディの位置も差分で更新する
                        Phaser.Physics.Matter.Matter.Body.translate(obj.body, { x: moveX, y: moveY });
                    }
                });
            } else {
                // --- 単体選択中のドラッグ ---
                gameObject.x += moveX;
                gameObject.y += moveY;
                if (gameObject.body) {
                    Phaser.Physics.Matter.Matter.Body.translate(gameObject.body, { x: moveX, y: moveY });
                }
            }
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            // ドラッグ中はUIを更新しない
        });

        gameObject.off('dragend');
        gameObject.on('dragend', (pointer) => {
            // ドラッグが終わったタイミングでUIを更新
            if (this.selectedObjects && this.selectedObjects.length > 0) {
                this.selectMultipleObjects(this.selectedObjects); // 複数選択UIを再表示
            } else {
                this.updatePropertyPanel();
            }
        });
    

        
        gameObject.on('pointerover', () => {
             if (this.editorUI && this.editorUI.currentMode === 'select') {
                // ▼▼▼ 【setTintエラー対策】setTintメソッドが存在するか確認してから呼び出す ▼▼▼
                if (typeof gameObject.setTint === 'function') {
                    gameObject.setTint(0x00ff00);
                }
             }
        });
        
         gameObject.on('pointerout', () => {
            // ▼▼▼ 【setTintエラー対策】clearTintメソッドが存在するか確認してから呼び出す ▼▼▼
            if (typeof gameObject.clearTint === 'function') {
                gameObject.clearTint();
            }
        });
    }
    //---------/:::/
    //グループ系
    //-----////////

// in EditorPlugin.js

      /**
     * ★★★ 最終FIX版 ★★★
     * 複数選択されたオブジェクト（グループ）を、一つのプレハブとして書き出す。
     * アクティブなシーンのヘルパーメソッドを正しく呼び出す。
     */
    // in EditorPlugin.js

    /**
     * ★★★ 完全版 ★★★
     * 複数選択されたオブジェクト（グループ）を、一つのプレハブとして書き出す。
     * アクティブなシーンのヘルパーメソッドを正しく呼び出す。
     */
    exportGroupToPrefab() {
        if (!this.selectedObjects || this.selectedObjects.length < 1) {
            alert("プレハブとして書き出すグループを、まず選択してください。");
            return;
        }

        const prefabName = prompt("このグループプレハブの名前を入力してください:", "my_unit_01");
        if (!prefabName) {
            // ユーザーがキャンセルした場合は何もしない
            return;
        }

        // --- 0. 現在アクティブなゲームシーンへの参照を取得 ---
        const activeScene = this.getActiveGameScene();
        if (!activeScene || typeof activeScene.extractLayoutFromObject !== 'function') {
            alert("エラー: レイアウト情報を抽出できるアクティブなシーンが見つかりません。");
            return;
        }

        // --- 1. Phaser 3.60の方法で、グループ全体のバウンディングボックスを計算 ---
        const tempContainer = activeScene.add.container(0, 0);
        // ★ 選択中のオブジェクトを一時的にコンテナに追加
        // ★ コンテナに追加すると元の親から削除されてしまう可能性があるため、座標だけを使って計算するのがより安全
        const allBounds = this.selectedObjects.map(obj => obj.getBounds());
        const bounds = Phaser.Geom.Rectangle.Union(...allBounds);
        
        // --- 2. グループの中心点を計算 ---
        const centerX = bounds.centerX;
        const centerY = bounds.centerY;

        const prefabData = {
            name: prefabName,
            type: 'GroupPrefab', // このプレハブがグループであることを示す特別なタイプ
            objects: []
        };
        
        // --- 3. 各オブジェクトの情報を、中心点からの「相対座標」で保存 ---
        this.selectedObjects.forEach(gameObject => {
            // activeScene の extractLayoutFromObject を呼び出す
            const layout = activeScene.extractLayoutFromObject(gameObject);
            
            // ワールド座標を、グループの中心からの相対座標に変換
            layout.x = Math.round(gameObject.x - centerX);
            layout.y = Math.round(gameObject.y - centerY);
            
            prefabData.objects.push(layout);
        });

        // --- 4. JSONを生成して出力 ---
        try {
            const jsonString = JSON.stringify(prefabData, null, 2);
            
            // console.log(`%c--- Group Prefab Data for [${prefabName}] ---`, "color: #4CAF50; font-weight: bold;");
            // console.log(jsonString);
            
            navigator.clipboard.writeText(jsonString).then(() => {
                alert(`グループプレハブ '${prefabName}' のJSONデータをクリップボードにコピーしました。\n\n'assets/data/prefabs/${prefabName}.json' のような名前で保存してください。`);
            }).catch(err => {
                console.error('クリップボードへのコピーに失敗しました: ', err);
                alert('クリップボードへのコピーに失敗しました。コンソールを確認してください。');
            });

        } catch (error) {
            console.error("[EditorPlugin] FAILED to stringify group prefab data.", error);
            alert("グループプレハブの書き出しに失敗しました。コンソールを確認してください。");
        }
    }


   
     /**
     * ★★★ 修正版 ★★★
     * 単体選択のロジック。
     * 複数選択状態を解除する処理を追加。
     */
    selectSingleObject(gameObject) {
        // もし複数選択中だったら、それを解除する
        this.deselectMultipleObjects();

        this.selectedObject = gameObject;
        setTimeout(() => this.updatePropertyPanel(), 0);
        // ★ オブジェクトに選択中であることを示す視覚的なフィードバックを追加すると、より良くなる
        // 例: gameObject.setTint(0x00ff00);
        
    }
 /**
     * すべての選択状態を解除する
     */
    deselectAll() {
        if (this.selectedObject && typeof this.selectedObject.clearTint === 'function') {
            this.selectedObject.clearTint();
        }
        this.selectedObject = null;
        
        if (this.selectedObjects && this.selectedObjects.length > 0) {
            this.selectedObjects.forEach(obj => {
                if (typeof obj.clearTint === 'function') obj.clearTint();
            });
        }
        
        this.selectedLayer = null;
        setTimeout(() => this.updatePropertyPanel(), 0);
        if (this.editorUI) this.editorUI.buildLayerPanel();
        this.selectedObjects = [];
        setTimeout(() => this.updatePropertyPanel(), 0);
        
    }

    selectMultipleObjects(gameObjects) {
        this.deselectAll();
        this.selectedObjects = gameObjects;
        
        gameObjects.forEach(obj => {
            if(typeof obj.setTint === 'function') obj.setTint(0x00ffff);
        });
       
        setTimeout(() => this.updatePropertyPanel(), 0);
    }

   // in EditorPlugin.js

    /**
     * ★★★ 新規追加 ★★★
     * 複数オブジェクト選択時のプロパティパネルUIを構築する。
     * 以前 selectMultipleObjects メソッド内にあったロジックを、ここに移動させたもの。
     */
    createMultiSelectUI() {
        if (!this.selectedObjects || this.selectedObjects.length === 0) return;
        const gameObjects = this.selectedObjects;

         // --- グループプレハブ書き出しボタン ---
        const exportGroupButton = document.createElement('button');
        exportGroupButton.innerText = 'Export Group as Prefab';
        exportGroupButton.style.backgroundColor = '#4a8a4a'; // 分かりやすい色に
        exportGroupButton.onclick = () => {
            this.exportGroupToPrefab(); // これから実装する新しいメソッドを呼び出す
        };
        this.editorPropsContainer.appendChild(exportGroupButton);
        this.editorPropsContainer.appendChild(document.createElement('hr'));
        // --- グループ一括削除ボタン ---
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete Selected Group';
        deleteButton.style.backgroundColor = '#e65151';
        deleteButton.onclick = () => {
            if (confirm(`本当に選択中の ${gameObjects.length} 個のオブジェクトをすべて削除しますか？`)) {
                [...this.selectedObjects].forEach(obj => {
                    const sceneKey = obj.scene.scene.key;
                    if (this.editableObjects.has(sceneKey)) {
                        this.editableObjects.get(sceneKey).delete(obj);
                    }
                    obj.destroy();
                });
                this.deselectAll();
            }
        };
        this.editorPropsContainer.appendChild(deleteButton);
        this.editorPropsContainer.appendChild(document.createElement('hr'));

        // --- 一括物理ボディ設定 ---
        const physicsTitle = document.createElement('h4');
        physicsTitle.innerText = '一括 物理ボディ設定';
        this.editorPropsContainer.appendChild(physicsTitle);

        const needsBody = gameObjects.some(obj => !obj.body); 
        if (needsBody) {
            const addBodyButton = document.createElement('button');
            addBodyButton.innerText = 'グループに物理ボディを付与';
            addBodyButton.onclick = () => {
                this.applyPhysicsToGroup({ addBody: true });
            };
            this.editorPropsContainer.appendChild(addBodyButton);
        } else {
            const removeBodyButton = document.createElement('button');
            removeBodyButton.innerText = 'グループの物理ボディを削除';
            removeBodyButton.style.backgroundColor = '#e65151';
            removeBodyButton.onclick = () => {
                this.applyPhysicsToGroup({ removeBody: true });
            };
            this.editorPropsContainer.appendChild(removeBodyButton);
        }

        if (!needsBody) {
            const staticButton = document.createElement('button');
            staticButton.innerText = 'すべて静的ボディに設定';
            staticButton.onclick = () => {
                this.applyPhysicsToGroup({ isStatic: true });
            };
            const dynamicButton = document.createElement('button');
            dynamicButton.innerText = 'すべて動的ボディに設定';
            dynamicButton.onclick = () => {
                this.applyPhysicsToGroup({ isStatic: false });
            };
            this.editorPropsContainer.append(staticButton, dynamicButton);
        }

        this.editorPropsContainer.appendChild(document.createElement('hr'));

        // --- （参考）グループのプロパティ一括変更 ---
        const alphaRow = document.createElement('div');
        const alphaLabel = document.createElement('label');
        alphaLabel.innerText = 'Alpha (All):';
        const alphaInput = document.createElement('input');
        alphaInput.type = 'range';
        alphaInput.min = 0;
        alphaInput.max = 1;
        alphaInput.step = 0.01;
        alphaInput.value = gameObjects[0] ? gameObjects[0].alpha : 1;
        alphaInput.oninput = (e) => {
            const newAlpha = parseFloat(e.target.value);
            this.selectedObjects.forEach(obj => obj.setAlpha(newAlpha));
        };
        alphaRow.append(alphaLabel, alphaInput);
        this.editorPropsContainer.appendChild(alphaRow);
    }
 
    /**
     * ★★★ 最終仕上げ版 ★★★
     * 選択中のグループに対して、物理プロパティを一括で適用する。
     * @param {{addBody?: boolean, removeBody?: boolean, isStatic?: boolean}} options
     */
    applyPhysicsToGroup(options) {
        if (!this.selectedObjects || this.selectedObjects.length === 0) return;

        // console.log(`[EditorPlugin | Final Touch] Applying physics to group:`, options);

        // 選択中のすべてのオブジェクトに対してループ処理
        this.selectedObjects.forEach(target => {
            const scene = target.scene;
            if (!scene) return;

            // --- ボディ付与 ---
            if (options.addBody && !target.body) {
                const bodyWidth = target.width * target.scaleX;
                const bodyHeight = target.height * target.scaleY;
                scene.matter.add.gameObject(target, {
                    shape: { type: 'rectangle', width: bodyWidth, height: bodyHeight },
                    // ▼▼▼【ここが修正点１】▼▼▼
                    // デフォルトで isStatic: true を設定
                    isStatic: true
                });
            }

            // --- ボディ削除 ---
            if (options.removeBody && target.body) {
                scene.matter.world.remove(target.body);
            }

            // --- 静的/動的の切り替え ---
            if (options.isStatic !== undefined && target.body) {
                target.setStatic(options.isStatic);
            }
        });

        // ▼▼▼【ここが修正点２】▼▼▼
        // --------------------------------------------------------------------
        // --- UIを即時更新するために、少し遅延させてから再描画を呼び出す ---
        // これにより、ボディの削除が完了した「後」の最新の状態でUIが再構築される
        setTimeout(() => {
            if (this.selectedObjects && this.selectedObjects.length > 0) {
                this.selectMultipleObjects(this.selectedObjects);
            } else {
                this.deselectAll(); // もし何らかの理由で選択が解除されていた場合
            }
        }, 0);
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }
    /**
     * ★★★ 新規メソッド ★★★
     * すべての複数選択を解除する
     */
    deselectMultipleObjects() {
        if (this.selectedObjects && this.selectedObjects.length > 0) {
            this.selectedObjects.forEach(obj => {
                if(typeof obj.clearTint === 'function') obj.clearTint();
            });
        }
        this.selectedObjects = [];
    }
  // src/plugins/EditorPlugin.js

   // in src/plugins/EditorPlugin.js

exportLayoutToJson() {
    if (!this.selectedObject || !this.selectedObject.scene) {
        alert("エクスポートするシーンのオブジェクトを、最低一つ選択してください。");
        return;
    }
    

    const scene = this.selectedObject.scene;
    const sceneKey = scene.scene.key;
    const gameScene = this.getActiveGameScene();

    const sceneLayoutData = {
            scene_settings: scene.sceneSettings || {},
        hasJoystick: !!(gameScene && gameScene.joystick), 
        layers: this.layerStates,
        objects: [],
        animations: []
    };

    try {
        if (this.editableObjects.has(sceneKey)) {
            const liveObjects = Array.from(this.editableObjects.get(sceneKey)).filter(go => go && go.scene);
            
            for (const gameObject of liveObjects) {
                if (!gameObject.name) continue;


                // 1. instanceof を使って、オブジェクトの型を安全に判定する
                let objectType;
                if (gameObject instanceof Phaser.GameObjects.Sprite) objectType = 'Sprite';
                else if (gameObject instanceof Phaser.GameObjects.Text) objectType = 'Text';
                else if (gameObject instanceof Phaser.GameObjects.Image) objectType = 'Image';
                else objectType = gameObject.constructor.name;

                // 2. objDataの骨格を定義
                const objData = {
                    name: gameObject.name,
                    type: objectType,
                    x: Math.round(gameObject.x),
                    y: Math.round(gameObject.y),
                    depth: gameObject.depth,
                    scaleX: parseFloat(gameObject.scaleX.toFixed(2)),
                    scaleY: parseFloat(gameObject.scaleY.toFixed(2)),
                    angle: Math.round(gameObject.angle),
                    alpha: parseFloat(gameObject.alpha.toFixed(2)),
                };

                // 3. 永続化が必要な「全カスタムデータ」を取得
                const allCustomData = { ...gameObject.data.values };

                // 4. トップレベルに保存するプロパティを allCustomData から分離
                objData.layer = allCustomData.layer;
                objData.group = allCustomData.group;
                objData.events = allCustomData.events;
                objData.components = allCustomData.components;
                objData.animation_data = allCustomData.animation_data;
                objData.anim_prefix = allCustomData.anim_prefix;
                
                delete allCustomData.layer;
                delete allCustomData.group;
                delete allCustomData.events;
                delete allCustomData.components;
                delete allCustomData.animation_data;
                delete allCustomData.anim_prefix;

                // 5. テクスチャ/クロップ情報を処理 & dataから削除
                const cropSourceData = allCustomData.cropSource;
                if (cropSourceData) {
                    objData.cropSource = cropSourceData;
                    delete allCustomData.cropSource;
                } else if (gameObject.texture && gameObject.texture.key && gameObject.texture.key !== '__DEFAULT') {
                    objData.texture = gameObject.texture.key;
                }
                
                // 6. イベントデータの自動修復
                if (objData.events && Array.isArray(objData.events)) {
                    objData.events.forEach(event => {
                        if (event.nodes && Array.isArray(event.nodes)) {
                            event.nodes.forEach(node => {
                                if (node.type === 'anim_play' && node.params && node.params.name !== undefined) {
                                    node.params.key = node.params.name;
                                    delete node.params.name;
                                }
                            });
                        }
                    });
                }

                // 7. UISceneの特別処理
                if (sceneKey === 'UIScene') {
                    objData.registryKey = allCustomData.registryKey;
                    delete allCustomData.registryKey;
                }
                
                // 8. その他の固有プロパティを抽出
                if (typeof gameObject.text === 'string') objData.text = gameObject.text;
                if (gameObject.style) objData.style = gameObject.style.toJSON();
                if (gameObject.watchVariable) objData.watchVariable = gameObject.watchVariable;
                if (gameObject.maxVariable) objData.maxVariable = gameObject.maxVariable;
                if (gameObject.textObject) objData.label = gameObject.textObject.text;

                // 9. 物理ボディの抽出 & 物理関連データをdataから削除
                if (gameObject.body) {
                    const body = gameObject.body;
                    objData.physics = {
                        isStatic: body.isStatic,
                        isSensor: body.isSensor,
                        fixedRotation: allCustomData.fixedRotation || false,
                        gravityScale: body.gravityScale.y,
                        friction: parseFloat(body.friction.toFixed(2)),
                        restitution: parseFloat(body.restitution.toFixed(2)),
                       collisionFilter: {
            category: gameObject.getData('collision_category') ?? body.collisionFilter.category,
            mask: gameObject.getData('collision_mask') ?? body.collisionFilter.mask
        }
                    };
                    delete allCustomData.fixedRotation;
                    delete allCustomData.ignoreGravity;
                    delete allCustomData.shape;
                }

                // 10. 残ったものを、全て 'data' ブロックに格納
                objData.data = allCustomData;
                
                // 11. 最終的なオブジェクトデータを配列に追加
                sceneLayoutData.objects.push(objData);
            }
        }
    
        // アニメーションデータの抽出
        if (sceneKey !== 'UIScene') {
            const allGlobalAnims = Array.from(this.pluginManager.game.anims.anims.values());
            sceneLayoutData.animations = allGlobalAnims.map(anim => ({
                key: anim.key,
                texture: anim.frames[0]?.textureKey,
                frames: { 
                    start: anim.frames[0]?.frame.name, 
                    end: anim.frames[anim.frames.length - 1]?.frame.name 
                },
                frameRate: anim.frameRate,
                repeat: anim.repeat
            })).filter(animData => animData.texture);
        } else {
            delete sceneLayoutData.animations;
        }
    
        // JSONに変換して出力
        const jsonString = JSON.stringify(sceneLayoutData, null, 2);
        // console.log(`%c--- Layout for [${sceneKey}] ---`, "color: lightgreen;");
        // console.log(jsonString);
        navigator.clipboard.writeText(jsonString).then(() => {
            alert(`Layout for ${sceneKey} copied to clipboard!`);
        });

    } catch (error) {
        console.error("[EditorPlugin] FAILED to stringify layout data.", error);
        alert("Failed to export layout. Check the console for a critical error.");
    }
}
   // in src/plugins/EditorPlugin.js

    /**
     * ★★★ 修正版 ★★★
     * 現在選択されている単一のオブジェクトを、プレハブ用のJSONとしてエクスポートする。
     */
    exportSelectionToPrefab() {
        if (!this.selectedObject) {
            alert("プレハブとして保存したいオブジェクトを、まず選択してください。");
            return;
        }

        const gameObject = this.selectedObject;
        const prefabName = prompt("このプレハブの名前を入力してください (例: coin, bullet):", gameObject.name);

        if (!prefabName) return;

        try {
            // --- 1. objDataの骨格を定義 ---
            // ★★★ 変数名を prefabData から objData に統一（またはその逆）★★★
            const objData = {
                name: prefabName, // ★ ユーザーが入力した名前を使用
                type: 'Unknown', // 初期値
                // ★ 座標(x, y)はプレハブに不要
                depth: gameObject.depth,
                scaleX: parseFloat(gameObject.scaleX.toFixed(2)),
                scaleY: parseFloat(gameObject.scaleY.toFixed(2)),
                angle: Math.round(gameObject.angle),
                alpha: parseFloat(gameObject.alpha.toFixed(2)),
            };

            // --- 2. exportLayoutToJson と同じロジックでプロパティを抽出 ---
            
            // 型を判定
            if (gameObject instanceof Phaser.GameObjects.Sprite) objData.type = 'Sprite';
            else if (gameObject instanceof Phaser.GameObjects.Text) objData.type = 'Text';
            else if (gameObject instanceof Phaser.GameObjects.Image) objData.type = 'Image';
            else objData.type = gameObject.constructor.name;
            
            // 全カスタムデータを取得
            const allCustomData = { ...gameObject.data.values };

            // トップレベルプロパティを分離
            objData.layer = allCustomData.layer;
            objData.group = allCustomData.group;
            objData.events = allCustomData.events;
            objData.components = allCustomData.components;
            objData.animation_data = allCustomData.animation_data;
            objData.anim_prefix = allCustomData.anim_prefix;
            
            delete allCustomData.layer;
            delete allCustomData.group;
            delete allCustomData.events;
            delete allCustomData.components;
            delete allCustomData.animation_data;
            delete allCustomData.anim_prefix;

            // テクスチャ/クロップ情報を処理
            const cropSourceData = allCustomData.cropSource;
            if (cropSourceData) {
                objData.cropSource = cropSourceData;
                delete allCustomData.cropSource;
            } else if (gameObject.texture && gameObject.texture.key && gameObject.texture.key !== '__DEFAULT') {
                objData.texture = gameObject.texture.key;
            }
            
            // イベントデータの修復
            if (objData.events && Array.isArray(objData.events)) {
                objData.events.forEach(event => {
                    if (event.nodes && Array.isArray(event.nodes)) {
                        event.nodes.forEach(node => {
                            if (node.type === 'anim_play' && node.params && node.params.name !== undefined) {
                                node.params.key = node.params.name;
                                delete node.params.name;
                            }
                        });
                    }
                });
            }

            // テキスト固有プロパティ
            if (objData.type === 'Text') {
                objData.text = gameObject.text;
                if (gameObject.style) objData.style = gameObject.style.toJSON();
            }

            // 物理ボディの抽出
            if (gameObject.body) {
                const body = gameObject.body;
                objData.physics = {
                    isStatic: body.isStatic,
                    isSensor: body.isSensor,
                    fixedRotation: allCustomData.fixedRotation || false,
                    gravityScale: body.gravityScale.y,
                    friction: parseFloat(body.friction.toFixed(2)),
                    restitution: parseFloat(body.restitution.toFixed(2)),
                    collisionFilter: {
                        category: gameObject.getData('collision_category') ?? body.collisionFilter.category,
                        mask: gameObject.getData('collision_mask') ?? body.collisionFilter.mask
                    }
                };
                delete allCustomData.fixedRotation;
                delete allCustomData.ignoreGravity; // ignoreGravityはgravityScale:0で表現
                delete allCustomData.shape;
            }

            // 残ったものを 'data' に格納
            objData.data = allCustomData;

            // --- 3. JSONに変換して出力 ---
            const jsonString = JSON.stringify(objData, null, 2);
            navigator.clipboard.writeText(jsonString).then(() => {
                alert(`Prefab '${prefabName}' のJSONデータをクリップボードにコピーしました。\n\n'assets/data/prefabs/${prefabName}.json' という名前で保存してください。`);
            });

        } catch (error) {
            console.error("[EditorPlugin] FAILED to stringify prefab data.", error);
            alert("プレハブのエクスポートに失敗しました。コンソールを確認してください。");
        }
    }

    // --- モーダルウィンドウ関連 ---

    openAnimationEditor() {
        if (!this.animEditorOverlay) return;
        if (!this.selectedObject) {
            alert('先にオブジェクトを選択してください。');
            return;
        }

        this.pluginManager.game.input.enabled = false;
        const contentArea = document.getElementById('animation-editor-content');
        contentArea.innerHTML = '';

        const isSprite = (this.selectedObject instanceof Phaser.GameObjects.Sprite);

        if (isSprite) {
            const createForm = this.createAnimationCreationForm();
            contentArea.appendChild(createForm);
            const animList = this.createAnimationList();
            contentArea.appendChild(animList);
        } else {
            const message = document.createElement('p');
            message.innerText = `オブジェクト「${this.selectedObject.name}」はスプライトではないため、アニメーションできません。`;
            const convertButton = document.createElement('button');
            convertButton.innerText = 'スプライトに変換する';
            convertButton.onclick = () => { this.convertImageToSprite(); };
            contentArea.appendChild(message);
            contentArea.appendChild(convertButton);
        }

        const titleElement = document.getElementById('animation-editor-title');
        if (titleElement) {
            titleElement.innerText = `アニメーション編集: ${this.selectedObject.name}`;
        }
        this.animEditorOverlay.style.display = 'flex';
    }

    closeAnimationEditor() {
        if (!this.animEditorOverlay) return;
        this.animEditorOverlay.style.display = 'none';
        this.pluginManager.game.input.enabled = true;
    }

   // in src/plugins/EditorPlugin.js

/**
 * ★★★ グローバルアニメーションとして作成する最終FIX版 ★★★
 * アニメーションエディタ内に、新しいアニメーションを作成するためのUIフォームを生成する。
 */
c// in src/plugins/EditorPlugin.js

/**
 * ★★★ グローバルアニメーションとして作成する最終FIX版 ★★★
 * アニメーションエディタ内に、新しいアニメーションを作成するためのUIフォームを生成する。
 */
createAnimationCreationForm() {
    const form = document.createElement('div');
    form.style.border = '1px solid #444';
    form.style.padding = '10px';
    form.style.marginBottom = '15px';

    const title = document.createElement('h4');
    title.innerText = '新しいアニメーションを作成';
    title.style.marginTop = '0';
    form.appendChild(title);

    const animKeyInput = document.createElement('input');
    animKeyInput.type = 'text';
    animKeyInput.placeholder = 'アニメーション名 (例: walk)';

    const framesInput = document.createElement('input');
    framesInput.type = 'text';
    framesInput.placeholder = 'フレーム番号 (例: 0-7 or 0,2,4)';

    const frameRateInput = document.createElement('input');
    frameRateInput.type = 'number';
    frameRateInput.value = 10;
    frameRateInput.placeholder = 'フレームレート';

    const repeatCheckbox = document.createElement('input');
    repeatCheckbox.type = 'checkbox';
    repeatCheckbox.checked = true;
    const repeatLabel = document.createElement('label');
    repeatLabel.innerText = ' ループ再生';
    repeatLabel.appendChild(repeatCheckbox);

    const createBtn = document.createElement('button');
    createBtn.innerText = '作成';
    
    createBtn.onclick = () => {
        const textureKey = this.selectedObject?.texture?.key;
        const animKey = animKeyInput.value;
        const framesStr = framesInput.value;
        const frameRate = parseInt(frameRateInput.value);
        const repeat = repeatCheckbox.checked ? -1 : 0;

        if (!animKey || !framesStr || !frameRate || !textureKey) {
            alert('テクスチャが設定されたスプライトを選択し、全ての項目を入力してください。');
            return;
        }

        // ★★★ ゲーム全体(グローバル)のアニメーションマネージャーを取得 ★★★
        const animManager = this.pluginManager.game.anims;
        
        if (animManager.exists(animKey)) {
            if (!confirm(`アニメーションキー '${animKey}' は既に存在します。上書きしますか？`)) {
                return;
            }
            animManager.remove(animKey);
        }

        try {
            // generateFrameNumbersはシーンのコンテキストが必要なため、シーンのアニメーションマネージャーから呼び出す
            const frames = this.selectedObject.scene.anims.generateFrameNumbers(textureKey, {
                frames: this.parseFrameString(framesStr)
            });

            // ★ グローバルなアニメーションマネージャーにcreateする
            animManager.create({
                key: animKey,
                frames: frames,
                frameRate: frameRate,
                repeat: repeat
            });
            
            // console.log(`[EditorPlugin] Global animation '${animKey}' created/updated successfully.`);
            this.openAnimationEditor(); // UIをリフレッシュ
            
        } catch (error) {
            console.error(`アニメーションの作成に失敗しました: `, error);
            alert(`アニメーションの作成に失敗しました。\nフレーム番号の指定が正しいか、コンソールを確認してください。`);
        }
    };

    form.append(animKeyInput, framesInput, frameRateInput, repeatLabel, createBtn);
    return form;
}

   // in src/plugins/EditorPlugin.js

/**
 * ★★★ グローバルアニメーションを参照する最終FIX版 ★★★
 * アニメーションエディタ内に、現在選択中のスプライトに関連する、
 * 登録済みのアニメーションのリストを生成する。
 */
// in src/plugins/EditorPlugin.js

/**
 * ★★★ グローバルアニメーションを参照する最終FIX版 ★★★
 * アニメーションエディタ内に、現在選択中のスプライトに関連する、
 * 登録済みのアニメーションのリストを生成する。
 */
createAnimationList() {
    const container = document.createElement('div');
    const title = document.createElement('h4');
    title.innerText = '登録済みアニメーション';
    container.appendChild(title);

    if (!this.selectedObject || !this.selectedObject.scene || !this.selectedObject.texture?.key) {
        container.innerHTML += '<p>アニメーションを一覧表示するには、テクスチャが設定されたスプライトを選択してください。</p>';
        return container;
    }

    const currentTextureKey = this.selectedObject.texture.key;
    
    // ★★★ ゲーム全体(グローバル)のアニメーションマネージャーからアニメーションリストを取得する、正しい方法 ★★★
    const allAnims = Array.from(this.pluginManager.game.anims.anims.values());

    const filteredAnims = allAnims.filter(anim =>
        anim.frames && anim.frames.length > 0 && anim.frames[0].textureKey === currentTextureKey
    );

    if (filteredAnims.length === 0) {
        container.innerHTML += `<p>このテクスチャ (${currentTextureKey}) を使ったアニメーションはまだありません。</p>`;
    } else {
        filteredAnims.forEach(anim => {
            const div = document.createElement('div');
            div.style.marginBottom = '5px';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
    
            const infoSpan = document.createElement('span');
            infoSpan.innerText = `キー: ${anim.key}`;
            infoSpan.style.marginRight = '10px';
    
            const playBtn = document.createElement('button');
            playBtn.innerText = '再生';
            playBtn.onclick = () => { if (this.selectedObject?.play) this.selectedObject.play(anim.key); };
    
            const stopBtn = document.createElement('button');
            stopBtn.innerText = '停止';
            stopBtn.onclick = () => { if (this.selectedObject?.stop) this.selectedObject.stop(); };
    
            const setDefaultBtn = document.createElement('button');
            setDefaultBtn.innerText = 'デフォルトに設定';
            setDefaultBtn.onclick = () => {
                if (this.selectedObject) {
                    let animData = this.selectedObject.getData('animation_data') || {};
                    animData.default = anim.key;
                    this.selectedObject.setData('animation_data', animData);
                    alert(`'${anim.key}' をデフォルトアニメーションに設定しました。`);
                }
            };
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = '×';
            deleteBtn.title = `Delete animation '${anim.key}'`;
            deleteBtn.style.backgroundColor = '#666';
            deleteBtn.onclick = () => {
                if (confirm(`本当にグローバルアニメーション '${anim.key}' を削除しますか？\nこの操作は取り消せません。`)) {
                    this.pluginManager.game.anims.remove(anim.key);
                    this.openAnimationEditor(); // UIをリフレッシュ
                }
            };
    
            div.append(infoSpan, playBtn, stopBtn, setDefaultBtn, deleteBtn);
            container.appendChild(div);
        });
    }
    
    return container;
}

    parseFrameString(str) {
        const parts = str.split(',');
        let frames = [];
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                for (let i = start; i <= end; i++) frames.push(i);
            } else {
                frames.push(Number(part));
            }
        }
        return frames;
    }

   // in src/plugins/EditorPlugin.js

// in src/plugins/EditorPlugin.js

/**
 * ★★★ 二段階初期化を活用した、データ損失のない最終FIX版 ★★★
 * 選択中のImageオブジェクトを、すべてのプロパティを維持したままSpriteオブジェクトに変換する。
 */
convertImageToSprite() {
    const oldImage = this.selectedObject;
    if (!oldImage || !(oldImage instanceof Phaser.GameObjects.Image)) return;

    const scene = oldImage.scene;
    if (!scene || typeof scene.extractLayoutFromObject !== 'function') return;

    // console.log(`[EditorPlugin] Converting Image '${oldImage.name}' to Sprite...`);

    // --- 1. 既存のオブジェクトから、すべての情報をレイアウトデータとして抽出 ---
    const layout = scene.extractLayoutFromObject(oldImage);

    // --- 2. タイプだけを 'Sprite' に上書き ---
    layout.type = 'Sprite';
    
    // --- 3. 古いオブジェクトをシーンから安全に削除 ---
    const sceneKey = scene.scene.key;
    if (this.editableObjects.has(sceneKey)) {
        this.editableObjects.get(sceneKey).delete(oldImage);
    }
    oldImage.destroy();

    // --- 4. 新しいレイアウトデータを使って、二段階初期化でオブジェクトを完璧に再生成 ---
    const newSprite = scene.createObjectFromLayout(layout);
    scene.applyProperties(newSprite, layout);
    scene.initComponentsAndEvents(newSprite);

    // --- 5. 新しく生成されたスプライトを選択状態にし、UIを更新 ---
    this.selectSingleObject(newSprite);
    this.openAnimationEditor(); // アニメーションエディタを即座に開く
}

 /*openEventEditor() {
        if (!this.selectedObject) {
            alert('先にイベントを編集するオブジェクトを選択してください。');
            return;
        }

        // --- 1. Phaserの入力を止める ---
        this.pluginManager.game.input.enabled = false;
        
        // ▼▼▼【ここを、このように書き換えます】▼▼▼
        // --------------------------------------------------------------------
        
        // --- 2. EditorUIに、UIの構築と表示を「依頼」する ---
        //    (DOM操作やpopulateの呼び出しは、EditorUIの責任範囲)
        if (this.editorUI) {
            this.editorUI.openEventEditor(this.selectedObject);
        }
        
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }*/
    /**
     * ★★★ 新規メソッド ★★★
     * オブジェクトのイベントデータを、新しいノードベース構造に変換・初期化する
     */
    
    /**
     * ★★★ マルチトリガー対応版 ★★★
     * オブジェクトのイベントデータを、新しいノードベース構造に変換・初期化する
     * @param {Phaser.GameObjects.GameObject} targetObject - 対象のオブジェクト
     */
    initializeEventData(targetObject) {
        let events = targetObject.getData('events') || [];

        // --- ケース1: まだイベントが何もない場合 ---
        if (events.length === 0) {
            // 何もしない。EditorUI側で「追加」ボタンを押したときに最初のイベントが作られる。
            return; 
        }

        // --- ケース2: 古い単一イベントのデータ構造の場合 ---
        // (各イベント定義に'id'プロパティがないことで判定)
        if (events.length > 0 && events[0].id === undefined) {
            // console.log("Migrating single-event structure to new multi-trigger structure...");
            
            const oldEventData = events[0]; // 古いデータは最初の要素だけだと仮定
            
            const newEvent = {
                id: `event_${Date.now()}`, // ユニークなIDを付与
                trigger: oldEventData.trigger || 'onClick',
                nodes: oldEventData.nodes || [],
                connections: oldEventData.connections || [],
                targetGroup: oldEventData.targetGroup,
                condition: oldEventData.condition
            };

            // ★ 新しい配列で、完全に置き換える
            events = [newEvent];
        }
        
        // ★ 変換後の、新しいデータ構造をオブジェクトに保存する
        targetObject.setData('events', events);
    }
  
    // src/plugins/EditorPlugin.js

    /*/**
     * ★★★ 既存のヘルパーを、VSL用に再利用 ★★★
     * ノードのパラメータを更新し、永続化する
     */
  // src/plugins/EditorPlugin.js
// src/plugins/EditorPlugin.js

    /**
     * ★★★ 最終FIX版 (引数名を修正) ★★★
     * EditorUIからの依頼で、特定のVSLノードのパラメータを更新し、永続化する
     * @param {object} nodeData - 更新対象のノードデータそのもの
     * @param {string} paramKey - 更新するパラメータのキー
     * @param {string|number|boolean} paramValue - 新しい値
     */
   // in src/plugins/EditorPlugin.js

    /**
     * ★★★ 最終FIX版 (ノード位置更新も統合) ★★★
     * VSLノードのパラメータ、またはプロパティ(x, y)を更新し、永続化する
     * @param {object} nodeData - 更新対象のノードデータ
     * @param {string} paramKey - 更新するキー ('x', 'y', または params内のキー)
     * @param {any} paramValue - 新しい値
     * @param {boolean} isPosition - 位置の更新かどうかを示すフラグ
     */
    updateNodeParam(nodeData, paramKey, paramValue, isPosition = false) {
        if (!this.editorUI || !this.editorUI.editingObject || !nodeData) {
            console.error("Cannot update node param: Editing context is missing.");
            return;
        }

        // --- 1. 永続化するデータを更新 ---
        const targetObject = this.editorUI.editingObject;
        const allEvents = targetObject.getData('events');
        
        // 念のため、最新のノードデータをイベント配列から再検索する
        let freshNodeData = null;
        for (const event of allEvents) {
            freshNodeData = event.nodes.find(n => n.id === nodeData.id);
            if (freshNodeData) break;
        }

        if (!freshNodeData) return; // ノードが見つからなければ終了

        if (isPosition) {
            // 位置(x, y)の更新の場合
            freshNodeData[paramKey] = paramValue;
        } else {
            // パラメータ(params)の更新の場合
            if (!freshNodeData.params) freshNodeData.params = {};
            freshNodeData.params[paramKey] = paramValue;
        }

        targetObject.setData('events', allEvents);

        // --- 2. UIを再描画 ---
        // 位置の変更の場合は、線を描き直すためにキャンバス全体を更新
        if (isPosition) {
            this.editorUI.populateVslCanvas();
        }
    }
    /**
     * ★★★ 新規追加 ★★★
     * EditorUIからの依頼で、VSLノードの位置を更新し、永続化・再描画する
     */
   // in src/plugins/EditorPlugin.js

    updateNodePosition(targetObject, nodeId, key, value) {
        if (!targetObject) return;
        
        // ▼▼▼【ここが修正箇所です】▼▼▼
        // --------------------------------------------------------------------
        // 1. 最新のイベントデータを取得
        const events = targetObject.getData('events') || [];
        
        // 2. すべてのイベントグラフをループして、該当するノードを探す (より安全)
        for (const eventData of events) {
            if (eventData.nodes) {
                const nodeData = eventData.nodes.find(n => n.id === nodeId);
                if (nodeData) {
                    // 3. 見つけたら、そのノードの x または y プロパティだけを更新
                    nodeData[key] = value;
                    // 4. ループを抜ける
                    break;
                }
            }
        }

        // 5. 変更を含むイベントデータ全体を、改めて保存する
        targetObject.setData('events', events);
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        // ★ EditorUIに、キャンバスの再描画を依頼 (これは変更なし)
        if (this.editorUI) {
            this.editorUI.populateVslCanvas();
        }
    }
    /**
     * イベントエディタのコンテンツを生成・再描画する (UI最終版)
     */
  /*  populateEventEditor() {
        const contentArea = document.getElementById('event-editor-content');
        if (!contentArea || !this.selectedObject) return;
        
        // --- UIを一度完全にクリア ---
        contentArea.innerHTML = '';
        
        // --- データソースを取得 ---
        const events = this.selectedObject.getData('events') || [];
        
        // --- 各イベント定義から、編集UIを生成して追加 ---
        events.forEach((eventData, index) => {
            const eventDiv = this.createEventDisplay(eventData, index);
            contentArea.appendChild(eventDiv);
        });
        
        // --- 「新しいイベントを追加」ボタンを生成 ---
        const addButton = document.createElement('button');
        addButton.innerText = '新しいイベントを追加';
        addButton.className = 'add-event-button'; // スタイリング用
        addButton.onclick = () => {
            const currentEvents = this.selectedObject.getData('events') || [];
            // デフォルトのイベント定義を追加
            currentEvents.push({ trigger: 'onClick', actions: '' });
            this.selectedObject.setData('events', currentEvents);
            this.populateEventEditor(); // UIを再描画
        };
        contentArea.appendChild(addButton);
    }*/
    
    // in src/plugins/EditorPlugin.js

    /**
     * 個々のイベント編集UIを生成する (全てのトリガーをサポートする統合・最終版)
     * @param {object} eventData - 単一のイベント定義オブジェクト
     * @param {number} index - events配列内でのインデックス
     * @returns {HTMLElement} 生成されたdiv要素
     */
    createEventDisplay(eventData, index) {
        const div = document.createElement('div');
        div.className = 'event-card';

        // --- ヘッダー (トリガー選択と削除ボタン) ---
        const header = document.createElement('div');
        header.className = 'event-header';
        
        const triggerContainer = document.createElement('div');
        const triggerLabel = document.createElement('label');
        triggerLabel.innerText = 'トリガー: ';
        const triggerSelect = document.createElement('select');
        
        // ★★★ 全ての利用可能なトリガーをリスト化 ★★★
       const availableTriggers = [
    'onClick', 'onReady', 
    'onCollide_Start', 'onStomp', 'onHit', 
    'onOverlap_Start', 'onOverlap_End',
    'onStateChange', 'onDirectionChange',
    'onInteract' // ★★★ この一行をリストの末尾に追加 ★★★
];
availableTriggers.sort(); // アルファベット順にソートすると見やすい
        availableTriggers.forEach(t => {
            const option = document.createElement('option');
            option.value = t;
            option.innerText = t;
            if (t === eventData.trigger) option.selected = true;
            triggerSelect.appendChild(option);
        });
        triggerSelect.onchange = (e) => this.updateEventData(index, 'trigger', e.target.value);
        
        triggerContainer.append(triggerLabel, triggerSelect);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = '削除';
        deleteBtn.className = 'delete-button';
        deleteBtn.onclick = () => {
            if (confirm('このイベントを削除しますか？')) {
                const events = this.selectedObject.getData('events');
                events.splice(index, 1);
                this.selectedObject.setData('events', events);
                this.populateEventEditor();
            }
        };
        
        header.append(triggerContainer, deleteBtn);
        div.appendChild(header);

        // --- コンテキスト入力欄 (動的に表示) ---
        const contextContainer = document.createElement('div');
        contextContainer.className = 'event-context';
        
        // ▼▼▼【ここが修正の核心です】▼▼▼
        // "onCollide_Start", "onStomp", "onHit" のいずれかの場合に、'targetGroup'入力欄を表示
        if (['onCollide_Start','onOverlap_Start', 'onOverlap_End',  'onStomp', 'onHit'].includes(eventData.trigger)) {
            const targetLabel = document.createElement('label');
            targetLabel.innerText = '相手のグループ: ';
            const targetInput = document.createElement('input');
            targetInput.type = 'text';
            targetInput.placeholder = 'e.g., enemy, coin, wall';
            targetInput.value = eventData.targetGroup || '';
            targetInput.onchange = (e) => this.updateEventData(index, 'targetGroup', e.target.value);
            contextContainer.append(targetLabel, targetInput);
        }
        // "onStateChange", "onDirectionChange" の場合に、'condition'入力欄を表示
        else if (['onStateChange', 'onDirectionChange'].includes(eventData.trigger)) {
            const conditionLabel = document.createElement('label');
            conditionLabel.innerText = '条件(Condition): ';
            const conditionInput = document.createElement('input');
            conditionInput.type = 'text';
            conditionInput.placeholder = "e.g., state === 'walk'";
            conditionInput.value = eventData.condition || '';
            conditionInput.onchange = (e) => this.updateEventData(index, 'condition', e.target.value);
            contextContainer.append(conditionLabel, conditionInput);
        }
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        div.appendChild(contextContainer);

        // --- アクション入力欄 (変更なし) ---
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'event-actions';
        const actionsLabel = document.createElement('label');
        actionsLabel.innerText = 'アクション (Actions):';
        const actionsTextarea = document.createElement('textarea');
        actionsTextarea.placeholder = '[destroy target=other][play_sound key=...]'
        actionsTextarea.value = eventData.actions || '';
        actionsTextarea.onchange = (e) => this.updateEventData(index, 'actions', e.target.value);
        
        actionsContainer.append(actionsLabel, actionsTextarea);
        div.appendChild(actionsContainer);

        return div;
    }
    
    /**
     * ★★★ 新規メソッド ★★★
     * UIからの変更をGameObjectのデータに書き込み、UIを再描画する
     * @param {number} index - events配列内でのインデックス
     * @param {string} key - 変更するプロパティ名 ('trigger', 'targetGroup'など)
     * @param {string} value - 新しい値
     */
    updateEventData(index, key, value) {
        if (!this.selectedObject) return;
        const events = this.selectedObject.getData('events') || [];
        if (events[index]) {
            events[index][key] = value;
            
            // ★ もしトリガーが変更されたら、不要なプロパティを削除してデータを綺麗に保つ
            if (key === 'trigger') {
                delete events[index].targetGroup;
                delete events[index].condition;
            }

            this.selectedObject.setData('events', events);
            this.populateEventEditor(); // ★ UIを再描画して変更を確定させる
        }
    }
    // src/plugins/EditorPlugin.js (どこか分かりやすい場所に追加)

    /**
     * ★★★ 新規追加 ★★★
     * UIバー専用のプロパティ編集UIを生成する。
     * 監視する変数を編集できるようにする。
     */
    createUIBarPropertiesUI() {
        const target = this.selectedObject;

        // --- 現在値の変数 ---
        const currentRow = document.createElement('div');
        currentRow.innerHTML = `<label>現在値の変数 (f.):</label>`;
        const currentInput = document.createElement('input');
        currentInput.type = 'text';
        currentInput.placeholder = 'e.g., player_hp';
        // ★★★ 永続化されたデータは、コンポーネント自身が持っていると仮定 ★★★
        currentInput.value = target.watchVariable || '';
        currentInput.addEventListener('input', (e) => {
            // 実行中のインスタンスと、永続化用データの両方を更新
            target.watchVariable = e.target.value;
            target.setData('watchVariable', e.target.value);
            // ★ stateManagerに接続しなおす必要があるかもしれないが、まずはデータ保存を優先
        });
        currentRow.appendChild(currentInput);
        this.editorPropsContainer.appendChild(currentRow);
        
        // --- 最大値の変数 ---
        const maxRow = document.createElement('div');
        maxRow.innerHTML = `<label>最大値の変数 (f.):</label>`;
        const maxInput = document.createElement('input');
        maxInput.type = 'text';
        maxInput.placeholder = 'e.g., player_max_hp';
        maxInput.value = target.maxVariable || '';
        maxInput.addEventListener('input', (e) => {
            target.maxVariable = e.target.value;
            target.setData('maxVariable', e.target.value);
        });
        maxRow.appendChild(maxInput);
        this.editorPropsContainer.appendChild(maxRow);
    }
// in EditorPlugin.js

// in EditorPlugin.js


/**
 * ★★★ ノードのデータ初期化問題を解決する最終版 ★★★
 * ステートマシンデータ内の特定のノードパラメータを更新する
 * @param {object} nodeData - UI側が認識している、更新対象のノードのデータ (IDの識別に使う)
 * @param {string} paramKey - 更新するパラメータのキー ('x', 'y', または 'params'内のキー)
 * @param {*} value - 新しい値
 * @param {boolean} [isPosition=false] - 位置の更新かどうか
 */
// in EditorPlugin.js

/**
 * ★★★ UI更新遅延機能付き・最終FIX版 ★★★
 * ステートマシンデータ内の特定のノードパラメータを更新する
 */
updateStateMachineNodeParam(nodeData, paramKey, value, isPosition = false) {
    if (!this.selectedObject || !nodeData?.id) return;

    const smData = this.selectedObject.getData('stateMachine');
    if (!smData) return;

    const activeStateName = this.editorUI.activeStateName;
    const activeHookName = this.editorUI.activeHookName;
    if (!activeStateName || !activeHookName) return;

    const targetVsl = smData.states[activeStateName]?.[activeHookName];
    if (!targetVsl || !targetVsl.nodes) return;
    const nodeIndex = targetVsl.nodes.findIndex(n => n.id === nodeData.id);

    if (nodeIndex > -1) {
        const nodeToUpdate = targetVsl.nodes[nodeIndex];

        if (isPosition) {
            nodeToUpdate[paramKey] = value;
        } else {
            if (!nodeToUpdate.params) nodeToUpdate.params = {};
            nodeToUpdate.params[paramKey] = value;
        }

        this.selectedObject.setData('stateMachine', smData);

        // ▼▼▼【ここが修正の核心】▼▼▼
        if (this._updateCanvasTimeout) {
            clearTimeout(this._updateCanvasTimeout);
        }

        // isPosition (スライダー操作) の場合は、少し待ってからUIを更新
        // それ以外 (テキスト入力など) の場合は、即時更新
        const delay = isPosition ? 100 : 0; 

        this._updateCanvasTimeout = setTimeout(() => {
            if (this.editorUI) {
                this.editorUI.populateVslCanvas();
            }
        }, delay);
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }
}
}