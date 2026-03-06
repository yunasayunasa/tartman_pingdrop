// src/scenes/BacklogScene.js (スクロール対応版)

export default class BacklogScene extends Phaser.Scene {
    constructor() {
        super('BacklogScene');
        this.stateManager = null;
    }

    create() {
            this.scene.bringToTop();

        const gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.stateManager) {
            console.error("BacklogScene: GameSceneまたはStateManagerが見つかりません。");
            this.scene.stop();
            return;
        }
        this.stateManager = gameScene.stateManager;
        
        // --- UIのセットアップ (ヘッダーとフッター) ---
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.9).setOrigin(0, 0);
        this.add.text(this.scale.width / 2, 60, 'バックログ', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        const backButton = this.add.text(this.scale.width - 100, 50, '戻る', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        
        backButton.on('pointerdown', () => {
            this.scene.stop();
            if (this.scene.isPaused('GameScene')) this.scene.resume('GameScene');
            if (this.scene.isPaused('UIScene')) this.scene.resume('UIScene');
        });

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここからがスクロール機能の核心 ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★

        // --- 1. スクロール可能なエリアを定義 ---
        const scrollAreaY = 120; // ヘッダーの下から
        const scrollAreaHeight = this.scale.height - 180; // フッターの上まで

        // --- 2. 全ての履歴を入れるための、縦長のコンテナを作成 ---
        const logContainer = this.add.container(0, 0);

        // --- 3. 履歴をコンテナに追加していく ---
        const history = this.stateManager.sf.history || [];
        let currentY = 0; // コンテナ内のY座標

        // 履歴を「上から下へ」（古いものが上）の順で追加
        history.forEach(log => {
            let lineText = '';
            
            if (log.speaker) {
                const charaDef = gameScene.charaDefs[log.speaker];
                const speakerName = charaDef && charaDef.jname ? charaDef.jname : log.speaker;
                lineText += `【${speakerName}】\n`;
            }
            lineText += log.dialogue || "";

            const textObject = this.add.text(this.scale.width / 2, currentY, lineText, {
                fontSize: '28px',
                fill: '#fff',
                wordWrap: { width: this.scale.width - 120 },
                align: 'left'
            }).setOrigin(0.5, 0); // ★ Originを(0.5, 0)に設定 (上揃え)
            
            logContainer.add(textObject);

            currentY += textObject.getBounds().height + 30; // 次のテキストの位置を下にずらす
        });

        // コンテナの全体の高さを取得
        const containerHeight = currentY;

        // --- 4. マスクを作成して適用 ---
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.beginPath();
        maskShape.fillRect(0, scrollAreaY, this.scale.width, scrollAreaHeight);
        const mask = maskShape.createGeometryMask();
        logContainer.setMask(mask);
        
        // --- 5. スクロール処理を実装 ---
        let startY = 0;
        let startContainerY = 0;
        let isDragging = false;
        
        // スクロールエリアに透明な操作ゾーンを設置
        const zone = this.add.zone(0, scrollAreaY, this.scale.width, scrollAreaHeight).setOrigin(0).setInteractive();

        zone.on('pointerdown', (pointer) => {
            isDragging = true;
            startY = pointer.y;
            startContainerY = logContainer.y;
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const dy = pointer.y - startY;
                logContainer.y = startContainerY + dy;
            }
        });
        
        this.input.on('pointerup', () => {
            isDragging = false;
        });

        // マウスホイールでのスクロール (PC向け)
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            logContainer.y -= deltaY * 0.5;
        });

        // --- 6. コンテナの移動範囲を制限 ---
        this.events.on('update', () => {
            const upperLimit = 0;
            const lowerLimit = -(containerHeight - scrollAreaHeight);
            
            // 下限より下に行き過ぎないように
            if (logContainer.y < lowerLimit && containerHeight > scrollAreaHeight) {
                logContainer.y = lowerLimit;
            }
            // 上限より上に行き過ぎないように
            if (logContainer.y > upperLimit) {
                logContainer.y = upperLimit;
            }
        });
    }
}
