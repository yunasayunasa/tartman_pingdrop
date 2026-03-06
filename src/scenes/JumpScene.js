
import BaseGameScene from './BaseGameScene.js';


export default class JumpScene extends BaseGameScene {

     constructor() {
        super({ key: 'JumpScene' });
        this.joystick = null;
        this.playerController = null; // ★ playerControllerもnullで初期化
        
    }

  create() {
    const joystickPlugin = this.plugins.get('rexvirtualjoystickplugin');
    if (joystickPlugin) {
        this.joystick = joystickPlugin.add(this, {
            x: 150, y: this.cameras.main.height - 150, radius: 100,
            base: this.add.circle(0, 0, 100, 0x888888, 0.5).setScrollFactor(0).setDepth(1000),
            thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.8).setScrollFactor(0).setDepth(1000),
        });
        // console.log("[JumpScene] Joystick instance created at the beginning of create().");
    }
        // console.log("[JumpScene] Create started.");
        super.create();
    
     /*   this.cameras.main.setBackgroundColor('#4488cc');
           //    'true'を指定すると、外側から内側に向かって暗くなるビネットになる
   const vignetteEffect = this.cameras.main.postFX.addVignette(0.5, 0.5, 0.7, true);

    // --- 2. (オプション) ビネットの見た目を調整 ---
    //    内側の明るい円の半径 (0.0 ～ 1.0)
    vignetteEffect.radius = 0.8; 
    //    ビネットの強さ (0.0 ～ 1.0)
    vignetteEffect.strength = 0.6; */
    
    // console.log("[JumpScene] Vignette effect applied to the main camera.");
        const soundManager = this.registry.get('soundManager');
        if (soundManager) soundManager.playBgm('night_bgm');

        const worldWidth = 3840;
        const worldHeight = 720;

        // ★★★ ここからがMatter.jsへの対応です ★★★
        // 1. Matter.jsのAPIを使って、世界の境界を設定する
        this.matter.world.setBounds(0, 0, worldWidth, worldHeight);
    this.matter.world.timeScale = 1;
    // console.log(`[JumpScene] Matter.js world time scale was set to: ${this.matter.world.timeScale}`);
        // 2. カメラの境界設定は、物理エンジンとは無関係なので、そのまま使える
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        // ★★★ ここまで ★★★
  // initSceneWithData を呼び出す「前」に、JSONデータを先読みする

  /*  // 1. 読み込むべきJSONのキーを決定する
    const keyToLoad = this.layoutDataKey || this.scene.key;
    const layoutData = this.cache.json.get(keyToLoad);

    // 2. JSONデータ内に hasJoystick: true のフラグがあれば、ジョイスティックを生成
    if (layoutData && layoutData.hasJoystick) {
        // console.log("[JumpScene] Joystick found in layout data. Re-creating joystick...");
        
        // ★ addJoystickFromEditorを、シーン自身の初期化のために再利用する
        //    (ただし、アラートは出ないように少し改修すると、より良い)
        this.addJoystickFromEditor(); 
    } else {
        // デバッグモードでない、かつJSONにもない場合は、従来のロジックで生成
        const isDebug = new URLSearchParams(window.location.search).has('debug');
        if (!isDebug) {
             this.addJoystickFromEditor(); // 常に表示する場合
        }
    }*/
   
        // データからシーンを構築する命令は最後に呼ぶ
         this.initSceneWithData();
      const uiScene = this.scene.get('UIScene');
this.events.on('resume', this.onSceneResume, this);
   
    }
     dumpJoyStickState() {
        // このメソッドは、PlayerControllerのupdateで直接参照するため、
        // デバッグ以外では空でも良い
    }
    
     /**
     * シーンがポーズから復帰した際に自動的に呼び出されるメソッド。
     * 古いジョイスティックを破棄し、新しいものを生成して入力が途切れないようにする。
     */
    onSceneResume() {
        // console.log("[JumpScene] Scene has been resumed. Re-initializing joystick to prevent input loss.");

        // 1. 既存のジョイスティックインスタンスがあれば、安全に破棄する
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
        }

        // 2. create()メソッドの冒頭にあったものと全く同じロジックで、ジョイスティックを再生成する
        const joystickPlugin = this.plugins.get('rexvirtualjoystickplugin');
        if (joystickPlugin) {
            this.joystick = joystickPlugin.add(this, {
                x: 150, y: this.cameras.main.height - 150, radius: 100,
                base: this.add.circle(0, 0, 100, 0x888888, 0.5).setScrollFactor(0).setDepth(1000),
                thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.8).setScrollFactor(0).setDepth(1000),
            });
            // console.log("[JumpScene] Joystick re-created successfully after resume.");
        }
    }
       /**
     * ★★★ 修正版 ★★★
     * JumpSceneに特有のロジック（SpriteかImageかの判定）だけを行い、
     * 残りの共通処理はすべて親クラスに委譲する。
     */
    addObjectFromEditor(assetKey, newName, layerName) {
        // --- JumpScene固有の処理 ---
        const isSpriteSheet = this.game.cache.json.get(assetKey + '_spritesheet') ? true : false;
        const type = isSpriteSheet ? 'Sprite' : 'Image';
        
        // --- 共通処理は親クラス(super)を呼び出す ---
        return super._addObjectFromEditorCore({ texture: assetKey, type: type }, newName, layerName);
    }

 // in src/scenes/JumpScene.js

/**
 * ★★★ 診断ログを追加した、デバッグ用の最終確定版 ★★★
 * プレイヤーとカメラのセットアップ処理を行う。
 */
setupPlayerAndCamera() {
    // このメソッドが既にプレイヤーを見つけている場合は、何もしない
    if (this.player && this.player.active) return;

    // --- ここからが診断ログです ---
    console.group(`%c[Camera Debug] Running setupPlayerAndCamera...`, 'color: #00bcd4; font-weight: bold;');
    
    // 1. シーンのオブジェクトリストに 'player' という名前のオブジェクトが存在するか確認
    const playerObjectExists = this.children.list.some(child => child.name === 'player');
    // console.log(`Step 1: Does a 'player' object exist in the scene's children list? -> ${playerObjectExists}`);

    // 2. 実際に 'player' を名前で検索してみる
    this.player = this.children.getByName('player');
    
    if (this.player) {
        // console.log(`%cStep 2: SUCCESS! Player object found.`, 'color: lightgreen;');
        // console.log(`Step 3: Player's current position is (x: ${Math.round(this.player.x)}, y: ${Math.round(this.player.y)})`);

        this.playerController = this.player.components?.PlayerController;
        this.player.setFixedRotation();
        
        // 3. カメラが既に何かを追従していないか確認
        if (this.cameras.main && !this.cameras.main.isFollowing) {
            // console.log("Step 4: Camera is not following anything. Starting follow now...");
            this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
            // 追従開始後のカメラのスクロール位置をログに出す
            this.time.delayedCall(10, () => { // 1フレーム待ってから確認
                 // console.log(`Step 5: Camera follow started. Camera scroll is now (x: ${Math.round(this.cameras.main.scrollX)}, y: ${Math.round(this.cameras.main.scrollY)})`);
            });
        } else {
            console.warn("Step 4: Camera is already following an object.");
        }
    } else {
        console.error(`%cStep 2: FAILED! Player object could not be found via getByName('player').`, 'color: red;');
    }
    
    console.groupEnd();
    // --- 診断ログはここまで ---
}
    
   update(time, delta) {
    
    super.update(time, delta);
    if (!this.joystick) {
        this.setupJoystick();
    }
    // プレイヤーが死んだり非アクティブになったら、参照をリセット
    if (this.player && !this.player.active) {
        this.player = null;
        this.playerController = null;
    }

    // ★★★ ここが新しいカメラ設定の「心臓部」になる ★★★
    // プレイヤーの参照がまだない場合、毎フレーム探しに行く
    if (!this.player) {
        // setupPlayerAndCameraは内部でnullチェックをしているので、何度呼んでも安全
        this.setupPlayerAndCamera();
    }
    
    // プレイヤーコントローラーが見つかっていれば、ジャンプボタンのリスナーも設定する
    if (this.playerController) {
        this.attachJumpButtonListener();
    }
}
       /**
     * ★★★ 新設：ジョイスティックをセットアップする専用メソッド ★★★
     * このメソッドは、SystemSceneからシーンの準備完了後に呼び出される。
     */
    setupJoystick() {
        if (this.joystick) return; // 既に存在すれば何もしない

        const joystickPlugin = this.plugins.get('rexvirtualjoystickplugin');
        if (!joystickPlugin) {
            console.error('CRITICAL: Virtual Joystick Plugin not loaded.');
            return;
        }

        // console.log("[JumpScene] Setting up joystick by external command...");
        this.joystick = joystickPlugin.add(this, {
            x: 150, y: this.cameras.main.height - 150, radius: 100,
            base: this.add.circle(0, 0, 100, 0x888888, 0.5).setScrollFactor(0).setDepth(1000),
            thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.8).setScrollFactor(0).setDepth(1000),
            enable: true,
        // このオプションは、プラグインがキーボードの矢印キーを
        // 監視する機能を無効化します。
        // これにより、ロード時にキーボード入力システムへアクセスしなくなり、
        // エラーが完全に回避されます。
        // キーボード操作はPlayerControllerが責任を持つので、
        // プラグインにこの機能は不要です。
        dir: '8dir', // or '4dir'
        // forceMin: undefined,
        // fixed: true,
        // noMove: false,
        // up: undefined,
        // down: undefined,
        // left: undefined,
        // right: undefined
             up: null,
        down: null,
        left: null,
        right: null,
        });
    }
    /**
     * ★★★ hasListenersエラーを修正した最終FIX版 ★★★
     * ジャンプボタンのリスナーを、重複しないように安全に設定する。
     */
    attachJumpButtonListener() {
        // --- 1. 必要なオブジェクトを取得 ---
        const uiScene = this.scene.get('UIScene');
        const jumpButton = uiScene?.uiElements?.get('jump_button');
        
        // --- ガード節: ボタンがなければ何もしない ---
        if (!jumpButton) {
            return;
        }

        // ▼▼▼【ここがエラーを解決する核心部分です】▼▼▼
        // --------------------------------------------------------------------
        // --- 2. リスナーが重複しないように、まず既存のリスナーをすべてクリアする ---
        //    'button_pressed'というイベントに登録されている全リスナーを削除します。
        jumpButton.off('button_pressed');

        // --- 3. 新しいリスナーを1つだけ登録する ---
        jumpButton.on('button_pressed', () => {
            // リスナー内部では、常に最新のplayerControllerを参照します。
            // (updateループで毎フレーム更新されているため、常に最新が保証される)
            if (this.playerController) {
                this.playerController.jump();
            }
        }, this);
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        
        // ★ ログは初回だけでいいので、フラグで管理する
        if (!this._jumpButtonListenerAttached) {
            this._jumpButtonListenerAttached = true;
            // console.log("[JumpScene] Jump button listener is now active.");
        }
    }
 // in src/scenes/JumpScene.js
// src/scenes/JumpScene.js

onSetupComplete() {
    // console.log("[JumpScene] onSetupComplete called. This is the final step in setup.");

    // ★★★ 1. ロードデータがあれば、シーンの状態を復元する ★★★
    if (this.loadData) {
        // console.log("Restoring scene state from save data...", this.loadData);
        
        const stateManager = this.registry.get('stateManager');
        if (stateManager && this.loadData.variables) {
            stateManager.setState(this.loadData); 
        }
        
        if (this.loadData.sceneSnapshot && this.loadData.sceneSnapshot.objects) {
            for (const objectState of this.loadData.sceneSnapshot.objects) {
                const targetObject = this.children.getByName(objectState.name);
                if (targetObject) {
                    targetObject.setPosition(objectState.x, objectState.y);
                    targetObject.setScale(objectState.scaleX, objectState.scaleY);
                    targetObject.setAngle(objectState.angle);
                    targetObject.setAlpha(objectState.alpha);
                    
                    if (targetObject.components && objectState.components) {
                        for (const compName in objectState.components) {
                            const component = targetObject.components[compName];
                            const compData = objectState.components[compName];
                            if (component && typeof component.deserialize === 'function') {
                                component.deserialize(compData);
                            }
                        }
                    }
                }
            }
        }
    }

    // ▼▼▼【以下の2行をコメントアウト、または削除してください】▼▼▼
    // this.setupPlayerAndCamera();
    // this.attachJumpButtonListener();
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
}
      /**
     * ★★★ 復活・確定版 ★★★
     * EditorUIからの要求に応じて、シーンにジョイスティックを生成する。
     * 冪等性（何度呼ばれても安全であること）を保証する。
     */
    addJoystickFromEditor(isFromEditor = true) { // ★ 引数を追加
    if (this.joystick && this.joystick.scene) {
        if (isFromEditor) alert('ジョイスティックは既にシーンに存在します。');
        return;
    }

        // --- 2. 必要なプラグインが利用可能かチェック ---
        const joystickPlugin = this.plugins.get('rexvirtualjoystickplugin');
        if (!joystickPlugin) {
            alert('エラー: Virtual Joystick Pluginがロードされていません。');
            return;
        }

        // console.log("[JumpScene] Adding joystick from editor request...");

        // --- 3. ジョイスティックを生成・設定 ---
        this.joystick = joystickPlugin.add(this, {
            x: 150,
            y: this.cameras.main.height - 150, // カメラの表示範囲の左下に配置
            radius: 100,
            // ジョイスティックの各パーツはUIなので、カメラをスクロールしても動かないようにし、常に最前面に表示
            base: this.add.circle(0, 0, 100, 0x888888, 0.5).setScrollFactor(0).setDepth(1000),
            thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.8).setScrollFactor(0).setDepth(1000),
        });

        // --- 4. 成功したことをユーザーに伝える ---
        // (アラートは少し煩わしいので、コンソールログの方が良いかもしれません)
        // console.log("ジョイスティックがシーンに追加されました。");
}
    

 
   // in src/scenes/JumpScene.js

/**
 * ★★★ 完全なクリーンアップ処理を含む、最終確定版 ★★★
 * シーンが停止する際にPhaserによって自動的に呼び出される
 */
// in src/scenes/JumpScene.js
// in src/scenes/JumpScene.js

/**
 * ★★★ 完全なクリーンアップ処理を含む、最終確定版 ★★★
 * シーンが停止する際にPhaserによって自動的に呼び出される
 */
shutdown() {
        // console.log("[JumpScene] Shutdown sequence started.");
        this.events.off('resume', this.onSceneResume, this);

        // --- 以下は元のshutdown()のコード ---
        if (this.joystick) {
            this.joystick.destroy();
            this.joystick = null;
            // console.log("[JumpScene] Joystick instance destroyed.");
        }
        super.shutdown();
        // console.log("[JumpScene] Shutdown sequence complete.");
    }
}