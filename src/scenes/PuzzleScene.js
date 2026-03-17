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
        this._reacted = new Set(); // 反応済みペアの追跡（重複防止）
    }

    init(data) {
        super.init(data);
        if (data && data.stage) this.currentStage = data.stage;
        this.layoutDataKey = `PuzzleStage${this.currentStage}`;
        this.isCleared = false;
        this.isFailed  = false;
        this.pins = [];
        this.traps = [];
        this.character = null;
        this.treasure  = null;
        this._reacted  = new Set();
    }

    create() {
        super.create();
        this.initSceneWithData();
    }

    onSetupComplete() {
        console.log(`[PuzzleScene] Stage ${this.currentStage} setup complete.`);

        this.children.list.forEach(obj => {
            const n = obj.name || '';
            if (n.startsWith('pin_'))      { this.pins.push(obj);  this._setupPin(obj); }
            else if (n === 'character')      this.character = obj;
            else if (n === 'treasure')       this.treasure  = obj;
            else if (n.startsWith('trap_')) this.traps.push(obj);
        });

        this._createStageUI();
        this._setupCollisions();   // collisionstart / collisionactive
        this._addVisualEnhancements();
        this.events.emit('scene-ready');
    }

    // ─────────────────────────────────────────────
    // ピン操作
    // ─────────────────────────────────────────────

    _setupPin(pinObj) {
        pinObj.setInteractive({ useHandCursor: true });
        pinObj.on('pointerover', () => { if (!this.isCleared && !this.isFailed) pinObj.setAlpha(0.6); });
        pinObj.on('pointerout',  () => pinObj.setAlpha(1));
        pinObj.on('pointerdown', () => {
            if (this.isCleared || this.isFailed) return;
            this._pullPin(pinObj);
        });
    }

    _pullPin(pinObj) {
        if (pinObj.getData('pulling')) return;
        pinObj.setData('pulling', true);
        this._playSe('pin_pull');

        this.tweens.add({
            targets: pinObj,
            y: pinObj.y - 100,
            alpha: 0,
            duration: 350,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this._releaseBlockedObjects(pinObj.name);
                pinObj.destroy();
            }
        });
    }

    _releaseBlockedObjects(pinName) {
        this.children.list.forEach(obj => {
            try {
                if (obj && obj.active && obj.getData && obj.getData('blockedBy') === pinName) {
                    console.log(`[PuzzleScene] Releasing: ${obj.name}`);
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
        if (Math.abs(dx) < 5) return;
        const dir   = dx > 0 ? 1 : -1;
        const speed = this._charMoveSpeed / 60;
        try {
            this.matter.body.setVelocity(this.character.body, {
                x: dir * speed,
                y: this.character.body.velocity.y
            });
        } catch (e) { /* bodyが無効 */ }
    }

    // ─────────────────────────────────────────────
    // 衝突判定（collisionstart + collisionActive の二重監視）
    // ─────────────────────────────────────────────

    _setupCollisions() {
        const handler = (event) => {
            if (this.isCleared || this.isFailed || !event?.pairs) return;
            for (const pair of event.pairs) {
                const objA = pair.bodyA?.gameObject;
                const objB = pair.bodyB?.gameObject;
                if (!objA || !objB || !objA.active || !objB.active) continue;

                if (this._isCharAndTarget(objA, objB, 'character', 'treasure'))
                    this._onStageClear();
                if (this._isCharAndTrap(objA, objB))
                    this._onStageFail();
                if (this._isWaterAndLava(objA, objB))
                    this._tryWaterLavaReaction(objA, objB);
                if (this._isMonsterAndLava(objA, objB))
                    this._tryMonsterLavaReaction(objA, objB);
            }
        };
        // 開始時と継続中の両方を監視
        this.matter.world.on('collisionstart',  handler);
        this.matter.world.on('collisionactive', handler);
    }

    _isCharAndTarget(a, b, n1, n2) {
        return (a.name === n1 && b.name === n2) || (a.name === n2 && b.name === n1);
    }

    _isCharAndTrap(a, b) {
        const ac = a.name === 'character', bc = b.name === 'character';
        const at = (a.name || '').startsWith('trap_'), bt = (b.name || '').startsWith('trap_');
        return (ac && bt) || (bc && at);
    }

    _isWaterAndLava(a, b) {
        const aw = (a.name || '').includes('water'), bw = (b.name || '').includes('water');
        const al = (a.name || '').includes('lava'),  bl = (b.name || '').includes('lava');
        return (aw && bl) || (bw && al);
    }

    _isMonsterAndLava(a, b) {
        const am = (a.name || '').includes('monster'), bm = (b.name || '').includes('monster');
        const al = (a.name || '').includes('lava'),    bl = (b.name || '').includes('lava');
        return (am && bl) || (bm && al);
    }

    // ─────────────────────────────────────────────
    // update ループでの位置ベース重複検出（トンネリング対策）
    // ─────────────────────────────────────────────

    _checkProximityReactions() {
        const all = this.children.list.filter(o => o.active);
        const waters   = all.filter(o => (o.name || '').includes('water'));
        const lavas    = all.filter(o => (o.name || '').includes('lava'));
        const monsters = all.filter(o => (o.name || '').includes('monster'));

        // 水 × 溶岩
        for (const w of waters) {
            if (!w.body || w.body.isStatic) continue; // 落下中の水のみ対象
            for (const lava of lavas) {
                if (!lava.active) continue;
                if (this._overlapping(w, lava)) {
                    this._tryWaterLavaReaction(w, lava);
                }
            }
        }
        // 魔物 × 溶岩
        for (const m of monsters) {
            if (!m.body || m.body.isStatic) continue;
            for (const lava of lavas) {
                if (!lava.active) continue;
                if (this._overlapping(m, lava)) {
                    this._tryMonsterLavaReaction(m, lava);
                }
            }
        }
    }

    _overlapping(a, b) {
        const hw = (a.width  + b.width)  / 2 + 10;
        const hh = (a.height + b.height) / 2 + 10;
        return Math.abs(a.x - b.x) < hw && Math.abs(a.y - b.y) < hh;
    }

    // ─────────────────────────────────────────────
    // 反応処理（重複防止付き）
    // ─────────────────────────────────────────────

    _tryWaterLavaReaction(objA, objB) {
        if (!objA.active || !objB.active) return;
        const lava  = (objA.name || '').includes('lava')  ? objA : objB;
        const water = (objA.name || '').includes('water') ? objA : objB;
        if (!lava.active || !water.active) return;
        const key = `${water.name}+${lava.name}`;
        if (this._reacted.has(key)) return;
        this._reacted.add(key);

        console.log('[PuzzleScene] Water + Lava = Rock!');
        this._playSe('reaction');
        this._spawnSmoke(lava.x, lava.y);

        // 溶岩を岩に変える（センサーのまま、名前変更で無害化）
        if (lava.active) {
            lava.setFillStyle(0x888888);
            lava.name = 'rock';
            // ビジュアルラベルも更新
            const lbl = lava.getData('label_obj');
            if (lbl && lbl.active) lbl.setText('🪨');
        }
        // 水を次フレームで消去
        this.time.delayedCall(0, () => { if (water.active) water.destroy(); });
    }

    _tryMonsterLavaReaction(objA, objB) {
        if (!objA.active || !objB.active) return;
        const mon  = (objA.name || '').includes('monster') ? objA : objB;
        const lava = (objA.name || '').includes('lava')    ? objA : objB;
        if (!mon.active || !lava.active) return;
        const key = `${mon.name}+${lava.name}`;
        if (this._reacted.has(key)) return;
        this._reacted.add(key);

        console.log('[PuzzleScene] Monster + Lava = Both destroyed!');
        this._playSe('reaction');
        this._spawnSmoke(lava.x, lava.y);

        this.time.delayedCall(0, () => {
            if (mon.active)  mon.destroy();
            if (lava.active) lava.destroy();
        });
    }

    // ─────────────────────────────────────────────
    // 煙エフェクト
    // ─────────────────────────────────────────────

    _spawnSmoke(x, y) {
        for (let i = 0; i < 8; i++) {
            const r = Phaser.Math.Between(6, 16);
            const c = this.add.circle(
                x + Phaser.Math.Between(-30, 30),
                y + Phaser.Math.Between(-10, 10),
                r, 0xcccccc, 0.85
            ).setDepth(60);
            this.tweens.add({
                targets: c,
                y: c.y - Phaser.Math.Between(40, 80),
                alpha: 0,
                scaleX: 2.5, scaleY: 2.5,
                duration: Phaser.Math.Between(400, 800),
                ease: 'Power1',
                onComplete: () => c.destroy()
            });
        }
    }

    // ─────────────────────────────────────────────
    // ビジュアル強化
    // ─────────────────────────────────────────────

    _addVisualEnhancements() {
        const all = this.children.list.slice(); // コピー（forEachで変更を避ける）

        all.forEach(obj => {
            const n = obj.name || '';

            // ─ 溶岩: オレンジ/赤パルス + 🔥ラベル
            if (n.includes('lava')) {
                this._addPulse(obj, 0xff4500, 0xff8c00, 1200);
                this._addFloatingLabel(obj, '🔥', 0);
            }
            // ─ 水: 青シマーアニメ + 💧ラベル
            else if (n.includes('water')) {
                this._addShimmer(obj, 0x1e90ff, 0x00bfff, 900);
                this._addFloatingLabel(obj, '💧', 0);
            }
            // ─ 魔物: 紫パルス + 👾ラベル
            else if (n.includes('monster')) {
                this._addPulse(obj, 0x7b00ff, 0xda70d6, 800);
                this._addFloatingLabel(obj, '👾', 0);
            }
            // ─ 宝: 金グロー + 💎ラベル
            else if (n === 'treasure') {
                this._addGlow(obj, 0xffe066);
                this._addPulse(obj, 0xffd700, 0xffa500, 700);
                this._addFloatingLabel(obj, '💎', -10);
            }
            // ─ キャラクター: ラベル
            else if (n === 'character') {
                this._addCharacterLabel(obj);
            }
            // ─ ゲートウォール: 岩壁カラー
            else if (n.startsWith('gate_')) {
                if (obj.setFillStyle) obj.setFillStyle(0x708090);
                // 縞模様の見た目をテキストで代替
                this._addGateStripes(obj);
            }
            // ─ ピン: 明るい色
            else if (n.startsWith('pin_')) {
                if (obj.setFillStyle) obj.setFillStyle(0xf0e68c);
                // ピン上部の丸（頭）
                const head = this.add.circle(obj.x, obj.y - obj.height / 2 - 8, 10, 0xf0e68c).setDepth(15);
                obj.on('destroy', () => { if (head.active) head.destroy(); });
                // 引き抜きガイド矢印
                const arrow = this.add.text(obj.x, obj.y - obj.height / 2 - 30, '▲', {
                    fontSize: '20px', color: '#FFFF00', stroke: '#000', strokeThickness: 2
                }).setOrigin(0.5).setDepth(20);
                this.tweens.add({
                    targets: arrow, y: arrow.y - 10,
                    yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut'
                });
                obj.on('destroy', () => { if (arrow.active) arrow.destroy(); });
            }
        });

        // ─ 背景グラデーション風オーバーレイ
        this._addBackgroundDecor();
    }

    _addPulse(obj, color1, color2, duration) {
        let toggle = false;
        const fn = () => {
            if (!obj.active) return;
            toggle = !toggle;
            if (obj.setFillStyle) obj.setFillStyle(toggle ? color2 : color1);
        };
        const timer = this.time.addEvent({ delay: duration, callback: fn, loop: true });
        obj.on('destroy', () => timer.destroy());
    }

    _addShimmer(obj, color1, color2, duration) {
        const fn = () => {
            if (!obj.active) return;
            if (obj.setAlpha) {
                this.tweens.add({ targets: obj, alpha: 0.7, yoyo: true, duration: duration / 2, ease: 'Sine.easeInOut' });
            }
        };
        const timer = this.time.addEvent({ delay: duration, callback: fn, loop: true });
        obj.on('destroy', () => timer.destroy());
    }

    _addGlow(obj) {
        const glow = this.add.circle(obj.x, obj.y, (obj.width || 50) * 0.9, 0xffe066, 0.3).setDepth(obj.depth - 1);
        this.tweens.add({
            targets: glow, scaleX: 1.5, scaleY: 1.5, alpha: 0,
            yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut'
        });
        obj.on('destroy', () => { if (glow.active) glow.destroy(); });
    }

    _addFloatingLabel(obj, emoji, yOffset) {
        const lbl = this.add.text(obj.x, obj.y + yOffset, emoji, {
            fontSize: Math.min(obj.width || 40, obj.height || 40) * 0.7 + 'px'
        }).setOrigin(0.5).setDepth((obj.depth || 4) + 5);
        obj.setData('label_obj', lbl);

        // 位置を毎フレーム追従（動的オブジェクト対応）
        const followTimer = this.time.addEvent({
            delay: 16, loop: true,
            callback: () => {
                if (!obj.active || !lbl.active) { followTimer.destroy(); return; }
                lbl.setPosition(obj.x, obj.y + yOffset);
            }
        });
        obj.on('destroy', () => { if (lbl.active) lbl.destroy(); followTimer.destroy(); });
    }

    _addCharacterLabel(obj) {
        const face = this.add.text(obj.x, obj.y, '🧑', { fontSize: '28px' }).setOrigin(0.5).setDepth(20);
        const timer = this.time.addEvent({
            delay: 16, loop: true,
            callback: () => {
                if (!obj.active || !face.active) { timer.destroy(); return; }
                face.setPosition(obj.x, obj.y);
            }
        });
        obj.on('destroy', () => { if (face.active) face.destroy(); timer.destroy(); });
    }

    _addGateStripes(obj) {
        // ハッチング記号で「壁」感を演出
        const x = obj.x, y = obj.y - (obj.height || 100) / 2 + 20;
        const lbl = this.add.text(x, y, '⛩', { fontSize: '22px' }).setOrigin(0.5).setDepth((obj.depth || 3) + 2);
        obj.on('destroy', () => { if (lbl.active) lbl.destroy(); });
    }

    _addBackgroundDecor() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // 下段のグロウライン（地面のライン）
        const line = this.add.rectangle(w / 2, 695, w, 4, 0x6666aa, 0.5).setDepth(0);

        // ステージ番号の背景装飾
        const headerBg = this.add.rectangle(w / 2, 36, w, 52, 0x000000, 0.45).setDepth(998).setScrollFactor(0);
    }

    // ─────────────────────────────────────────────
    // クリア / 失敗
    // ─────────────────────────────────────────────

    _onStageClear() {
        if (this.isCleared) return;
        this.isCleared = true;
        console.log(`[PuzzleScene] Stage ${this.currentStage} CLEARED!`);

        this._playSe('clear');
        this.time.delayedCall(10, () => { if (this.matter.world) this.matter.world.pause(); });

        // キャラジャンプ演出
        if (this.character?.active) {
            this.tweens.add({ targets: this.character, y: this.character.y - 25, yoyo: true, duration: 200, repeat: 2 });
        }

        // 紙吹雪パーティクル代替
        for (let i = 0; i < 12; i++) {
            this.time.delayedCall(i * 60, () => {
                const dot = this.add.circle(
                    Phaser.Math.Between(100, this.cameras.main.width - 100),
                    Phaser.Math.Between(100, 300),
                    Phaser.Math.Between(4, 10),
                    Phaser.Display.Color.RandomRGB().color
                ).setDepth(900).setAlpha(0.9);
                this.tweens.add({ targets: dot, y: dot.y + 300, alpha: 0, duration: 900, onComplete: () => dot.destroy() });
            });
        }

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        // CLEAR 背景板
        const bg = this.add.rectangle(cx, cy - 60, 500, 120, 0x000000, 0.65).setDepth(999).setScale(0);
        // CLEAR テキスト
        const txt = this.add.text(cx, cy - 60, '✨ STAGE CLEAR! ✨', {
            fontSize: '44px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(1000).setAlpha(0).setScale(0.5);

        this.tweens.add({
            targets: [bg, txt], alpha: 1, scaleX: 1, scaleY: 1,
            duration: 500, ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    if (this.currentStage < this.totalStages) this._goToNextStage();
                    else this._onGameClear();
                });
            }
        });
    }

    _onStageFail() {
        if (this.isFailed) return;
        this.isFailed = true;
        console.log(`[PuzzleScene] Stage ${this.currentStage} FAILED!`);

        this._playSe('fail');
        this.cameras.main.shake(400, 0.014);
        this.time.delayedCall(10, () => { if (this.matter.world) this.matter.world.pause(); });

        // 赤フラッシュ
        const flash = this.add.rectangle(
            this.cameras.main.centerX, this.cameras.main.centerY,
            this.cameras.main.width, this.cameras.main.height, 0xff0000, 0.4
        ).setDepth(999);
        this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        const bg  = this.add.rectangle(cx, cy - 60, 420, 110, 0x000000, 0.65).setDepth(999).setScale(0);
        const txt = this.add.text(cx, cy - 60, '💀 FAILED...', {
            fontSize: '46px', color: '#FF4444', fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(1000).setAlpha(0);

        this.tweens.add({
            targets: [bg, txt], alpha: 1, scaleX: 1, scaleY: 1,
            duration: 400, ease: 'Power2',
            onComplete: () => {
                const retry = this.add.text(cx, cy + 20, '🔄  RETRY', {
                    fontSize: '34px', color: '#FFFFFF', fontFamily: 'Arial',
                    fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
                    backgroundColor: '#333333', padding: { x: 18, y: 8 }
                }).setOrigin(0.5).setDepth(1000).setInteractive({ useHandCursor: true });
                retry.on('pointerover', () => retry.setAlpha(0.8));
                retry.on('pointerout',  () => retry.setAlpha(1.0));
                retry.on('pointerdown', () => this._retryStage());
            }
        });
    }

    // ─────────────────────────────────────────────
    // ナビゲーション
    // ─────────────────────────────────────────────

    _goToNextStage() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ stage: this.currentStage + 1 }));
    }

    _retryStage() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ stage: this.currentStage }));
    }

    _onGameClear() {
        EngineAPI.fireGameFlowEvent('GAME_CLEAR');
    }

    // ─────────────────────────────────────────────
    // UI
    // ─────────────────────────────────────────────

    _createStageUI() {
        const w = this.cameras.main.width;

        // ステージ番号
        this.add.text(w / 2, 36, `STAGE  ${this.currentStage}  /  ${this.totalStages}`, {
            fontSize: '26px', color: '#FFFFFF', fontFamily: 'Arial',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(999).setScrollFactor(0);

        // リトライボタン
        const retryBtn = this.add.text(w - 20, 36, '🔄', { fontSize: '30px' })
            .setOrigin(1, 0.5).setDepth(999).setScrollFactor(0).setInteractive({ useHandCursor: true });
        retryBtn.on('pointerdown', () => { if (!this.isCleared && !this.isFailed) this._retryStage(); });
    }

    // ─────────────────────────────────────────────
    // サウンドユーティリティ
    // ─────────────────────────────────────────────

    _playSe(key) {
        try {
            const sm = this.registry.get('soundManager');
            if (sm && this.cache.audio.exists(key)) sm.playSe(key);
        } catch (e) { /* 未登録SE */ }
    }

    // ─────────────────────────────────────────────
    // ゲームループ
    // ─────────────────────────────────────────────

    update(time, delta) {
        if (this.isCleared || this.isFailed) return;
        super.update(time, delta);
        this._updateCharacterMovement();
        this._checkProximityReactions(); // トンネリング対策
    }
}
