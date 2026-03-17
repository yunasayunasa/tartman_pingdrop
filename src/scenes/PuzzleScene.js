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
        this.pins = [];
        this.traps = [];
        this.character = null;
        this.treasure = null;
        this._charMoveSpeed = 120; // px/sec
    }

    init(data) {
        super.init(data);
        if (data && data.stage) {
            this.currentStage = data.stage;
        }
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

        this._createStageUI();
        this._setupCollisions();
        this._addPinHoverEffect();
        this.events.emit('scene-ready');
    }

    // ─────────────────────────────────────────────
    // ピン操作
    // ─────────────────────────────────────────────

    _setupPin(pinObj) {
        pinObj.setInteractive({ useHandCursor: true });
        // ホバーで明るく
        pinObj.on('pointerover', () => {
            if (!this.isCleared && !this.isFailed) pinObj.setAlpha(0.7);
        });
        pinObj.on('pointerout', () => pinObj.setAlpha(1));
        pinObj.on('pointerdown', () => {
            if (this.isCleared || this.isFailed) return;
            this._pullPin(pinObj);
        });
    }

    _addPinHoverEffect() {
        // ピンに「↑」マーカーを追加してタップ誘導
        this.pins.forEach(pin => {
            const marker = this.add.text(pin.x, pin.y - 30, '↑', {
                fontSize: '18px', fill: '#FFFF00', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(20);
            this.tweens.add({
                targets: marker,
                y: pin.y - 42,
                yoyo: true,
                repeat: -1,
                duration: 500,
                ease: 'Sine.easeInOut'
            });
            // pinが破棄されたらmarkerも消す
            pin.on('destroy', () => { if (marker.active) marker.destroy(); });
        });
    }

    _pullPin(pinObj) {
        const pinName = pinObj.name;
        // 既に抜き中なら無視
        if (pinObj.getData('pulling')) return;
        pinObj.setData('pulling', true);

        this._playSe('pin_pull');

        // 抜くアニメーション（上方向）
        this.tweens.add({
            targets: pinObj,
            y: pinObj.y - 100,
            alpha: 0,
            duration: 350,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this._releaseBlockedObjects(pinName);
                pinObj.destroy();
            }
        });
    }

    _releaseBlockedObjects(pinName) {
        this.children.list.forEach(obj => {
            try {
                if (obj && obj.active && obj.getData && obj.getData('blockedBy') === pinName) {
                    console.log(`[PuzzleScene] Releasing: ${obj.name}`);
                    // destroyOnRelease フラグがあればそのまま消す（ゲートウォール等）
                    if (obj.getData('destroyOnRelease')) {
                        this.time.delayedCall(0, () => { if (obj.active) obj.destroy(); });
                        return;
                    }
                    if (obj.setStatic) obj.setStatic(false);
                    if (obj.setData) {
                        obj.setData('ignoreGravity', false);
                        obj.setData('blockedBy', null);
                    }
                }
            } catch (e) {
                console.error('[PuzzleScene] Release error:', e);
            }
        });
    }

    // ─────────────────────────────────────────────
    // キャラクター自動移動
    // ─────────────────────────────────────────────

    _updateCharacterMovement() {
        if (!this.character || !this.treasure) return;
        if (!this.character.active || !this.character.body) return;

        const dx = this.treasure.x - this.character.x;
        const absDx = Math.abs(dx);

        // 宝に十分近ければ速度ゼロ（衝突で終わるのでここには来ないが念のため）
        if (absDx < 5) return;

        const dir = dx > 0 ? 1 : -1;
        const speed = this._charMoveSpeed / 60;

        try {
            this.matter.body.setVelocity(this.character.body, {
                x: dir * speed,
                y: this.character.body.velocity.y
            });
        } catch (e) {
            // bodyが無効な場合は無視
        }
    }

    // ─────────────────────────────────────────────
    // 衝突判定
    // ─────────────────────────────────────────────

    _setupCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            if (this.isCleared || this.isFailed || !event || !event.pairs) return;

            event.pairs.forEach(pair => {
                const objA = pair.bodyA ? pair.bodyA.gameObject : null;
                const objB = pair.bodyB ? pair.bodyB.gameObject : null;
                if (!objA || !objB || !objA.active || !objB.active) return;

                // キャラ → 宝
                if (this._isCharAndTarget(objA, objB, 'character', 'treasure')) {
                    this._onStageClear();
                }
                // キャラ → 罠（溶岩・魔物など）
                if (this._isCharAndTrap(objA, objB)) {
                    this._onStageFail();
                }
                // 水 + 溶岩 → 岩
                if (this._isWaterAndLava(objA, objB)) {
                    this._onWaterLavaReaction(objA, objB);
                }
                // 魔物 + 溶岩 → 共に消滅
                if (this._isMonsterAndLava(objA, objB)) {
                    this._onMonsterLavaReaction(objA, objB);
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
        const aIsLava  = (objA.name || '').includes('lava');
        const bIsLava  = (objB.name || '').includes('lava');
        return (aIsWater && bIsLava) || (bIsWater && aIsLava);
    }

    _isMonsterAndLava(objA, objB) {
        const aIsMon  = (objA.name || '').includes('monster');
        const bIsMon  = (objB.name || '').includes('monster');
        const aIsLava = (objA.name || '').includes('lava');
        const bIsLava = (objB.name || '').includes('lava');
        return (aIsMon && bIsLava) || (bIsMon && aIsLava);
    }

    // ─────────────────────────────────────────────
    // 反応処理
    // ─────────────────────────────────────────────

    /** 水 + 溶岩 → 岩（無害化） */
    _onWaterLavaReaction(objA, objB) {
        if (!objA.active || !objB.active) return;
        const lavaObj  = (objA.name || '').includes('lava')  ? objA : objB;
        const waterObj = (objA.name || '').includes('water') ? objA : objB;
        console.log('[PuzzleScene] Water + Lava = Rock!');

        if (lavaObj.active) {
            lavaObj.setFillStyle(0x888888);
            lavaObj.name = 'rock';
        }
        this._playSe('reaction');
        this.time.delayedCall(0, () => {
            if (waterObj.active) waterObj.destroy();
        });
        // 煙エフェクト
        this._spawnSmoke(lavaObj.x, lavaObj.y);
    }

    /** 魔物 + 溶岩 → 共に消滅 */
    _onMonsterLavaReaction(objA, objB) {
        if (!objA.active || !objB.active) return;
        const monObj  = (objA.name || '').includes('monster') ? objA : objB;
        const lavaObj = (objA.name || '').includes('lava')    ? objA : objB;
        console.log('[PuzzleScene] Monster + Lava = Both destroyed!');

        this._playSe('reaction');
        this._spawnSmoke(lavaObj.x, lavaObj.y);

        this.time.delayedCall(0, () => {
            if (monObj.active)  monObj.destroy();
            if (lavaObj.active) lavaObj.destroy();
        });
    }

    // ─────────────────────────────────────────────
    // 煙エフェクト（Graphicsでパーティクル代替）
    // ─────────────────────────────────────────────

    _spawnSmoke(x, y) {
        for (let i = 0; i < 6; i++) {
            const circle = this.add.circle(
                x + Phaser.Math.Between(-20, 20),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(6, 14),
                0xcccccc, 0.8
            ).setDepth(50);
            this.tweens.add({
                targets: circle,
                y: circle.y - Phaser.Math.Between(30, 60),
                alpha: 0,
                scaleX: 2, scaleY: 2,
                duration: Phaser.Math.Between(400, 700),
                ease: 'Power1',
                onComplete: () => circle.destroy()
            });
        }
    }

    // ─────────────────────────────────────────────
    // クリア / 失敗
    // ─────────────────────────────────────────────

    _onStageClear() {
        if (this.isCleared) return;
        this.isCleared = true;
        console.log(`[PuzzleScene] Stage ${this.currentStage} CLEARED!`);

        this._playSe('clear');
        this.time.delayedCall(10, () => {
            if (this.matter.world) this.matter.world.pause();
        });

        // キャラをその場で止めて喜ぶ演出
        if (this.character && this.character.active) {
            this.tweens.add({
                targets: this.character,
                y: this.character.y - 20,
                yoyo: true,
                duration: 200,
                repeat: 2
            });
        }

        const clearText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 80,
            'STAGE CLEAR!',
            { fontSize: '52px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
              stroke: '#000', strokeThickness: 5 }
        ).setOrigin(0.5).setDepth(1000).setAlpha(0).setScale(0.5);

        this.tweens.add({
            targets: clearText,
            alpha: 1, scaleX: 1, scaleY: 1,
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

    _onStageFail() {
        if (this.isFailed) return;
        this.isFailed = true;
        console.log(`[PuzzleScene] Stage ${this.currentStage} FAILED!`);

        this._playSe('fail');
        // 画面シェイク
        this.cameras.main.shake(400, 0.015);

        this.time.delayedCall(10, () => {
            if (this.matter.world) this.matter.world.pause();
        });

        // 赤フラッシュ
        const flash = this.add.rectangle(
            this.cameras.main.centerX, this.cameras.main.centerY,
            this.cameras.main.width, this.cameras.main.height,
            0xff0000, 0.4
        ).setDepth(999);
        this.tweens.add({ targets: flash, alpha: 0, duration: 500,
            onComplete: () => flash.destroy() });

        const failText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 80,
            'FAILED...',
            { fontSize: '52px', fill: '#FF4444', fontFamily: 'Arial', fontStyle: 'bold',
              stroke: '#000', strokeThickness: 5 }
        ).setOrigin(0.5).setDepth(1000).setAlpha(0);

        this.tweens.add({
            targets: failText,
            alpha: 1,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                const retryBtn = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY + 20,
                    '🔄 RETRY',
                    { fontSize: '36px', fill: '#FFFFFF', fontFamily: 'Arial',
                      fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }
                ).setOrigin(0.5).setDepth(1000).setInteractive({ useHandCursor: true });
                retryBtn.on('pointerdown', () => this._retryStage());
            }
        });
    }

    // ─────────────────────────────────────────────
    // ナビゲーション
    // ─────────────────────────────────────────────

    _goToNextStage() {
        const nextStage = this.currentStage + 1;
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart({ stage: nextStage });
        });
    }

    _retryStage() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart({ stage: this.currentStage });
        });
    }

    _onGameClear() {
        EngineAPI.fireGameFlowEvent('GAME_CLEAR');
    }

    // ─────────────────────────────────────────────
    // UI
    // ─────────────────────────────────────────────

    _createStageUI() {
        this.add.text(
            this.cameras.main.centerX, 30,
            `STAGE ${this.currentStage} / ${this.totalStages}`,
            { fontSize: '28px', fill: '#FFFFFF', fontFamily: 'Arial',
              fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }
        ).setOrigin(0.5).setDepth(999).setScrollFactor(0);

        const retryBtn = this.add.text(
            this.cameras.main.width - 30, 30, '🔄',
            { fontSize: '32px' }
        ).setOrigin(1, 0.5).setDepth(999).setScrollFactor(0)
         .setInteractive({ useHandCursor: true });

        retryBtn.on('pointerdown', () => {
            if (!this.isCleared && !this.isFailed) this._retryStage();
        });
    }

    // ─────────────────────────────────────────────
    // サウンドユーティリティ
    // ─────────────────────────────────────────────

    _playSe(key) {
        try {
            const sm = this.registry.get('soundManager');
            if (sm && this.cache.audio.exists(key)) sm.playSe(key);
        } catch (e) { /* 未登録SEは無視 */ }
    }

    // ─────────────────────────────────────────────
    // ゲームループ
    // ─────────────────────────────────────────────

    update(time, delta) {
        if (this.isCleared || this.isFailed) return;
        super.update(time, delta);
        this._updateCharacterMovement();
    }
}
