//
// Odyssey Engine - Scrollable Component (Camera Control Version)
// Attached to the player, it scrolls the camera instead of moving the player.
//

export default class Scrollable {
    
    /**
     * @param {Phaser.Scene} scene - このコンポーネントが属するシーン
     * @param {Phaser.GameObjects.GameObject} target - このコンポーネントがアタッチされるオブジェクト (通常はプレイヤー)
     * @param {object} [params={}] - パラメータ
     */
    constructor(scene, target, params = {}) {
        this.scene = scene;
        this.gameObject = target; // ★★★ this.target を this.gameObject に変更 ★★★
        this.camera = scene.cameras.main;

        // --- パラメータ設定 ---
        this.scrollZoneLeft = params.scrollZoneLeft !== undefined ? params.scrollZoneLeft : 0.4;
        this.scrollZoneRight = params.scrollZoneRight !== undefined ? params.scrollZoneRight : 0.6;
    }

    /**
     * JumpSceneのupdateループから、毎フレーム呼び出される
     */
    update() {
        // ★★★ this.target を this.gameObject に変更 ★★★
        if (!this.gameObject || !this.gameObject.body || !this.gameObject.active) {
            return;
        }

        // ★★★ this.target を this.gameObject に変更 ★★★
        const targetScreenX = this.gameObject.x - this.camera.scrollX;
        const screenWidth = this.camera.width;

        const leftBoundary = screenWidth * this.scrollZoneLeft;
        const rightBoundary = screenWidth * this.scrollZoneRight;

        if (targetScreenX > rightBoundary) {
            const scrollAmount = targetScreenX - rightBoundary;
            this.camera.scrollX += scrollAmount;
        } 
        else if (targetScreenX < leftBoundary) {
            const scrollAmount = targetScreenX - leftBoundary;
            this.camera.scrollX += scrollAmount;
        }
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
    toggle() { this.isEnabled = !this.isEnabled; } // toggleメソッドを追加

}
Scrollable.define = {
    methods: ['enable', 'disable', 'toggle'],
    params: [
        { 
            key: 'speed',
            type: 'range', // UIはスライダー
            label: 'speed',
            min: -20,
            max: 20,
            step: 0.5,
            defaultValue: -5
        }
    ]
};