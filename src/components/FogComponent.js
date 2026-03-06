// src/components/FogComponent.js

export default class FogComponent {

    constructor(scene, owner, params = {}) {
        this.scene = scene;
        this.gameObject = owner;
        this.fogRectangle = null; // エフェクト用のGraphicsオブジェクト
    }

    start() {
        // 画面全体を覆うGraphicsオブジェクトを作成
        this.fogRectangle = this.scene.add.graphics();
        
        // ★★★ 重要な設定 ★★★
        this.fogRectangle.setScrollFactor(0); // カメラに固定
        this.fogRectangle.setDepth(9999); // ビネットよりは奥、しかし他のUIよりは手前に配置

        this.applyParams(this.getCurrentParams());
    }

    update() {
        if (!this.fogRectangle) return;
        
        // 毎フレーム、最新のパラメータを取得して適用
        this.applyParams(this.getCurrentParams());
    }

    getCurrentParams() {
        const allCompsData = this.gameObject.getData('components') || [];
        const myData = allCompsData.find(c => c.type === 'FogComponent');
        
        const defaultParams = FogComponent.define.params.reduce((acc, p) => {
            acc[p.key] = p.defaultValue;
            return acc;
        }, {});

        return myData ? { ...defaultParams, ...myData.params } : defaultParams;
    }

    applyParams(params) {
        // 色と密度（アルファ値）を取得
        const color = Phaser.Display.Color.ValueToColor(params.color).color;
        const alpha = params.density;

        // Graphicsオブジェクトを再描画
        this.fogRectangle.clear(); // 以前の描画をクリア
        this.fogRectangle.fillStyle(color, alpha);
        this.fogRectangle.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
    toggle() { this.isEnabled = !this.isEnabled; } // toggleメソッドを追加


    destroy() {
        if (this.fogRectangle) {
            this.fogRectangle.destroy();
            this.fogRectangle = null;
        }
    }
}

FogComponent.define = {
    methods: ['enable', 'disable', 'toggle'],
    params: [
        { 
            key: 'color', 
            type: 'color', 
            label: 'Color', 
            defaultValue: '0x000000' // デフォルトは黒
        },
        { 
            key: 'density', 
            type: 'range', 
            label: 'Density', 
            min: 0, max: 1, step: 0.01, 
            defaultValue: 0.3 // デフォルトの濃さ
        },
    ]
};