//
// Odyssey Engine - JumpButton Component
// Final Version for { topOnly: false } environment
//

const Container = Phaser.GameObjects.Container;
const Graphics = Phaser.GameObjects.Graphics;
const Text = Phaser.GameObjects.Text;
const Circle = Phaser.Geom.Circle;

export default class JumpButton extends Container {
    static dependencies = [];

    constructor(scene, config) {
        super(scene, config.x || 1100, config.y || 550);
        
        const radius = 65;
        
        // --- 見た目と当たり判定 ---
        const background = new Graphics(scene)
            .fillStyle(0xcccccc, 0.7)
            .fillCircle(0, 0, radius);
            
        this.background_pressed = new Graphics(scene)
            .fillStyle(0x888888, 0.8)
            .fillCircle(0, 0, radius)
            .setVisible(false);

        const label = new Text(scene, 0, 0, 'A', { 
            fontSize: '32px', fontStyle: 'bold', color: '#111111', align: 'center' 
        }).setOrigin(0.5);
        
        this.add([background, this.background_pressed, label]);

        background.setInteractive(new Circle(0, 0, radius), Circle.Contains);
        this.setScrollFactor(0);
        
        // --- イベントリスナー ---
        // 複雑なポインターID管理は不要。押されたら信号を送るだけ。
        background.on('pointerdown', () => {
            this.background_pressed.setVisible(true);
            this.emit('button_pressed');
        });

        // 押下状態の解除は、自分自身のupとoutだけで完結させる
        background.on('pointerup', () => {
            this.background_pressed.setVisible(false);
        });
        background.on('pointerout', () => {
            this.background_pressed.setVisible(false);
        });

        scene.add.existing(this);
    }
}