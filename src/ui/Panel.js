// src/ui/Panel.js (新規作成)
export default class Panel extends Phaser.GameObjects.Rectangle {
    constructor(scene, { x, y, width, height, color = 0x000000, alpha = 0.7, strokeColor = 0xffffff, strokeWidth = 2 }) {
        super(scene, x, y, width, height, color, alpha);
        this.setStrokeStyle(strokeWidth, strokeColor, 1);
        this.setOrigin(0.5);
    }
}