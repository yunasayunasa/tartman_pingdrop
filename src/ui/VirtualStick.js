//
// Odyssey Engine - VirtualStick Component
// Final Version for { topOnly: false } environment
//

const Container = Phaser.GameObjects.Container;
const Graphics = Phaser.GameObjects.Graphics;
const Circle = Phaser.Geom.Circle;
const Vector2 = Phaser.Math.Vector2;

export default class VirtualStick extends Container {
    static dependencies = [];

    constructor(scene, config) {
        super(scene, config.x || 150, config.y || 550);

        this.pointerId = null; // 自分を操作している指のID
        this.baseRadius = 100;
        this.stickRadius = 50;
        this.direction = new Vector2(0, 0);

        // --- 見た目と当たり判定 ---
        const base = new Graphics(scene)
            .fillStyle(0x888888, 0.5)
            .fillCircle(0, 0, this.baseRadius);
        
        this.stick = new Graphics(scene)
            .fillStyle(0xcccccc, 0.8)
            .fillCircle(0, 0, this.stickRadius);
            
        this.add([base, this.stick]);
        
        // 当たり判定を、見た目と完全に一致する土台(base)に設定
        base.setInteractive(new Circle(0, 0, this.baseRadius), Circle.Contains);
        this.setScrollFactor(0);

        // --- イベントリスナー ---
        base.on('pointerdown', (pointer) => {
            // 誰も所有していなければ、この指が所有者になる
            if (this.pointerId === null) {
                this.pointerId = pointer.id;
                this.updateStickPosition(pointer);
            }
        });

        // シーン全体のmoveとupを監視し、所有者IDでフィルタリングする
        this.scene.input.on('pointermove', (pointer) => {
            if (pointer.id === this.pointerId) {
                this.updateStickPosition(pointer);
            }
        });

        this.scene.input.on('pointerup', (pointer) => {
            // 自分を所有していた指が離された場合のみ、リセット
            if (pointer.id === this.pointerId) {
                this.pointerId = null; // 所有権を解放
                this.reset();
            }
        });

        // シーン終了時にグローバルリスナーを安全に解除
        this.scene.events.on('shutdown', () => {
             if (this.scene && this.scene.input) {
                this.scene.input.off('pointermove', this.onPointerMove, this); // メソッド参照を渡すのがより安全
                this.scene.input.off('pointerup', this.onPointerUp, this);
             }
        }, this);

        scene.add.existing(this);
    }

    updateStickPosition(pointer) {
        const localX = pointer.x - this.x;
        const localY = pointer.y - this.y;
        const vec = new Vector2(localX, localY);
        const distance = vec.length();

        if (distance > this.baseRadius) {
            vec.normalize().scale(this.baseRadius);
        }

        this.stick.setPosition(vec.x, vec.y);
        this.direction.x = Phaser.Math.Clamp(vec.x / this.baseRadius, -1, 1);
        this.direction.y = Phaser.Math.Clamp(vec.y / this.baseRadius, -1, 1);
    }

    reset() {
        this.stick.setPosition(0, 0);
        this.direction.setTo(0, 0);
    }
    
    // --- PlayerControllerが参照するためのゲッター ---
    get isLeft() { return this.direction.x < -0.5; }
    get isRight() { return this.direction.x > 0.5; }
    get isUp() { return this.direction.y < -0.5; }
    get isDown() { return this.direction.y > 0.5; }
}