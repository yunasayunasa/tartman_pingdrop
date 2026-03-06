// src/ui/Button.js (最終FIX版)

const Container = Phaser.GameObjects.Container;
const Graphics = Phaser.GameObjects.Graphics;
const Text = Phaser.GameObjects.Text;

export default class Button extends Container {

    constructor(scene, params) {
        // --- 1. パラメータから設定値を取得 ---
        const x = params.x || 0;
        const y = params.y || 0;
        const label = params.label || 'Button';
        const shape = params.shape || 'rounded_rect';
        const backgroundColor = params.backgroundColor || 0x555555;
        
        super(scene, x, y);

        // --- 2. まず、テキストオブジェクトを生成する ---
        this.textObject = new Text(scene, 0, 0, label, { 
            fontSize: '24px', 
            fontStyle: 'bold', 
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // ★★★ getMetrics()の代替案 ★★★
        // テキストオブジェクトが持つ width と height プロパティを直接使う
        const textWidth = this.textObject.width;
        const textHeight = this.textObject.height;

        // --- 3. テキストのサイズを元に、背景のサイズを決定 ---
        const width = textWidth + 40; // 左右の余白
        const height = textHeight + 20; // 上下の余白

        // --- 4. 見た目を描画 ---
        this.background = new Graphics(scene);
        this.updateBackground(shape, width, height, backgroundColor);
            
        this.add([this.background, this.textObject]);

        // --- 5. 当たり判定とインタラクティブ設定 ---
        this.setSize(width, height);
        this.setInteractive();
        
        // --- 6. イベントリスナー ---
        this.on('pointerdown', () => {
            // モード判定はしない！ とにかく'onClick'を発火させる
            this.emit('onClick', this);
            this.scene.tweens.add({ targets: this, scale: 0.95, duration: 80, yoyo: true });
        });
        
        this.on('pointerover', () => this.background.setAlpha(1));
        this.on('pointerout', () => this.background.setAlpha(0.8));
    }
    
    /**
     * EditorPluginからラベルテキストを変更されたときに呼ばれるメソッド
     */
    setText(newText) {
        this.textObject.setText(newText);
        
        // テキストの更新に合わせて、背景と当たり判定のサイズも更新する
        const textWidth = this.textObject.width;
        const textHeight = this.textObject.height;
        const newWidth = textWidth + 40;
        const newHeight = textHeight + 20;

        this.updateBackground(this.shape, newWidth, newHeight, this.backgroundColor);
        this.setSize(newWidth, newHeight);
        
        // インタラクティブエリアも更新
        this.setInteractive();
    }
     /** ★★★ 新規メソッド：スケールを変更する ★★★ */
    setVisualScale(scaleX, scaleY) {
        // コンテナ自体のスケールを変更
        this.setScale(scaleX, scaleY ?? scaleX); // YがなければXと同じ値を使う
    }
    
    /** ★★★ 新規メソッド：背景テクスチャを変更する ★★★ */
    setBackgroundTexture(textureKey) {
        // Graphicsではなく、Imageを背景として使っている場合
        // if (this.background instanceof Phaser.GameObjects.Image) {
        //     this.background.setTexture(textureKey);
        // }
        // Graphicsを使っている場合は、色を変えるのが一般的
        // この機能は、ボタンの構造によって実装が変わります
    }
    /**
     * ★★★ 新規ヘルパーメソッド ★★★
     * 背景の形状を描画する処理を、再利用可能なメソッドとして分離
     */
    updateBackground(shape, width, height, color) {
        this.shape = shape; // 形状を記憶
        this.backgroundColor = color; // 色を記憶

        this.background.clear().fillStyle(color, 0.8);

        if (shape === 'circle') {
            const radius = Math.max(width, height) / 2;
            this.background.fillCircle(0, 0, radius);
        } else { // rounded_rect
            this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        }
    }
}