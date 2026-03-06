// src/components/VignetteComponent.js

export default class VignetteComponent {

    constructor(scene, owner, params = {}) {
        this.scene = scene;
        this.gameObject = owner; // アタッチされたオブジェクト（位置は使わない）
        this.vignetteImage = null; // エフェクト用のImageオブジェクト
    }

    start() {
        const currentParams = this.getCurrentParams();
        const texture = currentParams.texture;

        // 必須パラメータのチェック
        if (!texture) {
            console.error("[VignetteComponent] 'texture' parameter is required.");
            return;
        }

        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;

        this.vignetteImage = this.scene.add.image(centerX, centerY, texture);
        this.vignetteImage.setScrollFactor(0); // ★ カメラに固定
        this.vignetteImage.setDepth(10000); // 常に最前面
        
        this.applyParams(currentParams);
    }

    update() {
        if (!this.vignetteImage) return;
        
        // 毎フレーム、最新のパラメータを取得して適用
        const currentParams = this.getCurrentParams();
        this.applyParams(currentParams);
    }

    getCurrentParams() {
        const allCompsData = this.gameObject.getData('components') || [];
        const myData = allCompsData.find(c => c.type === 'VignetteComponent');
        
        const defaultParams = VignetteComponent.define.params.reduce((acc, p) => {
            acc[p.key] = p.defaultValue;
            return acc;
        }, {});

        return myData ? { ...defaultParams, ...myData.params } : defaultParams;
    }

    applyParams(params) {
        if (this.vignetteImage.alpha !== params.intensity) {
            this.vignetteImage.setAlpha(params.intensity);
        }
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
    toggle() { this.isEnabled = !this.isEnabled; } // toggleメソッドを追加


    destroy() {
        if (this.vignetteImage) {
            this.vignetteImage.destroy();
            this.vignetteImage = null;
        }
    }
}

VignetteComponent.define = {
    methods: ['enable', 'disable', 'toggle'],
    params: [
        { 
            key: 'texture', 
            type: 'asset_key', 
            assetType: 'image', // アセットブラウザの'image'カテゴリから選択
            label: 'Texture', 
            defaultValue: 'vignette_overlay' 
        },
        { 
            key: 'intensity', 
            type: 'range', 
            label: 'Intensity', 
            min: 0, max: 1, step: 0.01, 
            defaultValue: 0.8 
        },
    ]
};