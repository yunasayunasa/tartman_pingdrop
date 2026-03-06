import EngineAPI from '../core/EngineAPI.js';
import { ComponentRegistry } from '../../src/components/index.js'; // ★ インポート
export default class EditorUI {
    constructor(game, editorPlugin) {
        this.game = game;
        this.plugin = editorPlugin;
 this.assetList = this.game.registry.get('asset_list') || [];
        const currentURL = window.location.href;
        if (!currentURL.includes('?debug=true') && !currentURL.includes('&debug=true')) return;

        // --- プロパティの初期化 ---
        this.selectedAssetKey = null;
        this.selectedAssetType = null;
        this.objectCounters = {};
        this.currentEditorMode = 'select';
        this.currentAssetTab = 'image';
        
         //ノードプロパティ
        this.activeEventId = null; // ★ 現在編集中のイベントの「ID」を保持する
        this.selectedNodeData = null;
        this.connectionState = {
            isActive: false,      // 接続モード中か？
            fromNodeId: null,     // 接続元のノードID
            previewLine: null   // プレビュー用の線（SVG要素）
        };
        this.vslMode = 'select'; // 'select' or 'pan'
        this.panState = {
            isPanning: false, // パンモード中か？
            startX: 0,
            startY: 0
        };
   //レイヤー

   this.layers = [
            { name: 'Foreground', visible: true, locked: false },
            { name: 'Gameplay', visible: true, locked: false },
            { name: 'Background', visible: true, locked: false },
        ];
 this.activeLayerName = 'Gameplay';
        // --- DOM要素の参照 ---
        this.getDomElements();

        // --- UIの初期表示設定 ---
        if (this.editorPanel) this.editorPanel.style.display = 'flex';
        if (this.assetBrowserPanel) this.assetBrowserPanel.style.display = 'flex';
        
        // --- UI要素の生成とリスナー設定 ---
        this.createPauseToggle();
        this.createHelpButton();
        this.initializeEventListeners();
        this.populateAssetBrowser();
        const refreshBtn = document.getElementById('editor-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // EditorPluginの新しいメソッドを呼び出す
            this.plugin.refresh();
        });
    }

        

    }
    
    // =================================================================
    // ヘルパーメソッド群
    // =================================================================
   /**
     * EditorPluginの準備が完了したときに呼ばれる
     */
    onPluginReady() {
        this.buildLayerPanel(); // ★ ここで初めてレイヤーパネルを構築
        // EditorPluginに初期レイヤー状態を渡す
        this.plugin.updateLayerStates(this.layers);
    }
    getDomElements() {
        this.editorPanel = document.getElementById('editor-panel');
        this.assetBrowserPanel = document.getElementById('asset-browser');
        this.assetListContainer = document.getElementById('asset-list');
        this.assetTabContainer = document.getElementById('asset-tabs');
        this.cameraControls = document.getElementById('camera-controls');
        this.zoomInBtn = document.getElementById('camera-zoom-in');
        this.zoomOutBtn = document.getElementById('camera-zoom-out');
        this.panUpBtn = document.getElementById('camera-pan-up');
        this.panDownBtn = document.getElementById('camera-pan-down');
        this.panLeftBtn = document.getElementById('camera-pan-left');
        this.panRightBtn = document.getElementById('camera-pan-right');
        this.resetBtn = document.getElementById('camera-reset');
        this.selectModeBtn = document.getElementById('select-mode-btn');
        this.tilemapModeBtn = document.getElementById('tilemap-mode-btn');
        this.modeToggle = document.getElementById('mode-toggle-checkbox');
        this.modeLabel = document.getElementById('mode-label');
        this.helpModal = document.getElementById('help-modal-overlay');
        this.helpModalContent = document.getElementById('help-modal-content');
       this.layerListContainer = document.getElementById('layer-list');
       this.eventEditorOverlay = document.getElementById('event-editor-overlay');
        this.eventEditorTitle = document.getElementById('event-editor-title');
        this.vslNodeList = document.getElementById('vsl-node-list');
        this.vslCanvas = document.getElementById('vsl-canvas');
        this.vslTabs = document.getElementById('vsl-tabs');
        this.smEditorOverlay = document.getElementById('sm-editor-overlay');
          this.tilemapEditorOverlay = document.getElementById('tilemap-editor-overlay');
    this.tilemapListContainer = document.getElementById('tilemap-list-container');
    this.selectedTilemapName = document.getElementById('selected-tilemap-name');
    this.tilemapPreviewContent = document.getElementById('tilemap-preview-content');
    }

  

    getActiveGameScene() {
        return this.plugin?.getActiveGameScene();
    }

    // =================================================================
    // イベントリスナー初期化
    // =================================================================
// in EditorUI.js

   
  // src/editor/EditorUI.js

    initializeEventListeners() {
        // --- UIボタンのリスナー ---
       document.getElementById('add-asset-button')?.addEventListener('click', this.onAddButtonClicked);
    document.getElementById('add-text-button')?.addEventListener('click', this.onAddTextClicked);
    document.getElementById('select-mode-btn')?.addEventListener('click', () => this.setEditorMode('select'));
    document.getElementById('tilemap-mode-btn')?.addEventListener('click', this.openTilemapEditor);
    document.getElementById('add-layer-btn')?.addEventListener('click', this.addNewLayer);
    document.getElementById('tilemap-editor-close-btn')?.addEventListener('click', this.closeTilemapEditor);
    document.getElementById('crop-and-place-btn')?.addEventListener('click', this.onCropAndPlace);
    document.getElementById('event-editor-close-btn')?.addEventListener('click', this.closeEventEditor);
    document.getElementById('sm-editor-close-btn')?.addEventListener('click', this.closeStateMachineEditor);
        // --- レイヤーリスト（イベント委譲） ---
        const layerListContainer = document.getElementById('layer-list');
        if (layerListContainer) {
            layerListContainer.addEventListener('click', (event) => {
                const target = event.target;
                const layerItem = target.closest('.layer-item');
                if (!layerItem) return;
                const layerName = layerItem.dataset.layerName;
                if (!layerName) return;

                if (target.classList.contains('layer-visibility-btn')) {
                    this.toggleLayerVisibility(layerName);
                } else if (target.classList.contains('layer-lock-btn')) {
                    this.toggleLayerLock(layerName);
                } else if (target.classList.contains('layer-active-indicator')) {
                    this.setActiveLayer(layerName);
                } else {
                    this.plugin.selectLayer(this.layers.find(l => l.name === layerName));
                }
            });
        } // ★★★ layerListContainerのif文は、ここで終わりです ★★★


        // ▼▼▼【ここからが、VSLノード関連のイベント処理です】▼▼▼
        // --------------------------------------------------------------------

        // --- VSLモード切替ボタン ---
        const selectBtn = document.getElementById('vsl-select-mode-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => this.setVslMode('select'));
        }
        const panBtn = document.getElementById('vsl-pan-mode-btn');
        if (panBtn) {
            panBtn.addEventListener('click', () => this.setVslMode('pan'));
        }
        
        // --- VSLキャンバス (イベント委譲の親) ---
        const canvasWrapper = document.getElementById('vsl-canvas-wrapper');
        if (canvasWrapper) {
            canvasWrapper.addEventListener('pointerdown', (event) => {
                if (this.vslMode === 'pan') {
                    // (パンモードの処理)
                    return; 
                }
                const pinElement = event.target.closest('[data-pin-type]');
                if (pinElement) {
                    event.stopPropagation();
                    this.onPinClicked(pinElement);
                    return;
                }
            });
        }
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        // --- カメラコントロール ---
        document.getElementById('camera-zoom-in')?.addEventListener('click', () => this.plugin.zoomCamera(0.2));
        document.getElementById('camera-zoom-out')?.addEventListener('click', () => this.plugin.zoomCamera(-0.2));
        document.getElementById('camera-reset')?.addEventListener('click', () => this.plugin.resetCamera());
        this.setupPanButton(document.getElementById('camera-pan-up'), 0, -10);
        this.setupPanButton(document.getElementById('camera-pan-down'), 0, 10);
        this.setupPanButton(document.getElementById('camera-pan-left'), -10, 0);
        this.setupPanButton(document.getElementById('camera-pan-right'), 10, 0);

        // --- プレイモード切替 ---
        const modeToggle = document.getElementById('mode-toggle-checkbox');
        if (modeToggle) {
            modeToggle.addEventListener('change', (event) => {
                // ▼▼▼【ここを、新しいメソッドを呼び出すように変更】▼▼▼
                const newMode = event.target.checked ? 'play' : 'select';
                this.setGlobalEditorMode(newMode);
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
            });
        }
        
        // --- ヘルプモーダル ---
        document.getElementById('help-modal-close-btn')?.addEventListener('click', () => this.closeHelpModal());
        this.createHelpButton();
        
        this.createPauseToggle();
    }
    /*
    **
    **タイルマップ用メソッド群
    **
    **/
    // in EditorUI.js (クラス内のどこかに追加)

// --- ▼▼▼ タイルマップエディタ関連の新しいメソッド群 ▼▼▼ ---

openTilemapEditor = () => {
    if (!this.tilemapEditorOverlay) return;

    this.game.input.enabled = false;
    this.buildTilemapList();
    this.selectTilemap(null); // 初期状態では何も選択されていない
    this.tilemapEditorOverlay.style.display = 'flex';
}

closeTilemapEditor = () => {
    if (!this.tilemapEditorOverlay) return;
    
    this.tilemapEditorOverlay.style.display = 'none';
    this.game.input.enabled = true;
}

buildTilemapList() {
    if (!this.tilemapListContainer) return;
    this.tilemapListContainer.innerHTML = '';

    const assetList = this.game.registry.get('asset_list');
    const tilemapAssets = assetList.filter(asset => asset.type === 'tilemap');

    if (tilemapAssets.length === 0) {
        this.tilemapListContainer.innerText = 'No tilemaps found.';
        return;
    }

    tilemapAssets.forEach(asset => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tilemap-list-item';
        itemDiv.innerText = asset.key;
        itemDiv.dataset.tilemapKey = asset.key;
        
        itemDiv.addEventListener('click', () => {
            // 他のアイテムのアクティブ状態を解除
            this.tilemapListContainer.querySelectorAll('.tilemap-list-item.active').forEach(el => el.classList.remove('active'));
            // クリックされたアイテムをアクティブに
            itemDiv.classList.add('active');
            // プレビュー表示メソッドを呼び出し
            this.selectTilemap(asset.key);
        });
        
        this.tilemapListContainer.appendChild(itemDiv);
    });
}
    // in EditorUI.js (続き)

// in EditorUI.js

selectTilemap(tilemapKey) {
    if (!this.tilemapPreviewContent || !this.selectedTilemapName) return;

    this.selectedTilemapKey = tilemapKey;

    // --- プレビューエリアを一度クリア ---
    this.tilemapPreviewContent.innerHTML = '';

    if (!tilemapKey) {
        this.selectedTilemapName.innerText = 'No tilemap selected';
        return;
    }

    this.selectedTilemapName.innerText = `Selected: ${tilemapKey}`;

    // ★★★ ここからが修正の核心 ★★★
    // 1. グローバルアセットリストから、選択されたタイルマップの情報を探す
    const assetList = this.game.registry.get('asset_list');
    const assetInfo = assetList.find(asset => asset.key === tilemapKey && asset.type === 'tilemap');

    if (!assetInfo || !assetInfo.path) {
        this.tilemapPreviewContent.innerHTML = `Error: Asset path not found for '${tilemapKey}'.`;
        return;
    }

    // 2. Phaserの内部参照ではなく、アセットのパス(URL)を使って新しい<img>要素を作成する
    const newImgElement = document.createElement('img');
    newImgElement.src = assetInfo.path;
    newImgElement.style.display = 'block'; // 画像の下に余分なスペースができるのを防ぐ
    newImgElement.style.maxWidth = 'none'; // コンテナの幅に縮小されないように
// ★★★ ドラッグを無効化する属性を追加 ★★★
newImgElement.draggable = false;

    // 3. 新しく作成した<img>要素をDOMに追加
    this.tilemapPreviewContent.appendChild(newImgElement);
    
    // 4. 矩形選択機能を初期化
    this.initCropSelection();
}

// in EditorUI.js
// 既存の initCropSelection を、この内容で「完全に」置き換えてください

// in EditorUI.js
// 既存の initCropSelection を、この内容で「完全に」置き換えてください

initCropSelection() {
    this.cropRect = { x: 0, y: 0, width: 0, height: 0 };
    let isDragging = false;
    let startX = 0;
    let startY = 0;
const previewWrapper = this.tilemapPreviewContent.parentElement; // スクロールを持つ親要素
    const selectionBox = document.createElement('div');
    selectionBox.style.position = 'absolute';
    selectionBox.style.border = '2px dashed #00ffff';
    selectionBox.style.pointerEvents = 'none';
    this.tilemapPreviewContent.appendChild(selectionBox);

    // ★★★ スケール補正のための計算 ★★★
    const scaleManager = this.game.scale;
    // ゲームの基本サイズと、現在のキャンバスの実際の表示サイズから、倍率を計算
    const scaleX = scaleManager.baseSize.width / scaleManager.width;
    const scaleY = scaleManager.baseSize.height / scaleManager.height;

    const getScaledCoordinates = (event) => {
        // offsetX/Yに、計算した倍率を掛ける
        const x = event.offsetX * scaleX;
        const y = event.offsetY * scaleY;
        return { x, y };
    };

    this.tilemapPreviewContent.onpointerdown = (e) => {
        isDragging = true;
        previewWrapper.style.overflow = 'hidden'; // ★ ドラッグ開始時にスクロールを無効化
        const coords = getScaledCoordinates(e);
        startX = coords.x;
        startY = coords.y;
        
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        e.preventDefault();
    };

    this.tilemapPreviewContent.onpointermove = (e) => {
        if (!isDragging) return;
        const coords = getScaledCoordinates(e);
        const currentX = coords.x;
        const currentY = coords.y;

        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(startX - currentX);
        const height = Math.abs(startY - currentY);

        selectionBox.style.left = x + 'px';
        selectionBox.style.top = y + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        
        // 選択範囲をリアルタイムで保存
        this.cropRect = { x, y, width, height };
    };

    const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        previewWrapper.style.overflow = 'auto'; // ★ ドラッグ終了時にスクロールを有効化
        // 最終的な値は onpointermove ですでに保存されている
    };

    this.tilemapPreviewContent.onpointerup = stopDrag;
    this.tilemapPreviewContent.onpointerleave = stopDrag;
}
onCropAndPlace = () => {
    if (!this.selectedTilemapKey) {
        alert('Please select a tilemap first.');
        return;
    }
    // ★★★ サイズが小さすぎる場合は警告を出すように変更 ★★★
    if (!this.cropRect || this.cropRect.width < 1 || this.cropRect.height < 1) {
        alert('Please drag a rectangle on the tilemap to select an area.');
        return;
    }

    // console.log(`Cropping '${this.selectedTilemapKey}' at`, this.cropRect);

    // EditorPluginに処理を依頼
    this.plugin.placeCroppedTilemap(this.selectedTilemapKey, this.cropRect);
    
    // 処理が終わったらモーダルを閉じる
    this.closeTilemapEditor();
}

/**タイルマップメソッド群ここまで
**
****************/
    
    
     /**
     * ★★★ 新規メソッド ★★★
     * エディタ全体のグローバルなモードを設定し、UIとプラグインの状態を同期させる
     * @param {'select' | 'play'} mode
     */
   setGlobalEditorMode(mode) {
    if (this.plugin.currentMode === mode) return;

    // --- 1. プラグインの状態を更新 ---
    this.plugin.currentMode = mode;
    this.game.registry.set('editor_mode', mode);
    
    // --- ▼▼▼ ここからが修正の核心 ▼▼▼ ---
    
    // 2. プレイモードに応じて、全オブジェクトのドラッグ状態を切り替える
    if (mode === 'play') {
        // プレイモードに入ったら、全てのドラッグを無効化する
        this.plugin.setAllObjectsDraggable(false);
    } else { // 'select' mode
        // セレクトモードに戻ったら、全てのドラッグを有効化する
        this.plugin.setAllObjectsDraggable(true);
    }
        const modeToggle = document.getElementById('mode-toggle-checkbox');
        const modeLabel = document.getElementById('mode-label');
        if (modeToggle) {
            modeToggle.checked = (mode === 'play');
        }
        if (modeLabel) {
            modeLabel.textContent = (mode === 'play') ? 'Play Mode' : 'Select Mode';
        }
        
        // console.log(`[EditorUI] Global mode changed to: ${mode}`);
    }
    // =================================================================
    // UI構築・更新メソッド群
    // =================================================================
      /**
     * ★★★ これが不足していたメソッドです ★★★
     * SystemSceneから呼び出され、UIとプラグインの初期連携を開始する
     */
    start() {
        // この時点では、this.plugin が確実に存在し、
        // plugin側もthis.editorUIを認識していることが保証されています。
        
        // 1. プラグインに、EditorUIが持つ初期レイヤー状態を通知します
        this.plugin.updateLayerStates(this.layers);
        
        // 2. プラグインの状態が整ったので、初めてレイヤーパネルを構築します
        this.buildLayerPanel();
    }
    setEditorMode(mode) {
        if (this.currentEditorMode === mode) return;
        this.currentEditorMode = mode;
        
        if (mode === 'tilemap') {
            document.body.classList.add('tilemap-mode');
            this.tilemapModeBtn.classList.add('active');
            this.selectModeBtn.classList.remove('active');
            this.initTilesetPanel();
            this.createTileMarker();
        } else { // 'select' mode
            document.body.classList.remove('tilemap-mode');
            this.selectModeBtn.classList.add('active');
            this.tilemapModeBtn.classList.remove('active');
            this.destroyTileMarker();
        }
    }
/**
     * ★★★ 復活させるメソッド ★★★
     * EditorPluginからの合図で、Phaserのグローバル入力イベントのリッスンを開始する。
     * これが最も安定した方法。
     */
    startListeningToGameInput() {
        if (!this.game || !this.game.input) {
            console.error("[EditorUI] Cannot start listening: Game or input system not available.");
            return;
        }
        
        // --- 既存のリスナーを一度クリア ---
        this.game.input.off('pointermove', this.onPointerMove, this);
        this.game.input.off('pointerdown', this.onPointerDown, this);

        // --- 新しいリスナーを登録 ---
        // console.log("[EditorUI] Attaching Phaser global input listeners.");
        this.game.input.on('pointermove', this.onPointerMove, this);
        this.game.input.on('pointerdown', this.onPointerDown, this);
    }
 // ▼▼▼ この新しいメソッドをクラス内に追加 ▼▼▼
  
 
 
 
    /**
     * ★★★ 新規メソッド ★★★
     * Phaserのポインターイベントを捌くための統合ハンドラ
     * @param {Phaser.Input.Pointer} pointer 
     */
    onPointerMove(pointer) {
        if (this.currentEditorMode !== 'tilemap' || !this.tileMarker) return;
        
        const scene = this.getActiveGameScene();
        if (!scene) return;
        
        // ★ pointer.worldX は、カメラの位置とズームを考慮した最終的なワールド座標
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;

        const tileWidth = this.currentTileset.tileWidth;
        const tileHeight = this.currentTileset.tileHeight;

        const snappedX = Math.floor(worldX / tileWidth) * tileWidth + tileWidth / 2;
        const snappedY = Math.floor(worldY / tileHeight) * tileHeight + tileHeight / 2;
        
        this.tileMarker.setPosition(snappedX, snappedY);
    }
    
    /**
     * ★★★ 新規メソッド ★★★
     * Phaserのポインターイベントを捌くための統合ハンドラ
     * @param {Phaser.Input.Pointer} pointer 
     */
    onPointerDown(pointer) {
        // UI上でのクリックなら、Phaser側で処理させない
        if (pointer.event.target.closest('#editor-sidebar') || 
            pointer.event.target.closest('#overlay-controls') || 
            pointer.event.target.closest('#bottom-panel')) {
            return;
        }

        if (this.currentEditorMode !== 'tilemap') {
            return;
        }
        
        const scene = this.getActiveGameScene();
        if (!scene || !this.currentTileset) return;

        const worldX = pointer.worldX;
        const worldY = pointer.worldY;

        const tileWidth = this.currentTileset.tileWidth;
        const tileHeight = this.currentTileset.tileHeight;

        const tileX = Math.floor(worldX / tileWidth);
        const tileY = Math.floor(worldY / tileHeight);
        
        // console.log(`[EditorUI | Phaser Event] Placing tile index ${this.selectedTileIndex} at grid (${tileX}, ${tileY})`);

        if (typeof scene.placeTile === 'function') {
            scene.placeTile(tileX, tileY, this.selectedTileIndex, this.currentTileset.key, true); // 物理ボディ付きで配置
        }
        setTimeout(() => {
            // オブジェクトのpointerdownが先に処理されるのを待つ
            if (!this.plugin.selectedObject && (!this.plugin.selectedObjects || this.plugin.selectedObjects.length === 0)) {
                this.plugin.deselectAll();
            }
        }, 0);
    
    }

  

    /**
     * ★★★ 最終FIX版 ★★★
     * 範囲描画のドラッグ操作を開始する。
     * ブラウザのデフォルトのドラッグ動作を完全に抑制する。
     */
    startRangeFillDrag(sourceObject) {
        this.rangeFillSourceObject = sourceObject;
        // console.log(`[EditorUI | Final Fix] Range fill drag started.`);
        
        this.game.canvas.style.cursor = 'crosshair';

        // ▼▼▼【ここからが修正箇所】▼▼▼
        // --------------------------------------------------------------------

        // --- ドラッグ中のデフォルト動作をキャンセルするリスナー ---
        const onDragMove = (event) => {
            // マウスが動いている間、常にデフォルト動作（画像ドラッグ、テキスト選択など）を抑制する
            event.preventDefault();
        };

        // --- マウスボタンが離された時の処理 ---
        const onMouseUp = (event) => {
            // console.log(`[EditorUI | Final Fix] Mouse up detected. Executing fill.`);
            
            // --- 処理の実行 ---
            const scene = this.getActiveGameScene();
            if (scene && typeof scene.fillObjectRange === 'function') {
                const canvasRect = this.game.canvas.getBoundingClientRect();
                const canvasX = event.clientX - canvasRect.left;
                const canvasY = event.clientY - canvasRect.top;
                const worldPoint = scene.cameras.main.getWorldPoint(canvasX, canvasY);
                scene.fillObjectRange(this.rangeFillSourceObject, { x: worldPoint.x, y: worldPoint.y });
            }
            
            // --- 後片付け ---
            this.game.canvas.style.cursor = 'default';
            this.rangeFillSourceObject = null;
            
            // ★重要：登録したリスナーは、必ず両方とも解除する
            window.removeEventListener('pointermove', onDragMove, true);
            window.removeEventListener('pointerup', onMouseUp, true);
        };

        // --- リスナーを登録 ---
        // ★ capture: true を指定することで、他の要素にイベントが奪われる前に処理する
        window.addEventListener('pointermove', onDragMove, true);
        window.addEventListener('pointerup', onMouseUp, true);

        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }

    // startRangeFillMode, endRangeFillMode は不要になるので削除してOKです。

  
    

    populateAssetBrowser() {
        const assetList = this.game.registry.get('asset_list');
        if (!assetList || !this.assetListContainer || !this.assetTabContainer) return;

        const assetTypes = [...new Set(assetList.map(asset => (asset.type === 'spritesheet' ? 'image' : asset.type)))];
        if (!assetTypes.includes('image')) assetTypes.unshift('image');
        if (!assetTypes.includes('ui')) assetTypes.push('ui');

        this.assetTabContainer.innerHTML = '';
        assetTypes.forEach(type => {
            if (!type) return;
            const tabButton = document.createElement('div');
            tabButton.className = 'asset-tab';
            tabButton.innerText = type.charAt(0).toUpperCase() + type.slice(1) + 's';
            if (type === this.currentAssetTab) tabButton.classList.add('active');
            tabButton.addEventListener('click', () => {
                this.currentAssetTab = type;
                this.selectedAssetKey = null;
                this.selectedAssetType = null;
                this.populateAssetBrowser();
            });
            this.assetTabContainer.appendChild(tabButton);
        });

         // --- リストの中身を生成 ---
        this.assetListContainer.innerHTML = '';

        if (this.currentAssetTab === 'ui') {
            // ================================================================
            // --- ケース1：UIタブが選択されている場合 ---
            // ================================================================
            // ★ ゲームのuiRegistryから、最新の定義を直接取得する
            const uiRegistry = this.game.registry.get('uiRegistry');
            
            // ★ uiRegistryの全キーをループして、UIカタログを生成する
            for (const key in uiRegistry) {
                const definition = uiRegistry[key];
                const itemDiv = document.createElement('div');
                itemDiv.className = 'asset-item';
                itemDiv.dataset.registryKey = key; // ★ 'menu_button', 'generic_button'などを保存

                itemDiv.addEventListener('click', (e) => {
                    this.assetListContainer.querySelectorAll('.asset-item.selected').forEach(el => el.classList.remove('selected'));
                    itemDiv.classList.add('selected');
                    this.selectedAssetKey = itemDiv.dataset.registryKey;
                    this.selectedAssetType = 'ui';
                });

                // アイコン表示（簡易版）
                const iconSpan = document.createElement('span');
                iconSpan.className = 'asset-preview';
                iconSpan.innerText = '🧩';
                
                const nameSpan = document.createElement('span');
                // ★ 表示名も、registryKeyをそのまま使うのがシンプル
                nameSpan.innerText = key;

                itemDiv.append(iconSpan, nameSpan);
                this.assetListContainer.appendChild(itemDiv);
            }

            // b) 「ジョイスティック」追加ボタンを特別に生成する
        const joystickItemDiv = document.createElement('div');
        joystickItemDiv.className = 'asset-item';
        joystickItemDiv.dataset.assetKey = 'joystick';
        joystickItemDiv.innerHTML = `<span class="asset-preview">🕹️</span><span>ジョイスティック</span>`;
        joystickItemDiv.addEventListener('click', () => {
            this.assetListContainer.querySelectorAll('.asset-item.selected').forEach(el => el.classList.remove('selected'));
            joystickItemDiv.classList.add('selected');
            this.selectedAssetKey = 'joystick';
            this.selectedAssetType = 'ui_special'; // ★ 通常のUIと区別するための特別なタイプ
        });
        this.assetListContainer.appendChild(joystickItemDiv);

            // ★ テキスト追加ボタンは専用の処理があるので、別途生成する
            const textItemDiv = document.createElement('div');
            textItemDiv.className = 'asset-item';
            textItemDiv.dataset.registryKey = 'Text'; // 特別なキー
            textItemDiv.innerHTML = `<span class="asset-preview" style="font-size: 24px; display: flex; align-items: center; justify-content: center;">T</span><span>テキスト</span>`;
            textItemDiv.addEventListener('click', () => {
                this.assetListContainer.querySelectorAll('.asset-item.selected').forEach(el => el.classList.remove('selected'));
                textItemDiv.classList.add('selected');
                this.selectedAssetKey = 'Text';
                this.selectedAssetType = 'ui';
            });
            this.assetListContainer.appendChild(textItemDiv);
        } else {
            // ================================================================
            // --- ケース2：それ以外のタブ（画像やプレハブ）の場合 ---
            // ================================================================
            document.getElementById('add-asset-button').innerText = '選択したアセットを追加'; // 日本語化
        const displayableAssets = assetList.filter(asset => {
            if (this.currentAssetTab === 'image') {
                return asset.type === 'image' || asset.type === 'spritesheet';
            }
            if (this.currentAssetTab === 'prefab') {
                // ★ typeが'prefab'または'GroupPrefab'のものを表示
                return asset.type === 'prefab' || asset.type === 'GroupPrefab'; 
            }
            return asset.type === this.currentAssetTab;
        });

        for (const asset of displayableAssets) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'asset-item';
            itemDiv.dataset.assetKey = asset.key;
            itemDiv.addEventListener('click', () => {
                this.assetListContainer.querySelectorAll('.asset-item.selected').forEach(el => el.classList.remove('selected'));
                itemDiv.classList.add('selected');
                this.selectedAssetKey = asset.key;
                this.selectedAssetType = asset.type;
            });
            
            if (asset.path) {
                const previewImg = document.createElement('img');
                previewImg.className = 'asset-preview';
                previewImg.src = asset.path;
                itemDiv.appendChild(previewImg);
            } else {
                const iconSpan = document.createElement('span');
                iconSpan.innerText = '📦';
                iconSpan.className = 'asset-preview';
                iconSpan.style.display = 'flex';
                iconSpan.style.justifyContent = 'center';
                iconSpan.style.alignItems = 'center';
                iconSpan.style.fontSize = '32px';
                itemDiv.appendChild(iconSpan);
            }
            
            const keySpan = document.createElement('span');
            keySpan.innerText = asset.key;
            itemDiv.appendChild(keySpan);
            
            if (asset.type === 'spritesheet') {
                const badge = document.createElement('span');
                badge.innerText = 'Sheet';
                badge.style.marginLeft = 'auto';
                badge.style.backgroundColor = '#3a86ff';
                badge.style.color = 'white';
                badge.style.fontSize = '10px';
                badge.style.padding = '2px 4px';
                badge.style.borderRadius = '3px';
                itemDiv.appendChild(badge);
            }
            if (asset.type === 'GroupPrefab') {
                const badge = document.createElement('span');
                badge.innerText = 'Group';
                // (バッジのスタイル設定)
                itemDiv.appendChild(badge);
            }

            this.assetListContainer.appendChild(itemDiv);
        }
    }}

   // in EditorUI.js
// src/editor/EditorUI.js

   // in src/editor/EditorUI.js

/**
 * ★★★ UIレジストリのカスタム関数(addFromEditor)に対応した最終FIX版 ★★★
 */
// in src/editor/EditorUI.js

/**
 * ★★★ ジョイスティックを「特殊なゲーム要素」として扱う最終FIX版 ★★★
 */
onAddButtonClicked = () => {
    if (!this.selectedAssetKey) {
        alert('アセットを選択してください。');
        return;
    }
    
    // ▼▼▼【ここが修正の核心です】▼▼▼
    // --------------------------------------------------------------------
    // --- 1. ジョイスティックが選択された場合の、特別な早期リターン処理 ---
    if (this.selectedAssetKey === 'joystick' && this.selectedAssetType === 'ui_special') {
        const gameScene = this.getActiveGameScene();
        if (gameScene && typeof gameScene.addJoystickFromEditor === 'function') {
            gameScene.addJoystickFromEditor();
            // ジョイスティックは特殊なコントロールなので、追加後に選択状態にはしない
        } else {
            alert("ジョイスティックを追加できるアクティブなゲームシーンが見つかりません。");
        }
        return; // ★ ジョイスティックの処理は、ここで完全に終了させる
    }
    // --------------------------------------------------------------------
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // --- 2. これまで通りの、通常のオブジェクト追加処理 ---
    let newObjectOrObjects = null;
    const newName = `${this.selectedAssetKey.toLowerCase()}_${Date.now()}`;

    if (this.selectedAssetType === 'ui') {
        // UIアセットはUISceneに追加する
        const uiScene = this.game.scene.getScene('UIScene');
        if (uiScene && typeof uiScene.addUiComponentFromEditor === 'function') {
            newObjectOrObjects = uiScene.addUiComponentFromEditor(this.selectedAssetKey, newName);
        } else {
            alert("UISceneまたはそのaddUiComponentFromEditorメソッドが見つかりません。");
        }

    } else {
        // ゲームオブジェクトアセットはゲームシーンに追加する
        const gameScene = this.getActiveGameScene();
        if (!gameScene) {
            alert("アセットを追加するためのアクティブなゲームシーンが見つかりません。");
            return;
        }

        if ((this.selectedAssetType === 'image' || this.selectedAssetType === 'spritesheet') && typeof gameScene.addObjectFromEditor === 'function') {
            newObjectOrObjects = gameScene.addObjectFromEditor(this.selectedAssetKey, newName, this.activeLayerName);
        } 
        else if ((this.selectedAssetType === 'prefab' || this.selectedAssetType === 'GroupPrefab') && typeof gameScene.addPrefabFromEditor === 'function') {
            newObjectOrObjects = gameScene.addPrefabFromEditor(this.selectedAssetKey, newName, this.activeLayerName);
        }
    }

    // --- 3. オブジェクト選択処理 (変更なし) ---
    if (newObjectOrObjects && this.plugin && (newObjectOrObjects instanceof Phaser.GameObjects.GameObject)) {
        if (newObjectOrObjects instanceof Phaser.GameObjects.GameObject) {
            if (Array.isArray(newObjectOrObjects)) {
                this.plugin.selectMultipleObjects(newObjectOrObjects);
            } else {
                this.plugin.selectSingleObject(newObjectOrObjects);
            }
        }
    }
}

    
  
       /**
     * ★★★ 新規メソッド：ゲーム内時間の「ポーズ/再開」を制御するボタンを生成する ★★★
     */
    createPauseToggle() {
        // モード切替スイッチが置かれているコンテナを取得
        const modeControls = document.getElementById('editor-mode-controls');
        if (modeControls) {
            const pauseButton = document.createElement('button');
            pauseButton.id = 'editor-pause-btn';
            pauseButton.innerText = '⏸️ Pause'; // 初期状態は「一時停止」
            
            // --- ボタンのスタイルを定義 ---
            pauseButton.style.marginLeft = '20px';
            pauseButton.style.padding = '5px 10px';
            pauseButton.style.border = '1px solid #777';
            pauseButton.style.backgroundColor = '#555';
            pauseButton.style.color = '#eee';
            pauseButton.style.borderRadius = '5px';
            pauseButton.style.cursor = 'pointer';
            pauseButton.style.fontSize = '14px';

            // --- ボタンがクリックされた時の処理を定義 ---
           pauseButton.addEventListener('click', () => {
            // ★★★ ここからが修正箇所 ★★★
            
            // 1. TimeManagerの状態を直接確認する
            //    EngineAPIにゲッターを追加するのが理想だが、今回は直接参照する
            const timeManager = EngineAPI.timeManager; 
            if (!timeManager) return;
            
            const isCurrentlyStopped = timeManager.isTimeStopped;

            // 2. 現在の状態に応じて、逆の命令をEngineAPIに発行する
            if (isCurrentlyStopped) {
                EngineAPI.resumeTime();
            } else {
                EngineAPI.stopTime();
            }

            // 3. ボタンの見た目を更新する (新しい状態を再度確認)
            if (!isCurrentlyStopped) { // これから停止する場合
                pauseButton.innerText = '▶️ Play';
                pauseButton.style.backgroundColor = '#2a9d8f';
            } else { // これから再開する場合
                pauseButton.innerText = '⏸️ Pause';
                pauseButton.style.backgroundColor = '#555';
            }
        });

        modeControls.appendChild(pauseButton);
    }
}


     /**
     * ★★★ 新規ヘルパーメソッド ★★★
     * パンボタンを押し続けている間、カメラを移動させるための設定を行う
     * @param {HTMLElement} button - 対象のボタン要素
     * @param {number} dx - X方向の移動量
     * @param {number} dy - Y方向の移動量
     */
    setupPanButton(button, dx, dy) {
        if (!button) return;

        let intervalId = null;

        const startPanning = () => {
            // 既に動いていたら何もしない
            if (intervalId) return;
            // まず一度動かす
            this.plugin.panCamera(dx, dy);
            // その後、定期的に動かす
            intervalId = setInterval(() => {
                this.plugin.panCamera(dx, dy);
            }, 50); // 50ミリ秒ごと (秒間20回)
        };

        const stopPanning = () => {
            clearInterval(intervalId);
            intervalId = null;
        };
        
        // PC向け: マウスが押されたら開始、離れたら停止
        button.addEventListener('mousedown', startPanning);
        button.addEventListener('mouseup', stopPanning);
        // ボタンエリアからマウスが外れた場合も停止
        button.addEventListener('mouseleave', stopPanning);

        // モバイル向け: タッチされたら開始、離れたら停止
        button.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 画面全体のスクロールを防ぐ
            startPanning();
        });
        button.addEventListener('touchend', stopPanning);
        button.addEventListener('touchcancel', stopPanning);
    }
     // ★★★ 新規メソッド：ヘルプボタンを生成する ★★★
    
    /**
     * ヘルプボタンを生成する (移設・最終版)
     * ★★★ 以下のメソッドで、既存のものを完全に置き換えてください ★★★
     */
    // in src/editor/EditorUI.js

     createHelpButton() {
        const buttonContainer = document.querySelector('#asset-browser .panel-header-buttons');
        if (buttonContainer) {
            const helpButton = document.createElement('button');
            helpButton.innerText = '?';
            helpButton.title = 'Open Help Manual';
            helpButton.addEventListener('click', () => this.openHelpModal());
            buttonContainer.appendChild(helpButton);
        }
    }
    // ★★★ 新規メソッド：ヘルプモーダルを開く ★★★
    async openHelpModal() {
        if (!this.helpModal || !this.helpModalContent) return;
 this.game.input.enabled = false;
            // console.log("[EditorUI] Phaser input disabled for Help Modal.");
        // モーダルを表示
        this.helpModal.style.display = 'flex';
        // Phaserの入力を無効化
     

        try {
            // manual.htmlの内容をフェッチ
            const response = await fetch('manual.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            // 取得したHTMLをコンテンツエリアに挿入
            this.helpModalContent.innerHTML = htmlContent;
        } catch (error) {
            this.helpModalContent.innerHTML = `<p style="color: red;">Error loading help content: ${error.message}</p>`;
            console.error('Failed to fetch help manual:', error);
        }
    }

    // ★★★ 新規メソッド：ヘルプモーダルを閉じる ★★★
    closeHelpModal() {
        if (!this.helpModal) return;
         this.game.input.enabled = true;
            // console.log("[EditorUI] Phaser input re-enabled.");
        this.helpModal.style.display = 'none';
      
    }

     
    /**
     * ★★★ レイヤーメソッド群 ★★★
     */
    
    // --- レイヤーパネルの構築と更新 ---
    
     /**
     * ★★★ イベント委譲版 ★★★
     * レイヤーパネルの構築と更新。
     * 各ボタンに識別のためのデータ属性やクラス名を設定する。
     */
    buildLayerPanel() {
        const layerListContainer = document.getElementById('layer-list');
        if (!layerListContainer) return;
        layerListContainer.innerHTML = '';

        this.layers.forEach(layer => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'layer-item';
            itemDiv.dataset.layerName = layer.name; // ★ 識別のためのデータ属性

            if (this.plugin.selectedLayer && layer.name === this.plugin.selectedLayer.name) {
                itemDiv.classList.add('active');
            }

            // --- アクティブ化インジケータ ---
            const activeIndicator = document.createElement('div');
            activeIndicator.className = 'layer-active-indicator'; // ★ 識別のためのクラス名
            // (スタイル設定はCSSで行うのが望ましい)
            if(layer.name === this.activeLayerName) {
                activeIndicator.classList.add('active');
            }
            
            // --- 表示/非表示ボタン ---
            const visibilityBtn = document.createElement('button');
            visibilityBtn.className = 'layer-control layer-visibility-btn'; // ★ 識別のためのクラス名
            visibilityBtn.innerHTML = layer.visible ? '👁️' : '—';
            
            // --- ロック/アンロックボタン ---
            const lockBtn = document.createElement('button');
            lockBtn.className = 'layer-control layer-lock-btn'; // ★ 識別のためのクラス名
            lockBtn.innerHTML = layer.locked ? '🔒' : '🔓';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'layer-name';
            nameSpan.innerText = layer.name;

            itemDiv.append(activeIndicator, visibilityBtn, lockBtn, nameSpan);
            layerListContainer.appendChild(itemDiv);
            
            // ★★★ ここでのイベントリスナー登録はすべて不要になる ★★★
        });
    }


    setActiveLayer(layerName) {
        const layer = this.layers.find(l => l.name === layerName);
        if (layer && layer.locked) return; // ロック中はアクティブ化不可
        
        this.activeLayerName = layerName;
        // console.log(`Active layer set to: ${this.activeLayerName}`);
        this.buildLayerPanel();
    }

    toggleLayerVisibility(layerName) {
        const layer = this.layers.find(l => l.name === layerName);
        if (layer) {
            layer.visible = !layer.visible;
            this.buildLayerPanel();
            this.plugin.updateLayerStates(this.layers);
            this.plugin.applyLayerStatesToScene();
        }
    }

    toggleLayerLock(layerName) {
        const layer = this.layers.find(l => l.name === layerName);
        if (layer) {
            layer.locked = !layer.locked;
            if (layer.locked && this.activeLayerName === layerName) {
                // ロックしたレイヤーがアクティブだったら、別のアクティブ可能なレイヤーを探す
                const fallbackLayer = this.layers.find(l => !l.locked);
                this.activeLayerName = fallbackLayer ? fallbackLayer.name : null;
            }
            this.buildLayerPanel();
            this.plugin.updateLayerStates(this.layers);
        }
    }
    
   addNewLayer = () => {
        const newLayerName = prompt("Enter new layer name:", `Layer ${this.layers.length + 1}`);
        if (newLayerName && !this.layers.some(l => l.name === newLayerName)) {
            this.layers.unshift({ name: newLayerName, visible: true, locked: false });
            this.buildLayerPanel();
            this.plugin.updateLayerStates(this.layers);
        }
    }
    // in EditorUI.js
    deleteLayer(layerName) {
        const layer = this.layers.find(l => l.name === layerName);
        // デフォルトのレイヤーなど、消せないレイヤーの条件（今はなし）
        if (!layer) return;

        if (confirm(`本当にレイヤー '${layerName}' を削除しますか？\nこのレイヤー上のすべてのオブジェクトも削除されます！`)) {
             // 1. シーンから該当レイヤーのオブジェクトをすべて削除
        const scene = this.getActiveGameScene();
        if (scene) {
            // ★ editableObjects は Map<string, Set> なので、まずSetを取得
            const sceneObjects = this.plugin.editableObjects.get(scene.scene.key);
            if (sceneObjects) {
                // ★ SetをArrayに変換してからループ
                const objectsToDelete = Array.from(sceneObjects).filter(obj => obj.getData('layer') === layerName);
                
                objectsToDelete.forEach(obj => {
                    sceneObjects.delete(obj); // Setからも削除
                    obj.destroy();
                });
            }
        }

            // 2. this.layers 配列から削除
            this.layers = this.layers.filter(l => l.name !== layerName);
            
            // 3. 選択状態を解除
            this.plugin.deselectAll(); // これが updatePropertyPanel と buildLayerPanel を呼ぶ
        }
    }
     /**
     * ★★★ 新規メソッド ★★★
     * シーンのJSONデータから読み込んだレイヤー構成で、UIの状態を上書きする
     * @param {Array<object>} layersData - 保存されていたレイヤー情報の配列
     */
    setLayers(layersData) {
        if (!layersData || layersData.length === 0) {
            // もしJSONにlayersがなければ、デフォルトのレイヤー構成を使う
            this.layers = [
                { name: 'Gameplay', visible: true, locked: false },
                // ... 他のデフォルトレイヤー
            ];
        } else {
            // JSONのデータで上書き
            this.layers = layersData;
        }

        // アクティブレイヤーがもし存在しない名前になっていたら、安全なものにフォールバック
        const activeLayerExists = this.layers.some(l => l.name === this.activeLayerName);
        if (!activeLayerExists) {
            const firstUnlockedLayer = this.layers.find(l => !l.locked);
            this.activeLayerName = firstUnlockedLayer ? firstUnlockedLayer.name : (this.layers[0] ? this.layers[0].name : null);
        }
        
        // 最新の状態をプラグインに通知
        this.plugin.updateLayerStates(this.layers);
        
        // UIを再描画
        this.buildLayerPanel();
    }
//レイヤー系ここまで
  /**
     * ★★★ 新規メソッド ★★★
     * イベントエディタを開き、その中身を構築する
     * @param {Phaser.GameObjects.GameObject} selectedObject
     */
        /**
     * ★★★ 再描画問題 - 最終FIX版 ★★★
     * イベントエディタを開き、その中身を「選択されたオブジェクトのデータで」構築する
     * @param {Phaser.GameObjects.GameObject} selectedObject - 編集対象のオブジェクト
     */
   openEventEditor(selectedObject) {
        if (!this.eventEditorOverlay || !selectedObject) return;
        this.game.input.enabled = false;
        
        this.editingObject = selectedObject;
        
        if (this.eventEditorTitle) {
            this.eventEditorTitle.innerText = `イベント編集: ${this.editingObject.name}`;
        }
        
        // ★★★ タブUIを構築する新しいメソッドを呼び出す ★★★
        this.buildVslTabs();
        
        // ★★★ 最初に表示するイベントを決定する ★★★
        const events = this.editingObject.getData('events') || [];
        if (events.length > 0) {
            // 最初のイベントをアクティブにする
            this.setActiveVslEvent(events[0].id);
        } else {
            // イベントがなければ、すべてを空にする
            this.setActiveVslEvent(null);
        }

        this.eventEditorOverlay.style.display = 'flex';
    }

 // in src/editor/EditorUI.js

    /**
     * ★★★ コピー/ペースト機能付き - 完成版 ★★★
     * イベントグラフを切り替えるためのタブUIを構築する
     */
    buildVslTabs() {
        if (!this.vslTabs) return;
        this.vslTabs.innerHTML = '';
        
        const events = this.editingObject.getData('events') || [];
        events.forEach(eventData => {
            const tabButton = document.createElement('button');
            tabButton.className = 'vsl-tab-button';
            tabButton.innerText = eventData.trigger || 'Event';
            
            if (this.activeEventId === eventData.id) {
                tabButton.classList.add('active');
            }

            tabButton.addEventListener('click', () => this.setActiveVslEvent(eventData.id));
            this.vslTabs.appendChild(tabButton);
        });

        // --- 「イベントを追加」ボタン ---
        const addButton = document.createElement('button');
        addButton.className = 'vsl-add-event-button';
        addButton.innerText = '+';
        addButton.title = '新しいイベントを追加';
        addButton.addEventListener('click', () => {
            // ★★★ この処理もここで実装 ★★★
            const currentEvents = this.editingObject.getData('events') || [];
            const newEvent = {
                id: `event_${Date.now()}`,
                trigger: 'onClick', // デフォルトトリガー
                nodes: [],
                connections: []
            };
            currentEvents.push(newEvent);
            this.editingObject.setData('events', currentEvents);
            
            this.buildVslTabs(); // タブUIを再描画
            this.setActiveVslEvent(newEvent.id); // 作成した新しいイベントをアクティブにする
        });
        this.vslTabs.appendChild(addButton);

        const systemScene = this.game.scene.getScene('SystemScene');

        // --- 「コピー」ボタン ---
        if (this.activeEventId && this.activeEventData) {
            const copyButton = document.createElement('button');
            copyButton.className = 'vsl-tool-button';
            copyButton.innerText = '📋';
            copyButton.title = 'このイベントをコピー';
            copyButton.addEventListener('click', () => {
                // ▼▼▼【ここからがコピー処理】▼▼▼
                const clonedData = this.cloneEventDataWithNewIds(this.activeEventData);
                systemScene.eventClipboard = clonedData;
                // console.log("Copied event to clipboard:", systemScene.eventClipboard);
                // 貼り付けボタンを即座に表示するために、タブUIを再描画
                this.buildVslTabs();
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
            });
            this.vslTabs.appendChild(copyButton);
        }
        
        // --- 「貼り付け」ボタン ---
        if (systemScene && systemScene.eventClipboard) {
            const pasteButton = document.createElement('button');
            pasteButton.className = 'vsl-tool-button';
            pasteButton.innerText = '📄';
            pasteButton.title = 'コピーしたイベントを貼り付け';
            pasteButton.addEventListener('click', () => {
                // ▼▼▼【ここからが貼り付け処理】▼▼▼
                const dataToPaste = this.cloneEventDataWithNewIds(systemScene.eventClipboard);
                const currentEvents = this.editingObject.getData('events') || [];
                currentEvents.push(dataToPaste);
                this.editingObject.setData('events', currentEvents);

                this.buildVslTabs();
                this.setActiveVslEvent(dataToPaste.id); // 貼り付けたイベントをアクティブにする
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
            });
            this.vslTabs.appendChild(pasteButton);
        }
    }
    
    /**
     * ★★★ 新規メソッド ★★★
     * 指定されたIDのイベントグラフを、アクティブにして表示する
     * @param {string | null} eventId - アクティブにするイベントのID
     */
   // src/editor/EditorUI.js

    /**
     * ★★★ 最終FIX版 ★★★
     * 指定されたIDのイベントグラフを、アクティブにして表示する
     * @param {string | null} eventId - アクティブにするイベントのID
     */
    setActiveVslEvent(eventId) {
        this.activeEventId = eventId;
        
        // --- 1. 新しいアクティブイベントのデータを検索 ---
        const events = this.editingObject.getData('events') || [];
        this.activeEventData = events.find(e => e.id === eventId) || null;
        
        // --- 2. すべての関連UIを、新しいデータで再描画 ---
        //    (populateVslTriggerEditorは、まだないのでコメントアウト)
        
        // ▼▼▼【ここが、エラーを解決する修正です】▼▼▼
        // --------------------------------------------------------------------
        // ★★★ populateVslToolbarにも、見つけたactiveEventDataを渡す ★★★
        this.populateVslToolbar(this.activeEventData);
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        
        this.populateVslCanvas(this.activeEventData); 
         this.populateVslTriggerEditor(this.activeEventData); // ← 将来これは復活させる

        // --- 3. 最後に、タブの見た目を更新 ---
        this.buildVslTabs();
    }

    /**
     * ★★★ 新規メソッド ★★★
     * イベントエディタを閉じる
     */
closeEventEditor = () => {
        if (!this.eventEditorOverlay) return;
        this.eventEditorOverlay.style.display = 'none';
        this.editingObject = null;
        this.game.input.enabled = true;
        // console.log("[EditorUI] Phaser input re-enabled.");
        if(this.plugin) {
            this.plugin.pluginManager.game.input.enabled = true;
        }
    }
    
   // in src/editor/EditorUI.js

    /**
     * ★★★ アルファベット順ソート機能付き - 最終版 ★★★
     * VSLツールバーのノードリストを生成する
     * @param {object | null} activeEvent - 現在アクティブなイベントのデータ
     */
    populateVslToolbar(activeEvent) {
        if (!this.vslNodeList) return;
        this.vslNodeList.innerHTML = '';
        
        if (!activeEvent) return;

        const eventTagHandlers = this.game.registry.get('eventTagHandlers'); 
        
        if (eventTagHandlers) {
            // ▼▼▼【ここが修正の核心です】▼▼▼
            // --------------------------------------------------------------------

            // 1. オブジェクトからキー（タグ名）の配列を取得する
            const tagNames = Object.keys(eventTagHandlers);

            // 2. 配列をアルファベット順にソートする
            tagNames.sort();

            // 3. ソート済みの配列を使ってループ処理を行う
            for (const tagName of tagNames) {
            // --------------------------------------------------------------------
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
            
                const button = document.createElement('button');
                button.className = 'node-add-button';
                button.innerText = `[${tagName}]`;
                
                button.addEventListener('click', () => {
                    this.addNodeToEventData(tagName, activeEvent);
                });
                
                this.vslNodeList.appendChild(button);
            }
        } else {
            this.vslNodeList.innerHTML = '<p>Event Handlers not found.</p>';
        }
    }

    /**
     * ★★★ マルチトリガー対応版 - 最終FIX ★★★
     * @param {string} tagName - 追加するノードのタイプ
     * @param {object} targetEvent - 追加先のイベントグラフのデータ
     */
   // in EditorUI.js

/**
 * ★★★ 変数名エラーを修正した最終版 ★★★
 * ノードが重ならないように配置する
 * @param {string} tagName - 追加するノードのタイプ
 * @param {object} targetVslData - 追加先のVSLデータ
 */
// in EditorUI.js

/**
 * ★★★ ノードの高さを考慮して重なりを防ぐ最終FIX版 ★★★
 * @param {string} tagName - 追加するノードのタイプ
 * @param {object} targetVslData - 追加先のVSLデータ
 */
addNodeToEventData(tagName, targetVslData) {
    if (!this.editingObject || !targetVslData) return;
    
    // ▼▼▼【ここからが座標計算の修正】▼▼▼
    const NODE_AVERAGE_HEIGHT = 150; // ノードのおおよその高さ (CSSに合わせて調整)
    const NODE_MARGIN_Y = 20;      // ノード間の垂直マージン

    let newX = 50;
    let newY = 50;

    if (targetVslData.nodes && targetVslData.nodes.length > 0) {
        // 最も下に突き出ているノードの「下端」の座標を見つける
        // (各ノードの y座標 + 高さ) の最大値を探す
        const lowestPoint = Math.max(
            ...targetVslData.nodes.map(n => n.y + NODE_AVERAGE_HEIGHT)
        );
        
        // 新しいノードの上端(Y座標)は、その下端からマージンを空けた位置に設定
        newY = lowestPoint + NODE_MARGIN_Y;
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const newNode = {
        id: `node_${Date.now()}`, type: tagName, params: {},
        x: newX, y: newY
    };
    
    // (これ以降のロジックは変更なし)
    const eventTagHandlers = this.game.registry.get('eventTagHandlers');
    const handler = eventTagHandlers?.[tagName];
    if (handler?.define?.params) {
        handler.define.params.forEach(paramDef => {
            if (paramDef.defaultValue !== undefined) {
                newNode.params[paramDef.key] = paramDef.defaultValue;
            }
        });
    }
    
    if (!targetVslData.nodes) {
        targetVslData.nodes = [];
    }
    targetVslData.nodes.push(newNode);
    
    const isSmEditor = this.smEditorOverlay.style.display === 'flex';
    if (isSmEditor) {
        this.editingObject.setData('stateMachine', this.stateMachineData);
        this.displayActiveVslEditor();
    } else {
        const allEvents = this.editingObject.getData('events');
        this.editingObject.setData('events', allEvents);
        this.setActiveVslEvent(this.activeEventId);
    }
}

  // in src/editor/EditorUI.js

/**
 * ★★★ onStateChangeとonDirectionChangeを復活させた最終FIX版 ★★★
 * VSLトリガー編集UIを構築・再描画する
 * @param {object | null} activeEvent - 現在アクティブなイベントのデータ
 */
populateVslTriggerEditor(activeEvent) {
    const select = document.getElementById('vsl-trigger-select');
    const contextContainer = document.getElementById('vsl-trigger-context');
    if (!select || !contextContainer || !this.editingObject) return;

    if (!activeEvent) {
        select.innerHTML = '';
        contextContainer.innerHTML = '';
        return;
    }

    // --- 1. ドロップダウンの中身を生成 ---
    select.innerHTML = '';

    // ▼▼▼【ここが修正の核心です】▼▼▼
    // 利用可能なトリガーのリストに、不足していた2つを追加します。
    const availableTriggers = [
        'onClick', 
        'onReady', 
        'onCollide_Start', 
        'onStomp', 
        'onHit', 
        'onOverlap_Start', 
        'onOverlap_End',
        'onStateChange',      // ★★★ これを復活させる ★★★
        'onDirectionChange',  // ★★★ これを復活させる ★★★
        'onInteract'
    ];
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    availableTriggers.forEach(triggerName => {
        const option = document.createElement('option');
        option.value = triggerName;
        option.innerText = triggerName;
        if (triggerName === activeEvent.trigger) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // --- 2. ドロップダウンが変更されたときの処理 ---
    select.onchange = () => {
        activeEvent.trigger = select.value;
        // トリガーが変更されたら、関連性のない古いコンテキスト情報をクリアする
        delete activeEvent.targetGroup; 
        delete activeEvent.condition;   // ★ conditionもクリアする

        const allEvents = this.editingObject.getData('events');
        this.editingObject.setData('events', allEvents);
        
        this.buildVslTabs(); 
        this.populateVslTriggerEditor(activeEvent); // ★ UIを再描画してコンテキスト入力欄を更新
    };

    // --- 3. コンテキスト入力欄（相手のグループや条件式）を生成 ---
    contextContainer.innerHTML = '';
    
    // a) 衝突・接触系のトリガーの場合
    if (['onCollide_Start', 'onStomp', 'onHit', 'onOverlap_Start', 'onOverlap_End'].includes(activeEvent.trigger)) {
        const label = document.createElement('label');
        label.innerText = '相手のグループ: ';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = activeEvent.targetGroup || '';
        input.onchange = () => {
            activeEvent.targetGroup = input.value;
            const allEvents = this.editingObject.getData('events');
            this.editingObject.setData('events', allEvents);
        };
        contextContainer.append(label, input);
    }
    // b) 状態・向き変化のトリガーの場合
    else if (['onStateChange', 'onDirectionChange'].includes(activeEvent.trigger)) {
        const label = document.createElement('label');
        label.innerText = '条件(Condition): ';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = "e.g., state === 'walk'";
        input.value = activeEvent.condition || '';
        input.onchange = () => {
            activeEvent.condition = input.value;
            const allEvents = this.editingObject.getData('events');
            this.editingObject.setData('events', allEvents);
        };
        contextContainer.append(label, input);
    }
}


    buildNodeContent(nodeElement, nodeData) {
        nodeElement.innerHTML = ''; // クリア

        const eventTagHandlers = this.game.registry.get('eventTagHandlers');
        const handler = eventTagHandlers ? eventTagHandlers[nodeData.type] : null;
        const pinDefine = handler?.define?.pins;

        // --- 列1: 入力ピン ---
        const inputsContainer = document.createElement('div');
        inputsContainer.className = 'vsl-pins-container inputs';
        
        const inputPins = pinDefine?.inputs || [{ name: 'input' }];
        inputPins.forEach(pinDef => {
            const pinWrapper = document.createElement('div');
            pinWrapper.className = 'vsl-pin-wrapper';
            
            const pinElement = document.createElement('div');
            pinElement.className = 'vsl-node-pin input';
            pinElement.dataset.pinType = 'input';
            pinElement.dataset.pinName = pinDef.name;
            
            const pinLabel = document.createElement('span');
            pinLabel.className = 'pin-label';
            if (pinDef.label) pinLabel.innerText = pinDef.label;
            
            pinWrapper.append(pinElement, pinLabel);
            inputsContainer.appendChild(pinWrapper);
        });
        nodeElement.appendChild(inputsContainer);

        // --- 列2: 中央コンテンツ ---
        const centerContent = document.createElement('div');
        centerContent.className = 'vsl-node-content';
        
        const title = document.createElement('strong');
        title.innerText = `[${nodeData.type}]`;
        
        const paramsContainer = document.createElement('div');
        paramsContainer.className = 'node-params';
        
        if (handler && handler.define && Array.isArray(handler.define.params)) {
        
        // --- 特別扱い: call_component_method の場合 ---
       if (nodeData.type === 'call_component_method') {
    // --- 特別扱い: call_component_method ---
    
    // 1. Componentドロップダウンを生成
    const componentSelectRow = this.createNodeComponentSelect(paramsContainer, nodeData, 'component', 'コンポーネント名');
    const componentSelect = componentSelectRow.querySelector('select');

    // 2. Methodドロップダウンを生成
    this.createNodeComponentMethodSelect(paramsContainer, nodeData, 'method', 'メソッド名');

    // 3. その他のパラメータを生成
    this.createNodeTextInput(paramsContainer, nodeData, 'target', '対象オブジェクト', 'self');
    this.createNodeTextInput(paramsContainer, nodeData, 'params', '引数(JSON)', '[]');
    
    // ★★★ ここからが、バグ修正の核心です ★★★
    // 4. Componentドロップダウンが変更された時のイベントリスナー
    componentSelect.addEventListener('change', () => {
        // a. まず、選択された値を nodeData.params に「保存」する
        if (!nodeData.params) nodeData.params = {};
        nodeData.params.component = componentSelect.value;
        
        // b. 選択が変わったので、メソッドの選択はリセットする
        nodeData.params.method = null; 

        // c. 最後に、ノードのUI全体を再構築して、メソッドドロップダウンを更新する
        this.buildNodeContent(nodeElement, nodeData);
    });
    
            
        } else {
            // --- 通常のノードの場合 (既存のロジック) ---
             handler.define.params.forEach(paramDef => {
                // ▼▼▼【ここからが修正箇所です】▼▼▼
                switch (paramDef.type) {
                    case 'game_flow_event_select':
                        // ★ 新しいcaseを追加
                        this.createNodeGameFlowEventSelect(paramsContainer, nodeData, paramDef.key, paramDef.label);
                        break;
                    
                    case 'component_select':
                        this.createNodeComponentSelect(paramsContainer, nodeData, paramDef.key, paramDef.label);
                        break;
                    
                    case 'asset_key':
                        this.createNodeAssetSelectInput(paramsContainer, nodeData, paramDef.key, paramDef.label, paramDef);
                        break;
                    
                    case 'select':
                        this.createNodeSelectInput(paramsContainer, nodeData, paramDef.key, paramDef.label, paramDef.defaultValue, paramDef.options);
                        break;
                    
                    case 'number':
                        this.createNodeNumberInput(paramsContainer, nodeData, paramDef.key, paramDef.label, paramDef.defaultValue);
                        break;
                    
                    default:
                        this.createNodeTextInput(paramsContainer, nodeData, paramDef.key, paramDef.label, paramDef.defaultValue);
                        break;
                }
            });
        }
    }
        
        this.createNodePositionInput(paramsContainer, nodeData, 'x');
        this.createNodePositionInput(paramsContainer, nodeData, 'y');
        
        const deleteButton = document.createElement('button');
        deleteButton.innerText = '削除';
        deleteButton.className = 'node-delete-button';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`ノード [${nodeData.type}] を削除しますか？`)) {
                this.deleteNode(nodeData.id);
            }
        });

        centerContent.append(title, paramsContainer, deleteButton);
        nodeElement.appendChild(centerContent);

        // --- 列3: 出力ピン ---
        const outputsContainer = document.createElement('div');
        outputsContainer.className = 'vsl-pins-container outputs';

        const outputPins = pinDefine?.outputs || [{ name: 'output' }];
        outputPins.forEach(pinDef => {
            const pinWrapper = document.createElement('div');
            pinWrapper.className = 'vsl-pin-wrapper';

            const pinElement = document.createElement('div');
            pinElement.className = 'vsl-node-pin output';
            pinElement.dataset.pinType = 'output';
            pinElement.dataset.pinName = pinDef.name;

            const pinLabel = document.createElement('span');
            pinLabel.className = 'pin-label';
            if (pinDef.label) pinLabel.innerText = pinDef.label;

            pinWrapper.append(pinLabel, pinElement); // ラベルが先
            outputsContainer.appendChild(pinWrapper);
        });
        nodeElement.appendChild(outputsContainer);
    }
   
   // in your VSLEditor.js or similar file

/**
 * ★★★ 新設メソッド ★★★
 * ゲームフローイベントを選択するためのドロップダウンリストをノード内に生成する。
 * assets/data/game_flow.json を読み込み、イベント名を自動的にリストアップする。
 */
createNodeGameFlowEventSelect(parent, nodeData, key, label) {
    const row = document.createElement('div');
    row.className = 'node-param-row';
    
    const labelElement = document.createElement('label');
    labelElement.innerText = label;
    
    const select = document.createElement('select');
    
    // --- 1. game_flow.json をPhaserのキャッシュから取得 ---
    const gameFlowData = this.game.cache.json.get('game_flow');
    
    if (gameFlowData && gameFlowData.states) {
        // --- 2. 全てのイベント名を収集し、重複を排除 ---
        const eventSet = new Set();
        Object.values(gameFlowData.states).forEach(stateDef => {
            if (stateDef.transitions) {
                stateDef.transitions.forEach(transition => {
                    eventSet.add(transition.event);
                });
            }
        });

        // --- 3. ドロップダウンの選択肢を生成 ---
        const events = Array.from(eventSet).sort(); // アルファベット順にソート
        
        // 空の選択肢を追加
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.innerText = 'イベントを選択...';
        select.appendChild(emptyOption);
        
        events.forEach(eventName => {
            const option = document.createElement('option');
            option.value = eventName;
            option.innerText = eventName;
            select.appendChild(option);
        });

    } else {
        // JSONが読み込めなかった場合のフォールバック
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.innerText = 'game_flow.jsonが見つかりません';
        select.appendChild(errorOption);
        select.disabled = true;
    }
    
    // --- 4. 現在の値を設定し、イベントリスナーをセット ---
    const currentValue = nodeData.params?.[key] || '';
    select.value = currentValue;
    
    select.addEventListener('change', (e) => {
        if (!nodeData.params) {
            nodeData.params = {};
        }
        nodeData.params[key] = e.target.value;
    });

    row.append(labelElement, select);
    parent.appendChild(row);
    
    return row; // 参照を返す
}

/**
 * ★★★ 新設 ★★★
 * VSLノード内に、選択されたコンポーネントの公開メソッドを選ぶドロップダウンを生成する
 * @returns {HTMLElement} 生成された行要素 (イベントリスナー設定のため)
 */
// in EditorUI.js
// ★★★ 既存の createNodeComponentMethodSelect を、この内容で「完全に」置き換える ★★★

createNodeComponentMethodSelect(container, nodeData, paramKey, label) {
    const row = document.createElement('div');
    row.className = 'node-param-row';
    const labelEl = document.createElement('label');
    labelEl.innerText = `${label}: `;
    const select = document.createElement('select');
    
    // ★★★ nodeData.params から、選択されているコンポーネント名を取得 ★★★
    const selectedComponent = nodeData.params?.component;
    
    if (!selectedComponent) {
        select.disabled = true;
        select.innerHTML = '<option>コンポーネントを先に選択</option>';
    } else {
        const componentRegistry = this.game.registry.get('ComponentRegistry');
        const componentClass = componentRegistry?.[selectedComponent];
        const methods = componentClass?.define?.methods || [];

        if (methods.length === 0) {
            select.innerHTML = '<option>公開メソッドなし</option>';
        } else {
            // 空の選択肢を追加
            select.innerHTML = '<option value="">Select Method...</option>';
        }

        methods.forEach(methodName => {
            const option = document.createElement('option');
            option.value = methodName;
            option.innerText = methodName;
            if (nodeData.params?.[paramKey] === methodName) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    select.addEventListener('change', () => {
        if (this.plugin) {
            const isSmEditor = this.smEditorOverlay.style.display === 'flex';
            if (isSmEditor) this.plugin.updateStateMachineNodeParam(nodeData, paramKey, select.value, false);
            else this.plugin.updateNodeParam(nodeData, paramKey, select.value, false);
        }
    });
    
    row.append(labelEl, select);
    container.appendChild(row);
    return row;
}
/**
 * ★★★ 既存の createNodePositionInput を、この内容に置き換える ★★★
 * ノードのX/Y座標を編集するUIを生成する (スライダー付き)
 */
createNodePositionInput(container, nodeData, key) {
    this.createNodeSliderInput(
        container,
        key.toUpperCase(),
        Math.round(nodeData[key]),
        0, 4000, 1,
        (value) => {
            if (!this.plugin) return;

            // ▼▼▼【ここが修正の核心】▼▼▼
            const isSmEditor = this.smEditorOverlay.style.display === 'flex';
            if (isSmEditor) {
                // ステートマシンエディタの場合、新しい専用メソッドを呼ぶ
                this.plugin.updateStateMachineNodeParam(nodeData, key, value, true);
            } else {
                // イベントエディタの場合、既存のメソッドを呼ぶ
                this.plugin.updateNodeParam(nodeData, key, value, true);
            }
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        }
    );
}

 
    /**
     * ★★★ A案＋ピン接続 - 完成版 ★★★
     * VSLキャンバスでポインターが押されたときの処理
     * @param {PointerEvent} downEvent - pointerdownイベントオブジェクト
     
    onVslCanvasPointerDown(downEvent) {
        // --- 1. パンモードの場合は、パン処理を開始して、ここで終了 ---
        if (this.vslMode === 'pan') {
            downEvent.preventDefault();
            const canvasWrapper = document.getElementById('vsl-canvas-wrapper');
            const startScrollX = canvasWrapper.scrollLeft;
            const startScrollY = canvasWrapper.scrollTop;
            const startClientX = downEvent.clientX;
            const startClientY = downEvent.clientY;
            
            const onPanMove = (moveEvent) => {
                moveEvent.preventDefault();
                const dx = moveEvent.clientX - startClientX;
                const dy = moveEvent.clientY - startClientY;
                canvasWrapper.scrollLeft = startScrollX - dx;
                canvasWrapper.scrollTop = startScrollY - dy;
            };

            const onPanUp = () => {
                window.removeEventListener('pointermove', onPanMove);
                window.removeEventListener('pointerup', onPanUp);
            };

            window.addEventListener('pointermove', onPanMove);
            window.addEventListener('pointerup', onPanUp);
            return; 
        }

        // --- 2. セレクトモードの処理 ---
        
        // ★★★ 修正点: 未定義の`event`ではなく、引数の`downEvent`を使う ★★★
        const pinElement = downEvent.target.closest('[data-pin-type]');
        const nodeElement = downEvent.target.closest('[data-is-node="true"]');
        
        // 入力欄のクリックは何もしない
        if (downEvent.target.tagName === 'INPUT') {
            return;
        }

        // --- ケースA: ピンがクリックされた場合 (接続処理) ---
        if (pinElement) {
            downEvent.stopPropagation();
            this.onPinClicked(pinElement);
        } 
        // --- ケースB: ノードがクリックされた場合 (選択処理) ---
        else if (nodeElement) {
            const nodeId = nodeElement.dataset.nodeId;
            const events = this.editingObject.getData('events');
            const nodeData = events[0].nodes.find(n => n.id === nodeId);
            if (nodeData) {
                // selectNodeはサイドバーを更新するので、もう不要
                // this.selectNode(nodeData); 
            }
        } 
        // --- ケースC: 何もない場所がクリックされた場合 (選択解除) ---
        else {
            // deselectNodeはサイドバーを更新するので、もう不要
            // this.deselectNode();
        }
    }*/
/**
     * ★★★ 新規メソッド ★★★
     * ノード接続モードを開始する
     */
    startConnection(fromNodeId, event) {
        this.connectionState.isActive = true;
        this.connectionState.fromNodeId = fromNodeId;
        
        // SVGでプレビュー用の線を描画する準備
        // (このSVGのセットアップは少し複雑なので、まずはロジックを完成させる)
        // console.log(`Connection started from node: ${fromNodeId}`);
    }
  
   /**
 * ★★★ 復活させるメソッド (A案仕様) ★★★
 * VSLノードを選択し、プロパティパネルの更新をプラグインに依頼する
 */
selectNode(nodeData) {
    this.selectedNodeData = nodeData;
    // console.log("Selected node:", nodeData);

    // ★ EditorPluginに、プロパティパネルを「ノード編集モード」で更新するよう依頼
    if (this.plugin) {
        this.plugin.updatePropertyPanelForNode(nodeData);
    }
    
    // 選択されたノードの見た目を変える (CSSで .vsl-node.selected を定義)
    this.vslCanvas.querySelectorAll('.vsl-node.selected').forEach(el => el.classList.remove('selected'));
    const el = this.vslCanvas.querySelector(`[data-node-id="${nodeData.id}"]`);
    if (el) el.classList.add('selected');
}

/**
 * ★★★ 復活させるメソッド (A案仕様) ★★★
 * VSLノードの選択を解除する
 */
deselectNode() {
    if (!this.selectedNodeData) return;
    this.selectedNodeData = null;

    if (this.plugin) {
        // ★ プロパティパネルを、通常の「オブジェクト編集モード」に戻すよう依頼
        this.plugin.selectSingleObject(this.editingObject);
    }

    this.vslCanvas.querySelectorAll('.vsl-node.selected').forEach(el => el.classList.remove('selected'));
}
  
    
 // in EditorUI.js

/**
 * ★★★ データ欠損防止策を施した最終版 ★★★
 * ノード内に、パラメータを編集するためのテキスト入力欄を1行生成する
 */
// in EditorUI.js

/**
 * ★★★ イベントを 'input' に変更した最終版 ★★★
 * ノード内に、パラメータを編集するためのテキスト入力欄を1行生成する
 */
createNodeTextInput(container, nodeData, paramKey, label, defaultValue) {
    const row = document.createElement('div');
    row.className = 'node-param-row';
    const labelEl = document.createElement('label');
    labelEl.innerText = `${label}: `;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = nodeData.params?.[paramKey] ?? defaultValue ?? '';
    
    // ▼▼▼ イベントを 'change' から 'input' に変更 ▼▼▼
    input.addEventListener('input', () => {
        if (!this.plugin) return;
        const isSmEditor = this.smEditorOverlay.style.display === 'flex';
        if (isSmEditor) {
            this.plugin.updateStateMachineNodeParam(nodeData, paramKey, input.value, false);
        } else {
            this.plugin.updateNodeParam(nodeData, paramKey, input.value, false);
        }
    });
    
    row.append(labelEl, input);
    container.appendChild(row);
}

/**
 * ★★★ イベントを 'input' に変更した最終版 ★★★
 * ノード内に、パラメータを編集するための「数値」入力欄を1行生成する
 */
createNodeNumberInput(container, nodeData, paramKey, label, defaultValue) {
    const row = document.createElement('div');
    row.className = 'node-param-row';
    const labelEl = document.createElement('label');
    labelEl.innerText = `${label}: `;
    const input = document.createElement('input');
    input.type = 'number';
    input.value = nodeData.params?.[paramKey] ?? defaultValue ?? 0;
    
    // ▼▼▼ イベントを 'change' から 'input' に変更 ▼▼▼
    input.addEventListener('input', () => {
        if (!this.plugin) return;
        const value = parseFloat(input.value);
        const isSmEditor = this.smEditorOverlay.style.display === 'flex';
        // isNaNチェックを追加して、不正な入力でデータが壊れるのを防ぐ
        if (!isNaN(value)) {
            if (isSmEditor) {
                this.plugin.updateStateMachineNodeParam(nodeData, paramKey, value, false);
            } else {
                this.plugin.updateNodeParam(nodeData, paramKey, value, false);
            }
        }
    });
    
    row.append(labelEl, input);
    container.appendChild(row);
}

/**
 * ★★★ データ欠損防止策を施した最終版 ★★★
 * ノード内に、ドロップダウン選択式の入力欄を生成する
 */
createNodeSelectInput(container, nodeData, paramKey, label, defaultValue, options) {
    const row = document.createElement('div');
    row.className = 'node-param-row';
    const labelEl = document.createElement('label');
    labelEl.innerText = `${label}: `;
    
    const select = document.createElement('select');
    // ▼▼▼【ここが最重要容疑箇所】▼▼▼
    const currentValue = nodeData.params?.[paramKey] ?? defaultValue;
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    options.forEach(optValue => {
        const option = document.createElement('option');
        option.value = optValue;
        option.innerText = optValue;
        if (currentValue == optValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        if (!this.plugin) return;
        const isSmEditor = this.smEditorOverlay.style.display === 'flex';
        if (isSmEditor) {
            this.plugin.updateStateMachineNodeParam(nodeData, paramKey, select.value, false);
        } else {
            this.plugin.updateNodeParam(nodeData, paramKey, select.value, false);
        }
    });
    
    row.append(labelEl, select);
    container.appendChild(row);
}

// in EditorUI.js

/**
 * ★★★ 新設（シンプル版）★★★
 * VSLノード内に、ComponentRegistryに登録されている全てのコンポーネントを
 * 選択するためのドロップダウンを生成する
 */
createNodeComponentSelect(container, nodeData, paramKey, label) {
    const row = document.createElement('div');
    row.className = 'node-param-row';
    const labelEl = document.createElement('label');
    labelEl.innerText = `${label}: `;
    
    const select = document.createElement('select');
    
    // --- 1. グローバルなComponentRegistryを取得 ---
    const componentRegistry = this.game.registry.get('ComponentRegistry');
    if (!componentRegistry) {
        // レジストリが見つからない場合はエラーメッセージを表示
        row.innerText = "Error: ComponentRegistry not found.";
        container.appendChild(row);
        return;
    }

    const componentNames = Object.keys(componentRegistry).sort(); // アルファベット順にソート

    // --- 2. ドロップダウンの選択肢を生成 ---
    // 空の選択肢を追加
    const placeholder = document.createElement('option');
    placeholder.value = "";
    placeholder.innerText = "Select Component...";
    select.appendChild(placeholder);

    componentNames.forEach(compName => {
        const option = document.createElement('option');
        option.value = compName;
        option.innerText = compName;
        if (nodeData.params?.[paramKey] === compName) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    // --- 3. 変更イベントのリスナーを設定 (変更なし) ---
    select.addEventListener('change', () => {
        if (!this.plugin) return;
        this.plugin.updateNodeParam(nodeData, paramKey, select.value, false);
    });
    
    row.append(labelEl, select);
    container.appendChild(row);
    return row;
}
/**
 * ★★★ データ欠損防止策を施した最終版 ★★★
 * アセット選択用のドロップダウンを生成する
 */
createNodeAssetSelectInput(container, nodeData, paramKey, label, paramDef) {
    const row = document.createElement('div');
    row.className = 'node-param-row';
    const labelEl = document.createElement('label');
    labelEl.innerText = `${label}: `;
    const select = document.createElement('select');
    
    const assetList = this.game.registry.get('asset_list') || [];
    const targetAssetType = paramDef.assetType;

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.innerText = 'アセットを選択...';
    select.appendChild(placeholderOption);

    // ▼▼▼【ここが最重要容疑箇所】▼▼▼
    const currentValue = nodeData.params?.[paramKey] ?? paramDef.defaultValue;
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    assetList.forEach(asset => {
        let isMatch = false;
        if (targetAssetType === 'prefab') isMatch = (asset.type === 'prefab' || asset.type === 'GroupPrefab');
        else if (targetAssetType === 'image') isMatch = (asset.type === 'image' || asset.type === 'spritesheet');
        else isMatch = (asset.type === targetAssetType);
        
        if (!targetAssetType || isMatch) {
            const option = document.createElement('option');
            option.value = asset.key;
            option.innerText = `[${asset.type}] ${asset.key}`;
            if (currentValue === asset.key) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    });

    select.addEventListener('change', () => {
        if (!this.plugin) return;
        const isSmEditor = this.smEditorOverlay.style.display === 'flex';
        if (isSmEditor) {
            this.plugin.updateStateMachineNodeParam(nodeData, paramKey, select.value, false);
        } else {
            this.plugin.updateNodeParam(nodeData, paramKey, select.value, false);
        }
    });
    
    row.append(labelEl, select);
    container.appendChild(row);
}
     /**
     * ★★★ 新規メソッド ★★★
     * VSLエディタの操作モードを切り替える
     * @param {'select' | 'pan'} mode - 新しいモード
     */
    setVslMode(mode) {
        if (this.vslMode === mode) return;
        this.vslMode = mode;
        // console.log(`VSL mode changed to: ${mode}`);

        const selectBtn = document.getElementById('vsl-select-mode-btn');
        const panBtn = document.getElementById('vsl-pan-mode-btn');
        const canvasWrapper = document.getElementById('vsl-canvas-wrapper');

        if (mode === 'pan') {
            selectBtn.classList.remove('active');
            panBtn.classList.add('active');
            canvasWrapper.style.cursor = 'grab';
        } else { // 'select'
            panBtn.classList.remove('active');
            selectBtn.classList.add('active');
            canvasWrapper.style.cursor = 'default';
        }
    }
    // src/editor/EditorUI.js

    // ... (setVslModeメソッドなどの後)

    /**
     * ★★★ 新規追加 ★★★
     * VSLノードのピンがクリックされたときの処理
     * @param {HTMLElement} clickedPin - クリックされたピンのHTML要素
     */
 onPinClicked(clickedPin) {
    const pinType = clickedPin.dataset.pinType;
    const pinName = clickedPin.dataset.pinName;
    const parentNode = clickedPin.closest('.vsl-node');
    if (!parentNode || !parentNode.dataset.nodeId) return;
    const nodeId = parentNode.dataset.nodeId;

    if (!this.connectionState.isActive && pinType === 'output') {
        this.connectionState = {
            isActive: true, fromNodeId: nodeId, fromPinName: pinName,
            fromPinElement: clickedPin
        };
        clickedPin.classList.add('is-connecting');
    } 
    else if (this.connectionState.isActive && pinType === 'input') {
        const { fromNodeId, fromPinName } = this.connectionState;
        const toNodeId = nodeId;
        const toPinName = pinName;

        // ▼▼▼【ここが修正の核心】▼▼▼
        const isSmEditor = this.smEditorOverlay.style.display === 'flex';
        // どちらのエディタが開いているかに応じて、正しい接続作成メソッドを呼ぶ
        if (isSmEditor) {
            this.createConnection(fromNodeId, fromPinName, toNodeId, toPinName, this.activeVslData);
        } else {
            const events = this.editingObject.getData('events');
            const targetEvent = events.find(e => e.id === this.activeEventId);
            this.createConnection(fromNodeId, fromPinName, toNodeId, toPinName, targetEvent);
        }
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        if (this.connectionState.fromPinElement) {
            this.connectionState.fromPinElement.classList.remove('is-connecting');
        }
        this.connectionState = { isActive: false };
    }
    else if (this.connectionState.isActive) {
        if (this.connectionState.fromPinElement) {
            this.connectionState.fromPinElement.classList.remove('is-connecting');
        }
        this.connectionState = { isActive: false };
    }
}
 // in EditorUI.js

/**
 * ★★★ 既存の createConnection を、この内容に置き換える ★★★
 * 新しい接続をイベントデータに追加し、キャンバスを再描画する
 * @param {string} fromNodeId
 * @param {string} fromPinName
 * @param {string} toNodeId
 * @param {string} toPinName
 * @param {object} targetVslData - ★追加: 接続を追加する対象のVSLデータ
 */
createConnection(fromNodeId, fromPinName, toNodeId, toPinName, targetVslData) {
    if (!this.editingObject || !targetVslData || fromNodeId === toNodeId) return;

    if (!targetVslData.connections) {
        targetVslData.connections = [];
    }

    // 既存の接続を上書き
    targetVslData.connections = targetVslData.connections.filter(
        c => !(c.fromNode === fromNodeId && c.fromPin === fromPinName)
    );

    targetVslData.connections.push({ 
        fromNode: fromNodeId, fromPin: fromPinName, 
        toNode: toNodeId, toPin: toPinName 
    });

    // ▼▼▼【ここが修正の核心】▼▼▼
    const isSmEditor = this.smEditorOverlay.style.display === 'flex';
    if (isSmEditor) {
        this.editingObject.setData('stateMachine', this.stateMachineData);
    } else {
        const allEvents = this.editingObject.getData('events');
        this.editingObject.setData('events', allEvents);
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    
    // UI再描画
    this.populateVslCanvas();
}

  // in EditorUI.js

/**
 * ★★★ 既存の drawConnections を、この内容に置き換える ★★★
 * connectionsデータに基づいて、SVGで線を描画する
 */
// in EditorUI.js

/**
 * ★★★ ベジェ曲線対応・最終FIX版 ★★★
 * connectionsデータに基づいて、SVGで滑らかな曲線を描画する。
 * イベントエディタとステートマシンエディタの両方で動作する。
 * @param {SVGElement} svgLayer - 描画対象のSVG要素
 * @param {Array<object>} nodes - ノードデータの配列
 * @param {Array<object>} connections - 接続データの配列
 */
// in EditorUI.js

// in EditorUI.js

/**
 * ★★★ getBoundingClientRectを使った座標計算・最終確定版 ★★★
 * connectionsデータに基づいて、SVGで滑らかな曲線を描画する。
 */
// in EditorUI.js

/**
 * ★★★ デバッグログ完全組み込み・最終確定版 ★★★
 * getBoundingClientRectを使った座標計算で、SVGで滑らかな曲線を描画する。
 */
drawConnections(svgLayer, nodes, connections) {
    const isSmEditor = this.smEditorOverlay.style.display === 'flex';
    const canvasEl = isSmEditor
        ? this.smEditorOverlay.querySelector('.sm-vsl-canvas')
        : this.vslCanvas;

    // --- ガード節 ---
    if (!canvasEl) {
        console.error("[DEBUG] drawConnections: キャンバス要素が見つかりませんでした。");
        return;
    }
    if (!svgLayer) {
        console.error("[DEBUG] drawConnections: SVGレイヤーが渡されませんでした。");
        return;
    }

    // --- 描画の準備 ---
    const svgRect = svgLayer.getBoundingClientRect();
    svgLayer.innerHTML = '';

    // --- デバッグログ (Phase 1: 実行開始) ---
    console.groupCollapsed("[DEBUG] drawConnections 実行");
    // console.log("渡されたnodesデータ:", JSON.parse(JSON.stringify(nodes || [])));
    // console.log("渡されたconnectionsデータ:", JSON.parse(JSON.stringify(connections || [])));
    
    if (!connections || connections.length === 0) {
        // console.log("接続データが空のため、描画をスキップします。");
        console.groupEnd();
        return;
    }
    
    // --- 各接続をループして描画 ---
    connections.forEach((conn, index) => {
        // --- デバッグログ (Phase 2: 個別接続の処理開始) ---
        console.groupCollapsed(`接続 ${index + 1}: [${conn.fromNode}:${conn.fromPin}] -> [${conn.toNode}:${conn.toPin}]`);
        
        // --- DOM要素の検索 ---
        const fromNodeEl = canvasEl.querySelector(`[data-node-id="${conn.fromNode}"]`);
        const toNodeEl = canvasEl.querySelector(`[data-node-id="${conn.toNode}"]`);
        
        // console.log("FromノードDOM:", fromNodeEl);
        // console.log("ToノードDOM:", toNodeEl);

        if (fromNodeEl && toNodeEl) {
            const fromPinEl = fromNodeEl.querySelector(`[data-pin-type="output"][data-pin-name="${conn.fromPin}"]`);
            const toPinEl = toNodeEl.querySelector(`[data-pin-type="input"][data-pin-name="${conn.toPin}"]`);

            // console.log("FromピンDOM:", fromPinEl);
            // console.log("ToピンDOM:", toPinEl);

            if (fromPinEl && toPinEl) {
                // --- 座標計算 ---
                const fromPinRect = fromPinEl.getBoundingClientRect();
                const toPinRect = toPinEl.getBoundingClientRect();

                const fromPinCenterX = fromPinRect.left + fromPinRect.width / 2;
                const fromPinCenterY = fromPinRect.top + fromPinRect.height / 2;
                const toPinCenterX = toPinRect.left + toPinRect.width / 2;
                const toPinCenterY = toPinRect.top + toPinRect.height / 2;
                
                const startX = fromPinCenterX - svgRect.left;
                const startY = fromPinCenterY - svgRect.top;
                const endX = toPinCenterX - svgRect.left;
                const endY = toPinCenterY - svgRect.top;

                // --- ベジェ曲線データ生成 ---
                const dx = Math.abs(startX - endX);
                const handleOffset = Math.max(50, dx / 2);
                const controlX1 = startX + handleOffset;
                const controlY1 = startY;
                const controlX2 = endX - handleOffset;
                const controlY2 = endY;
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const pathData = `M ${startX},${startY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`;
                path.setAttribute('d', pathData);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', '#888');
                path.setAttribute('stroke-width', '2');
                
                // --- 描画実行 ---
                svgLayer.appendChild(path);
                
                // --- デバッグログ (Phase 3: 成功) ---
                // console.log("計算後の座標:", {startX, startY, endX, endY});
                // console.log("SVGパスデータ:", pathData);
                // console.log("%c描画成功！", "color: lightgreen;");

            } else {
                // --- デバッグログ (Phase 3: 失敗) ---
                console.error("ピンのDOM要素が見つかりませんでした。");
            }
        } else {
            // --- デバッグログ (Phase 3: 失敗) ---
            console.error("ノードのDOM要素が見つかりませんでした。");
        }
        
        console.groupEnd(); // 個別接続ロググループを閉じる
    });

    console.groupEnd(); // 全体ロググループを閉じる
}
     // in EditorUI.js

/**
 * ★★★ ステートマシンエディタに対応した修正版 ★★★
 * 「現在アクティブな」VSLグラフから、指定されたIDのノードを削除する
 * @param {string} nodeIdToDelete - 削除するノードのID
 */
deleteNode(nodeIdToDelete) {
    if (!this.editingObject) return;

    const isSmEditor = this.smEditorOverlay.style.display === 'flex';
    
    let targetVslData = null;
    
    // ▼▼▼【ここからが修正の核心】▼▼▼
    // 1. どちらのエディタが開いているかに応じて、編集対象のVSLデータを特定する
    if (isSmEditor) {
        if (this.stateMachineData && this.activeStateName && this.activeHookName) {
            targetVslData = this.stateMachineData.states[this.activeStateName]?.[this.activeHookName];
        }
    } else {
        if (this.activeEventId) {
            const events = this.editingObject.getData('events') || [];
            targetVslData = events.find(e => e.id === this.activeEventId);
        }
    }

    if (!targetVslData) {
        console.error("削除対象のVSLデータが見つかりません。");
        return;
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // --- 2. nodes配列から、該当するノードを削除 (ここは共通ロジック) ---
    if (targetVslData.nodes) {
        targetVslData.nodes = targetVslData.nodes.filter(n => n.id !== nodeIdToDelete);
    }
    
    // --- 3. connections配列から、このノードに関連する接続をすべて削除 (ここは共通ロジック) ---
    if (targetVslData.connections) {
        targetVslData.connections = targetVslData.connections.filter(c => 
            c.fromNode !== nodeIdToDelete && c.toNode !== nodeIdToDelete
        );
    }

    // ▼▼▼【ここからが修正の核心】▼▼▼
    // 4. 変更を永続化し、UIを再描画する
    if (isSmEditor) {
        this.editingObject.setData('stateMachine', this.stateMachineData);
        this.displayActiveVslEditor(); // ステートマシンUIを更新
    } else {
        const allEvents = this.editingObject.getData('events');
        this.editingObject.setData('events', allEvents);
        this.setActiveVslEvent(this.activeEventId); // イベントエディタUIを更新
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
}
/**
 * ★★★ 既存の populateVslCanvas を、この内容で確認・修正 ★★★
 */
populateVslCanvas() {
    // どのモーダルで呼ばれても対応できるように、コンテキストを判別
    const isSmEditor = this.smEditorOverlay.style.display === 'flex';
    const canvasEl = isSmEditor
        ? this.smEditorOverlay.querySelector('.sm-vsl-canvas')
        : this.vslCanvas;
        
    if (!canvasEl) return;
    
    // --- 描画対象のデータを決定 ---
    let targetVslData;
    if (isSmEditor) {
        targetVslData = this.activeVslData;
    } else {
        const events = this.editingObject?.getData('events') || [];
        targetVslData = events.find(e => e.id === this.activeEventId);
    }
    
    // --- 描画処理 ---
    canvasEl.innerHTML = ''; 
    const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.id = 'vsl-svg-layer'; 
    svgLayer.setAttribute('width', '4000');
    svgLayer.setAttribute('height', '4000');
    canvasEl.appendChild(svgLayer);

    if (!targetVslData) return;

    if (targetVslData.nodes) {
        targetVslData.nodes.forEach(nodeData => {
            const nodeWrapper = document.createElement('div');
            nodeWrapper.className = 'vsl-node-wrapper';
            nodeWrapper.style.left = `${nodeData.x}px`;
            nodeWrapper.style.top = `${nodeData.y}px`;

            const nodeElement = document.createElement('div');
            nodeElement.className = 'vsl-node';
            nodeElement.dataset.isNode = 'true';
            nodeElement.dataset.nodeId = nodeData.id;

            this.buildNodeContent(nodeElement, nodeData);
            
            nodeWrapper.appendChild(nodeElement);
            canvasEl.appendChild(nodeWrapper);
            nodeElement.querySelectorAll('[data-pin-type]').forEach(pinElement => {
                pinElement.addEventListener('pointerdown', (event) => {
                    // 親要素へのイベント伝播を止めて、意図しない動作を防ぐ
                    event.stopPropagation(); 
                    // 既存のピンクリック処理メソッドを呼び出す
                    this.onPinClicked(pinElement); 
                });
            });
        });
    }
    
    // ▼▼▼【ここが重要】▼▼▼
    // DOMの配置が完了した次のフレームで線を描画することで、座標計算が正確になる
    requestAnimationFrame(() => {
        if (targetVslData && targetVslData.connections) {
            // 正しい引数で drawConnections を呼び出す
            this.drawConnections(svgLayer, targetVslData.nodes, targetVslData.connections);
        }
    });
}

    /**
     * ★★★ 新規ヘルパー (タスク1) ★★★
     * ノード内に、スライダーと数値入力を組み合わせたUIを生成する
     */
    createNodeSliderInput(container, label, initialValue, min, max, step, changeCallback) {
        const row = document.createElement('div');
        row.className = 'node-param-row node-slider-row'; // スタイリング用のクラスを追加

        const labelEl = document.createElement('label');
        labelEl.innerText = `${label}: `;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = initialValue;

        const numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.style.width = '60px'; // 幅を固定
        numberInput.value = initialValue;

        // スライダーを動かしたら、数値入力も更新
        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            numberInput.value = value;
            changeCallback(value);
        });

        // 数値入力を変更したら、スライダーも更新
        numberInput.addEventListener('change', () => {
            const value = parseFloat(numberInput.value);
            slider.value = value;
            changeCallback(value);
        });
        
        row.append(labelEl, slider, numberInput);
        container.appendChild(row);
    }

    // in src/editor/EditorUI.js

    /**
     * ★★★ 新規ヘルパー (コピー機能の核心) ★★★
     * イベントグラフのデータを安全にディープコピーし、すべてのIDを振り直す
     * @param {object} originalEventData - コピー元のイベントデータ
     * @returns {object} IDがすべて新しいものに置き換えられた、イベントデータの完全なコピー
     */
    cloneEventDataWithNewIds(originalEventData) {
        // JSONを介して、元のデータを一切変更しない完全なコピーを作成
        const clonedEvent = JSON.parse(JSON.stringify(originalEventData));

        // 1. 新しいイベントIDを生成
        clonedEvent.id = `event_${Date.now()}`;

        // 2. ノードIDの古いものと新しいものの対応表を作成
        const nodeIdMap = {};
        clonedEvent.nodes.forEach(node => {
            const oldId = node.id;
            const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            node.id = newId;
            nodeIdMap[oldId] = newId;
        });

        // 3. 接続情報(connections)が古いIDを参照しないよう、新しいIDに更新
        if (clonedEvent.connections) {
            clonedEvent.connections.forEach(connection => {
                connection.fromNode = nodeIdMap[connection.fromNode];
                connection.toNode = nodeIdMap[connection.toNode];
            });
        }
        
        return clonedEvent;
    }


    /**
     * 
     * 
     * ここからステートマシン
     */
    // in src/editor/EditorUI.js
// in EditorUI.js

// =================================================================
// ステートマシン・エディタ関連のメソッド群
// =================================================================

// =================================================================
// ステートマシン・エディタ関連のメソッド群 (フェーズ2実装版)
// =================================================================

/**
 * ステートマシン・エディタを開く
 * @param {Phaser.GameObjects.GameObject} selectedObject
 */
openStateMachineEditor = (selectedObject) => {
    if (!this.smEditorOverlay || !selectedObject) return;

    // --- モーダル表示と入力無効化 ---
    document.body.classList.add('modal-open');
    this.game.input.enabled = false;
    this.editingObject = selectedObject;
    this.smEditorOverlay.style.display = 'flex';
    
    // --- タイトルの更新 ---
    const title = this.smEditorOverlay.querySelector('#sm-editor-title');
    if (title) title.innerText = `ステートマシン編集: ${this.editingObject.name}`;

    // --- オブジェクトからデータを取得 (なければ初期化) ---
    this.stateMachineData = this.editingObject.getData('stateMachine');
    if (!this.stateMachineData) {
        this.stateMachineData = this.getInitialStateMachineData();
        this.editingObject.setData('stateMachine', this.stateMachineData);
    }
    
    // ★★★ 最初に表示する状態とフックを決定 ★★★
    this.activeStateName = this.stateMachineData.initialState;
    this.activeHookName = 'onEnter'; // デフォルトはonEnter

    // --- UIの構築とリスナー設定 ---
    this.buildStatesPanel();
    this.buildHooksTabs(); // ★追加
    this.displayActiveVslEditor(); // ★追加
    this.setupStateMachineEventListeners();
}

/**
 * ステートマシン用の初期データ構造を返す
 */
getInitialStateMachineData() {
    const defaultStateName = '待機';
    return {
        initialState: defaultStateName,
        states: {
            [defaultStateName]: {
                onEnter: { nodes: [], connections: [] },
                onUpdate: { nodes: [], connections: [] },
                onExit: { nodes: [], connections: [] }
            }
        }
    };
}

/**
 * 左ペインの「状態リスト」を構築・再描画する
 */
buildStatesPanel() {
    const statesListContainer = this.smEditorOverlay.querySelector('#sm-states-list');
    if (!statesListContainer) return;
    statesListContainer.innerHTML = '';
    const stateNames = Object.keys(this.stateMachineData.states);
    stateNames.forEach(stateName => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'sm-state-item';
        itemDiv.innerText = stateName;
        itemDiv.dataset.stateName = stateName;
        if (this.activeStateName === stateName) {
            itemDiv.classList.add('active');
        }
        statesListContainer.appendChild(itemDiv);
    });
}

/**
 * ★★★ 新規メソッド ★★★
 * 右ペイン上部の「イベントフック」のタブUIを構築・再描画する
 */
buildHooksTabs() {
    const hooksTabsContainer = this.smEditorOverlay.querySelector('#sm-hooks-tabs');
    if (!hooksTabsContainer) return;
    hooksTabsContainer.innerHTML = '';

    const hooks = [
        { key: 'onEnter', label: '実行時 (onEnter)' },
        { key: 'onUpdate', label: '更新時 (onUpdate)' },
        { key: 'onExit', label: '終了時 (onExit)' }
    ];

    hooks.forEach(hook => {
        const tabButton = document.createElement('button');
        tabButton.className = 'sm-hook-tab';
        tabButton.innerText = hook.label;
        tabButton.dataset.hookName = hook.key;
        if (this.activeHookName === hook.key) {
            tabButton.classList.add('active');
        }
        hooksTabsContainer.appendChild(tabButton);
    });
}


/// in EditorUI.js

/**
 * ★★★ デバッグログ付き ★★★
 * 現在選択されている状態とフックに基づいて、VSLエディタの中身を表示する
 */
// in src/editor/EditorUI.js

/**
 * ★★★ データ欠損時に自動生成する機能を追加した最終FIX版 ★★★
 * 現在選択されている状態とフックに基づいて、VSLエディタの中身を表示する
 */
displayActiveVslEditor() {
    const vslContainer = this.smEditorOverlay.querySelector('.sm-vsl-editor-container');
    if (!vslContainer) return;
    
    // --- 1. アクティブなステートのデータを取得 ---
    let activeState = this.stateMachineData.states[this.activeStateName];
    if (!activeState) {
        // 万が一ステート自体がない場合は、ここで作る
        this.stateMachineData.states[this.activeStateName] = {};
        activeState = this.stateMachineData.states[this.activeStateName];
    }

    // --- 2. アクティブなフックのVSLデータを取得 ---
    this.activeVslData = activeState[this.activeHookName];

    // ▼▼▼【ここがエラーを解決する核心部分です】▼▼▼
    // --- 3. もしフックのデータが存在しなかったら、その場で空のデータを作成してあげる ---
    if (!this.activeVslData) {
        console.warn(`VSL data for hook '${this.activeHookName}' not found. Creating it now.`);
        activeState[this.activeHookName] = { nodes: [], connections: [] };
        this.activeVslData = activeState[this.activeHookName];
        
        // ★ 作成したデータを、必ずGameObject本体のデータにも反映させる
        this.editingObject.setData('stateMachine', this.stateMachineData);
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // --- 4. UIを再描画 ---
    // この時点では、this.activeVslDataは必ず存在することが保証されている
    this.populateSmVslCanvas();
}
/**
 * ステートマシンエディタ内のイベントリスナーを設定・更新する
 */
setupStateMachineEventListeners() {
    // --- 既存のリスナーを確実に削除 ---
    const addStateBtn = this.smEditorOverlay.querySelector('#sm-add-state-btn');
    if (addStateBtn && this._onAddNewState) addStateBtn.removeEventListener('click', this._onAddNewState);
    
    const statesList = this.smEditorOverlay.querySelector('#sm-states-list');
    if (statesList && this._onStateClicked) statesList.removeEventListener('click', this._onStateClicked);

    const hooksTabs = this.smEditorOverlay.querySelector('#sm-hooks-tabs');
    if (hooksTabs && this._onHookTabClicked) hooksTabs.removeEventListener('click', this._onHookTabClicked);

    // ▼▼▼【ここからデバッグログ】▼▼▼
    console.groupCollapsed("[DEBUG] setupStateMachineEventListeners 実行");
    // console.log("Add State Button:", addStateBtn);
    // console.log("States List Container:", statesList);
    // console.log("Hooks Tabs Container:", hooksTabs);
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    // --- 新しいリスナー関数を定義 ---
    this._onAddNewState = () => {
        const newStateName = prompt('新しい状態の名前を入力してください:', `新しい状態${Object.keys(this.stateMachineData.states).length}`);
        if (newStateName && !this.stateMachineData.states[newStateName]) {
            this.stateMachineData.states[newStateName] = { onEnter: { nodes: [], connections: [] }, onUpdate: { nodes: [], connections: [] }, onExit: { nodes: [], connections: [] }};
            this.editingObject.setData('stateMachine', this.stateMachineData);
            this.buildStatesPanel();
        } else if (newStateName) {
            alert('その名前の状態は既に使用されています。');
        }
    };

    this._onStateClicked = (event) => {
        const targetItem = event.target.closest('.sm-state-item');
        if (targetItem) {
            this.activeStateName = targetItem.dataset.stateName;
            this.buildStatesPanel();
            this.displayActiveVslEditor(); // ★VSLを更新
        }
    };

    // ★★★ 新規リスナー関数 ★★★
    this._onHookTabClicked = (event) => {
        const targetTab = event.target.closest('.sm-hook-tab');
        if (targetTab) {
            this.activeHookName = targetTab.dataset.hookName;
            this.buildHooksTabs();
            this.displayActiveVslEditor(); // ★VSLを更新
        }
    };

    // --- リスナーを登録 ---
    if (addStateBtn) addStateBtn.addEventListener('click', this._onAddNewState);
    else console.error("リスナー登録失敗: #sm-add-state-btn が見つかりません。");

    if (statesList) statesList.addEventListener('click', this._onStateClicked);
    else console.error("リスナー登録失敗: #sm-states-list が見つかりません。");
    
    if (hooksTabs) hooksTabs.addEventListener('click', this._onHookTabClicked);
    else console.error("リスナー登録失敗: #sm-hooks-tabs が見つかりません。");

    console.groupEnd();
}


/**
 * ステートマシン・エディタを閉じる
 */
closeStateMachineEditor = () => {
    if (!this.smEditorOverlay) return;
    
    this.smEditorOverlay.style.display = 'none';
    this.game.input.enabled = true;
    document.body.classList.remove('modal-open');
    
    // --- イベントリスナーを解除 ---
    this.smEditorOverlay.querySelector('#sm-add-state-btn')?.removeEventListener('click', this._onAddNewState);
    this.smEditorOverlay.querySelector('#sm-states-list')?.removeEventListener('click', this._onStateClicked);
    this.smEditorOverlay.querySelector('#sm-hooks-tabs')?.removeEventListener('click', this._onHookTabClicked);
    
    // --- 状態をリセット ---
    this.editingObject = null;
    this.stateMachineData = null;
    this.activeStateName = null;
    this.activeHookName = null;
    this.activeVslData = null;
}


// in EditorUI.js

/**
 * ★★★ 既存の populateSmVslCanvas メソッドをこれに置き換える ★★★
 * ステートマシン用のVSLツールバーとVSLキャンバスの両方を再描画する
 */
populateSmVslCanvas = () => {
    // --- 1. ツールバーの中身を描画 ---
    // populateVslToolbar は、現在アクティブなVSLデータを見てノードリストを作る
    // ステートマシンエディタの場合、`this.activeVslData` を渡してあげる必要がある
    const toolbarList = this.smEditorOverlay.querySelector('.sm-vsl-node-list');
    if (toolbarList) {
        // ★ 既存の `populateVslToolbar` を呼び出すが、コンテナ要素を渡すように改造が必要
        //    (今回は直接実装してしまうのが手っ取り早い)
        toolbarList.innerHTML = '';
        const eventTagHandlers = this.game.registry.get('eventTagHandlers');
        if (eventTagHandlers) {
            const tagNames = Object.keys(eventTagHandlers).sort();
            for (const tagName of tagNames) {
                const button = document.createElement('button');
                button.className = 'node-add-button'; // CSSは共通クラスを使う
                button.innerText = `[${tagName}]`;
                button.addEventListener('click', () => {
                    // addNodeToEventData も activeVslData を対象にする
                    this.addNodeToEventData(tagName, this.activeVslData);
                });
                toolbarList.appendChild(button);
            }
        }
    }
    
    // --- 2. キャンバスの中身を描画 ---
    this.populateVslCanvas();
}

}