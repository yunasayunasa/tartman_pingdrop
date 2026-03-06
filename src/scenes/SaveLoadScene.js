export default class SaveLoadScene extends Phaser.Scene {
    constructor() {
        // このシーンは launch で呼ばれるので、active:true は不要
        super('SaveLoadScene');
        this.mode = 'load'; // デフォルトはロードモード
    }

    init(data) {
        // UISceneから渡されたモードを受け取る
        this.mode = data.mode;
    }

    create() {
            this.scene.bringToTop();

        // 背景を少し暗くして、UIが目立つようにする
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0, 0);
        
        // モードに応じてタイトルを変更
        const titleText = this.mode === 'save' ? 'セーブ' : 'ロード';
        this.add.text(this.scale.width / 2, 100, titleText, { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        // 戻るボタン
        const backButton = this.add.text(this.scale.width - 100, 50, '戻る', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        backButton.on('pointerdown', () => {
            this.scene.stop(); // このシーンを停止
            this.scene.resume('GameScene'); // GameSceneを再開
        });

        // --- セーブスロットを表示 ---
        const slots = 5;
        for (let i = 1; i <= slots; i++) {
            const y = 200 + ((i-1) * 150);
            
            const slotBg = this.add.rectangle(this.scale.width / 2, y, 600, 120, 0xffffff, 0.1).setInteractive();
            
            const saveData = localStorage.getItem(`save_data_${i}`);
            let text = `スロット ${i}\n`;
            text += saveData ? JSON.parse(saveData).saveDate : '(空)';
            
            this.add.text(this.scale.width / 2, y, text, { fontSize: '28px', fill: '#fff', align: 'center' }).setOrigin(0.5);

            // スロットがクリックされた時の処理
                  // スロットがクリックされた時の処理
            slotBg.on('pointerdown', () => {
                const gameScene = this.scene.get('GameScene');
                
                if (this.mode === 'save') {
                    gameScene.performSave(i);
                    this.scene.stop();
                    // ★★★ セーブ後も、GameSceneを再開する ★★★
                    this.scene.resume('GameScene');

                } else { // 'load'モードの場合
                    if (saveData) {
                        gameScene.performLoad(i);
                        this.scene.stop();
                        // ★★★ ロード後も、GameSceneを再開する ★★★
                        // performLoadはシーンを再構築し、シナリオを1行パースするだけ。
                        // その後のクリックイベントなどを受け付けるために、シーン自体の再開が必要。
                        this.scene.resume('GameScene'); 
                    } else {
                        // console.log(`スロット${i}は空なのでロードできません。`);
                    }
                }
            });
// ...
        }
    }
}