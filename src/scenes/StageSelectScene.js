// src/scenes/StageSelectScene.js
// ステージ選択画面

export default class StageSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StageSelectScene' });
        this.TOTAL_STAGES = 20;
    }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        // 背景
        this.add.rectangle(W / 2, H / 2, W, H, 0x0d1224);

        // タイトルヘッダー
        this.add.rectangle(W / 2, 48, W, 76, 0x000000, 0.55).setDepth(5);
        this.add.text(W / 2, 48, '📋  SELECT STAGE', {
            fontSize: '38px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(6);

        // 総合スター表示
        const totalStars = this._getTotalStars();
        const maxStars = this.TOTAL_STAGES * 3;
        this.add.text(W - 20, 48, `⭐ ${totalStars} / ${maxStars}`, {
            fontSize: '24px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(1, 0.5).setDepth(6);

        // ステージグリッド描画（5列×4行）
        const cols = 5;
        const rows = Math.ceil(this.TOTAL_STAGES / cols);
        const cellW = 210;
        const cellH = 130;
        const startX = W / 2 - (cols * cellW) / 2 + cellW / 2;
        const startY = 130;

        for (let i = 0; i < this.TOTAL_STAGES; i++) {
            const stage = i + 1;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = startX + col * cellW;
            const cy = startY + row * cellH;

            this._drawStageCard(cx, cy, stage, cellW - 20, cellH - 16);
        }

        // フェードイン
        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    _getTotalStars() {
        let total = 0;
        for (let i = 1; i <= this.TOTAL_STAGES; i++) {
            total += parseInt(localStorage.getItem(`pinpuzzle_stars_${i}`) || '0', 10);
        }
        return total;
    }

    _drawStageCard(cx, cy, stage, w, h) {
        const stars = parseInt(localStorage.getItem(`pinpuzzle_stars_${stage}`) || '0', 10);
        const cleared = stars > 0;

        // カード背景
        const bg = this.add.rectangle(cx, cy, w, h, cleared ? 0x1a3a5c : 0x1a1a2e, 0.95)
            .setStrokeStyle(2, cleared ? 0x3a8abf : 0x444466)
            .setInteractive({ useHandCursor: true })
            .setDepth(2);

        // ホバーエフェクト
        bg.on('pointerover', () => {
            bg.setFillStyle(cleared ? 0x245c8a : 0x2a2a4e, 0.95);
            numText.setScale(1.1);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(cleared ? 0x1a3a5c : 0x1a1a2e, 0.95);
            numText.setScale(1.0);
        });
        bg.on('pointerdown', () => this._startStage(stage));

        // ステージ番号
        const numText = this.add.text(cx, cy - 18, `${stage}`, {
            fontSize: '42px', color: cleared ? '#FFFFFF' : '#8888aa',
            fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(3);

        // スター表示
        if (cleared) {
            const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
            this.add.text(cx, cy + 28, starStr, {
                fontSize: '22px'
            }).setOrigin(0.5).setDepth(3);
        } else {
            this.add.text(cx, cy + 25, 'LOCKED', {
                fontSize: '18px', color: '#556688', fontFamily: 'Arial', fontStyle: 'italic'
            }).setOrigin(0.5).setDepth(3);
        }
    }

    _startStage(stage) {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('PuzzleScene', { stage });
        });
    }
}
