export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super('LoadingScene');
    }

    init(data) {
        this.assetsToLoad = data.assets || [];
        this.onCompleteCallback = data.onComplete || (() => {});
    }

    preload() {
        if (this.assetsToLoad.length === 0) {
            // ロードするものがなければ、すぐに完了処理へ
            this.onCompleteCallback();
            this.scene.stop();
            return;
        }
        
        // --- UI作成 ---
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8).fillRect(340, 320, 600, 50);
        const percentText = this.add.text(640, 345, '0%', { fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);
        this.add.text(640, 280, 'Now Loading...', { fontSize: '36px', fill: '#ffffff' }).setOrigin(0.5);

        // --- ロードイベント監視 ---
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear().fillStyle(0xffffff, 1).fillRect(350, 330, 580 * value, 30);
        });
        this.load.on('complete', () => {
            this.onCompleteCallback();
            this.scene.stop();
        });

        // --- ロード実行 ---
        this.assetsToLoad.forEach(asset => {
            // ★★★ typeが'sound'ではなく'audio'であることに注意 ★★★
            if (asset.type === 'image' || asset.type === 'audio') {
                this.load[asset.type](asset.key, asset.path);
            }
        });
    }
}