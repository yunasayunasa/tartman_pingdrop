// src/components/LightComponent.js

export default class LightComponent {

    constructor(scene, owner, params = {}) {
        this.scene = scene;
        this.gameObject = owner;
        this.lightSprite = null;
        this.lastTextureKey = null; // テクスチャの再生成を制御するためのフラグ
    }

    start() {
        // start時点ではスプライトの器だけ作る
        this.lightSprite = this.scene.add.image(this.gameObject.x, this.gameObject.y, '__DEFAULT');
        this.lightSprite.setBlendMode('ADD');
        this.lightSprite.setDepth(this.gameObject.depth + 1);

        // 初回更新
        this.update();
    }

    update() {
        if (!this.gameObject.scene) return;

        const params = this.getCurrentParams();
        
        // 1. 光源テクスチャを生成・更新
        this.updateTexture(params);

        // 2. 光源スプライトのプロパティを適用
        this.applyParams(params);

        // 3. 光源の位置と角度を親オブジェクトに追従
        this.updateTransform(params);
    }

    getCurrentParams() {
        const allCompsData = this.gameObject.getData('components') || [];
        const myData = allCompsData.find(c => c.type === 'LightComponent');
        
        const defaultParams = LightComponent.define.params.reduce((acc, p) => {
            acc[p.key] = p.defaultValue;
            return acc;
        }, {});

        return myData ? { ...defaultParams, ...myData.params } : defaultParams;
    }

    // in LightComponent.js

updateTexture(params) {
    let textureKey;
    const radius = Math.max(1, params.radius);

    if (params.type === 'spot') {
        const coneAngle = Phaser.Math.Clamp(params.coneAngle, 1, 359); // 角度を安全な範囲に
        textureKey = `spotlight_texture_${radius}_${coneAngle}`; // ★ グラデーションをやめ、シンプルなテクスチャ名に
    } else { // 'point'
        textureKey = `light_gradient_${radius}`;
    }

    if (this.lastTextureKey === textureKey) {
        return;
    }

    if (!this.scene.textures.exists(textureKey)) {
        const graphics = this.scene.make.graphics();
        const diameter = radius * 2;

        if (params.type === 'spot') {
            // --- ▼▼▼ スポットライト描画ロジック修正 ▼▼▼ ---
            const coneRadian = Phaser.Math.DegToRad(params.coneAngle / 2);

            // 1. まず真っ白な扇形を描画する
            graphics.fillStyle(0xffffff, 1.0);
            graphics.slice(radius, radius, radius, -coneRadian, coneRadian, false);
            graphics.fillPath();

            // 2. (オプション) 縁を少しぼかすための簡単なグラデーション
            //    PhaserのGraphicsだけでは綺麗な放射状グラデーションは難しいので、
            //    まずは単色で確実に表示させることを優先します。
            
        } else { // 'point'
            graphics.fillStyle(0xffffff, 1.0);
            graphics.fillCircle(radius, radius, radius);
        }
        graphics.generateTexture(textureKey, diameter, diameter);
        graphics.destroy();
    }

    this.lightSprite.setTexture(textureKey);
    // スポットライトの場合、テクスチャの中心が扇の頂点になるように原点を設定
    if (params.type === 'spot') {
        this.lightSprite.setOrigin(0.5, 0.5);
    } else {
        this.lightSprite.setOrigin(0.5, 0.5);
    }
    this.lastTextureKey = textureKey;
}

    applyParams(params) {
        if (!this.lightSprite) return;

        const newColor = Phaser.Display.Color.ValueToColor(params.color).color;
        if (this.lightSprite.tintTopLeft !== newColor) {
            this.lightSprite.setTint(newColor);
        }

        if (this.lightSprite.alpha !== params.intensity) {
            this.lightSprite.setAlpha(params.intensity);
        }
    }
    
    updateTransform(params) {
        if (!this.lightSprite) return;
        
        const offset = new Phaser.Math.Vector2(params.offsetX, params.offsetY).rotate(Phaser.Math.DegToRad(this.gameObject.angle));
        this.lightSprite.x = this.gameObject.x + offset.x;
        this.lightSprite.y = this.gameObject.y + offset.y;
        
        if (params.type === 'spot') {
            const baseAngle = params.angle;
            this.lightSprite.angle = this.gameObject.angle + baseAngle;

            if (this.gameObject.flipX) {
                this.lightSprite.angle = this.gameObject.angle - baseAngle + 180;
            }
        } else {
            this.lightSprite.angle = 0; // ポイントライトは回転しない
        }
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
    toggle() { this.isEnabled = !this.isEnabled; } // toggleメソッドを追加

    destroy() {
        if (this.lightSprite) {
            this.lightSprite.destroy();
            this.lightSprite = null;
        }
    }
}

LightComponent.define = {
    methods: ['enable', 'disable', 'toggle'],
    params: [
        { key: 'type', type: 'select', label: 'Type', options: ['point', 'spot'], defaultValue: 'point' },
        { key: 'color', type: 'color', label: 'Color', defaultValue: '0xffffff' },
        { key: 'radius', type: 'range', label: 'Radius', min: 0, max: 1000, step: 10, defaultValue: 100 },
        { key: 'intensity', type: 'range', label: 'Intensity', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
        { key: 'offsetX', type: 'range', label: 'Offset X', min: -200, max: 200, step: 1, defaultValue: 0 },
        { key: 'offsetY', type: 'range', label: 'Offset Y', min: -200, max: 200, step: 1, defaultValue: 0 },
        // --- Spot Light Only Params ---
        { key: 'angle', type: 'range', label: 'Angle (Spot)', min: -180, max: 180, step: 1, defaultValue: 0 },
        { key: 'coneAngle', type: 'range', label: 'Cone (Spot)', min: 1, max: 180, step: 1, defaultValue: 45 },
    ]
};