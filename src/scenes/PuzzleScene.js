// src/scenes/PuzzleScene.js
// ピン抜きパズルゲームのメインシーン

import BaseGameScene from './BaseGameScene.js';
import EngineAPI from '../core/EngineAPI.js';

export default class PuzzleScene extends BaseGameScene {
    constructor() {
        super({ key: 'PuzzleScene' });
        this.currentStage = 1;
        this.totalStages = 10;
        this.isCleared = false;
        this.isFailed = false;
        this.pins = [];        // シーン内のピンオブジェクトの参照
        this.traps = [];       // シーン内の罠オブジェクトの参照
        this.character = null;  // キャラクターオブジェクト
        this.treasure = null;   // 宝オブジェクト
    }

    init(data) {
        super.init(data);
        // ステージ番号を受け取る
        if (data && data.stage) {
            this.currentStage = data.stage;
        }
        // ステージに応じたlayoutDataKeyを設定
        this.layoutDataKey = `PuzzleStage${this.currentStage}`;
        this.isCleared = false;
        this.isFailed = false;
        this.pins = [];
        this.traps = [];
        this.character = null;
        this.treasure = null;
    }

    create() {
        super.create();
        this.initSceneWithData();
    }

    onSetupComplete() {
        console.log(`[PuzzleScene] Stage ${this.currentStage} setup complete.`);

        // シーン内のオブジェクトを分類して参照を保持
        this.children.list.forEach(obj => {
            const objName = obj.name || '';
            if (objName.startsWith('pin_')) {
                this.pins.push(obj);
                this._setupPin(obj);
            } else if (objName === 'character') {
                this.character = obj;
            } else if (objName === 'treasure') {
                this.treasure = obj;
            } else if (objName.startsWith('trap_')) {
                this.traps.push(obj);
            }
        });

        // ステージ番号テキスト表示
        this._createStageUI();

        // 衝突判定の設定
        this._setupCollisions();

        // シーン準備完了を通知
        this.events.emit('scene-ready');
    }

    /**
     * ピンオブジェクトにクリック/タップ操作を設定
     */
    _setupPin(pinObj) {
        pinObj.setInteractive({ useHandCursor: true });
        pinObj.on('pointerdown', () => {
            if (this.isCleared || this.isFailed) return;
            this._pullPin(pinObj);
        });
    }

    /**
     * ピンを抜く処理
     */
    _pullPin(pinObj) {
        const pinName = pinObj.name;
        console.log(`[PuzzleScene] Pulling pin: ${pinName}`);

        // ピンを抜くアニメーション（上方向にスライドして消える）
        this.tweens.add({
            targets: pinObj,
            y: pinObj.y - 120,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                // blockedByでこのピンに紐づけられた要素を解放
                this._releaseBlockedObjects(pinName);
                // オブジェクトを破棄
                pinObj.destroy();
            }
        });

        // SE再生
        const soundManager = this.registry.get('soundManager');
        if (soundManager && this.cache.audio.exists('pin_pull')) {
            soundManager.playSe('pin_pull');
        }
    }

    /**
     * ピンによってせき止められていたオブジェクトを解放する
     */
    _releaseBlockedObjects(pinName) {
        this.children.list.forEach(obj => {
            try {
                if (obj && obj.active && obj.getData && obj.getData('blockedBy') === pinName) {
                    console.log(`[PuzzleScene] Releasing object blocked by ${pinName}: ${obj.name}`);
                    // 物理演算を有効化
                    if (obj.setStatic) {
                        obj.setStatic(false);
                    }
                    // ignoreGravity を解除
                    if (obj.setData) {
                        obj.setData('ignoreGravity', false);
                        obj.setData('blockedBy', null);
                    }
                }
            } catch (e) {
                console.error(`[PuzzleScene] Error releasing object blocked by ${pinName}:`, e, obj ? obj.name : 'unknown');
            }
        });
    }

    /**
     * 衝突判定の設定
     */
    _setupCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            if (this.isCleared || this.isFailed || !event || !event.pairs) return;

            event.pairs.forEach(pair => {
                const objA = pair.bodyA ? pair.bodyA.gameObject : null;
                const objB = pair.bodyB ? pair.bodyB.gameObject : null;

                if (!objA || !objB || !objA.active || !objB.active) return;

                // キャラクター vs 宝 → クリア
                if (this._isCharAndTarget(objA, objB, 'character', 'treasure')) {
                    this._onStageClear();
                }

                // キャラクター vs 罠 → 失敗
                if (this._isCharAndTrap(objA, objB)) {
                    this._onStageFail();
                }

                // 水 vs 溶岩 → 岩に変化
                if (this._isWaterAndLava(objA, objB)) {
                    this._onWaterLavaReaction(objA, objB);
                }
            });
        });
    }
    _isCharAndTarget(objA, objB, nameA, nameB) {
        return (objA.name === nameA && objB.name === nameB) ||
            (objA.name === nameB && objB.name === nameA);
    }

    _isCharAndTrap(objA, objB) {
        const aIsChar = objA.name === 'character';
        const bIsChar = objB.name === 'character';
        const aIsTrap = (objA.name || '').startsWith('trap_');
        const bIsTrap = (objB.name || '').startsWith('trap_');
        return (aIsChar && bIsTrap) || (bIsChar && aIsTrap);
    }

    _isWaterAndLava(objA, objB) {
        const aIsWater = (objA.name || '').includes('water');
        const bIsWater = (objB.name || '').includes('water');
        const aIsLava = (objA.name || '').includes('lava');
        const bIsLava = (objB.name || '').includes('lava');
        return (aIsWater && bIsLava) || (bIsWater && aIsLava);
    }
    /**
     * 水と溶岩が反応して岩になる処理
     */
    _onWaterLavaReaction(objA, objB) {
        if (!objA.active || !objB.active) return;

        const lavaObj = (objA.name || '').includes('lava') ? objA : objB;
        const waterObj = (objA.name || '').includes('water') ? objA : objB;

        console.log(`[PuzzleScene] Reaction: Water + Lava = Rock!`);

        // 溶岩を岩に変える（色を変える、罠属性を消す）
        if (lavaObj.active) {
            lavaObj.setFillStyle(0x555555); // グレー（岩の色）
            lavaObj.name = 'rock'; // 名前を変えて罠判定から外す
        }

        // 水は消滅させる。衝突ループ内での破壊を避けるため、次のフレームで実行
        if (waterObj.active) {
            this.time.delayedCall(0, () => {
                if (waterObj.active) waterObj.destroy();
            });
        }
    }

    /**
     * ステージクリア処理
     */
    _onStageClear() {
        if (this.isCleared) return;
        this.isCleared = true;
        console.log(`[PuzzleScene] Stage ${this.currentStage} CLEARED!`);

        // 少し遅らせて物理を止める（イベントループ外で安全に）
        this.time.delayedCall(10, () => {
            if (this.matter.world) this.matter.world.pause();
        });

        // クリア演出
        const clearText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 60,
            '🎉 STAGE CLEAR!',
            { fontSize: '48px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(1000).setAlpha(0);

        this.tweens.add({
            targets: clearText,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    if (this.currentStage < this.totalStages) {
                        this._goToNextStage();
                    } else {
                        this._onGameClear();
                    }
                });
            }
        });
    }

    /**
     * ステージ失敗処理
     */
    _onStageFail() {
        if (this.isFailed) return;
        this.isFailed = true;
        console.log(`[PuzzleScene] Stage ${this.currentStage} FAILED!`);

        // 少し遅らせて物理を止める
        this.time.delayedCall(10, () => {
            if (this.matter.world) this.matter.world.pause();
        });

        // 失敗演出
        const failText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 60,
            '💀 FAILED...',
            { fontSize: '48px', fill: '#FF4444', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(1000).setAlpha(0);

        this.tweens.add({
            targets: failText,
            alpha: 1,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                // リトライボタン
                const retryBtn = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY + 40,
                    '🔄 RETRY',
                    { fontSize: '36px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }
                ).setOrigin(0.5).setDepth(1000).setInteractive({ useHandCursor: true });

                retryBtn.on('pointerdown', () => {
                    this._retryStage();
                });
            }
        });
    }

    /**
     * 次のステージへ遷移
     */
    _goToNextStage() {
        const nextStage = this.currentStage + 1;
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart({ stage: nextStage });
        });
    }

    /**
     * 現在のステージをリトライ
     */
    _retryStage() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart({ stage: this.currentStage });
        });
    }

    /**
     * 全ステージクリア
     */
    _onGameClear() {
        EngineAPI.fireGameFlowEvent('GAME_CLEAR');
    }

    /**
     * ステージUI（ステージ番号）の作成
     */
    _createStageUI() {
        // ステージ番号
        this.add.text(
            this.cameras.main.centerX,
            30,
            `STAGE ${this.currentStage} / ${this.totalStages}`,
            { fontSize: '28px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }
        ).setOrigin(0.5).setDepth(999).setScrollFactor(0);

        // リトライボタン（常時表示）
        const retryAlways = this.add.text(
            this.cameras.main.width - 30,
            30,
            '🔄',
            { fontSize: '32px' }
        ).setOrigin(1, 0.5).setDepth(999).setScrollFactor(0).setInteractive({ useHandCursor: true });

        retryAlways.on('pointerdown', () => {
            if (!this.isCleared && !this.isFailed) {
                this._retryStage();
            }
        });
    }

    update(time, delta) {
        if (this.isCleared || this.isFailed) return;
        super.update(time, delta);
    }
}
