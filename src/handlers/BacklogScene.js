export default class BacklogScene extends Phaser.Scene {
    constructor() {
        super('BacklogScene');
        // ★ stateManager は create で取得するので、ここでは null のままでOK
        this.stateManager = null;
    }

    create() {
        // GameSceneからStateManagerインスタンスへの参照を取得
        const gameScene = this.scene.get('GameScene');
        // ★ 万が一 GameScene がない場合を考慮（堅牢化）
        if (!gameScene || !gameScene.stateManager) {
            console.error("BacklogScene: GameSceneまたはStateManagerが見つかりません。");
            this.scene.stop();
            return;
        }
        this.stateManager = gameScene.stateManager;
        
        // --- UIのセットアップ ---
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.9).setOrigin(0, 0);
        this.add.text(this.scale.width / 2, 60, 'バックログ', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        const backButton = this.add.text(this.scale.width - 100, 50, '戻る', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        backButton.on('pointerdown', () => {
            this.scene.stop();
            // GameSceneやUISceneがpause状態ならresumeする
            if (this.scene.isPaused('GameScene')) this.scene.resume('GameScene');
            if (this.scene.isPaused('UIScene')) this.scene.resume('UIScene');
        });

        // --- 履歴の表示 ---
        // ★★★ 修正箇所: getState() を使わず、sf.history に直接アクセスする ★★★
        const history = this.stateManager.sf.history || [];
        
        let y = this.scale.height - 100;

        // 履歴を逆順（新しいものが下）にループ
        [...history].reverse().forEach(log => {
            let lineText = '';
            
            if (log.speaker) {
                // キャラクター定義は GameScene が持っている
                const charaDef = gameScene.charaDefs[log.speaker];
                const speakerName = charaDef && charaDef.jname ? charaDef.jname : log.speaker;
                lineText += `【${speakerName}】\n`;
            }
            
            // dialogueプロパティの存在をチェック（堅牢化）
            lineText += log.dialogue || "";

            const textObject = this.add.text(this.scale.width / 2, y, lineText, {
                fontSize: '28px',
                fill: '#fff',
                wordWrap: { width: this.scale.width - 120 }, // 左右に60pxのマージン
                align: 'left'
            }).setOrigin(0.5, 1);
            
            y -= textObject.getBounds().height + 20;

            // 画面上部にはみ出したらループを抜ける（パフォーマンス向上）
            if (y < 120) {
                return;
            }
        });
    }
}