// src/components/game/FlashEffect.js

export default class FlashEffect {
    /**
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.GameObject} gameObject - アタッチ先のオブジェクト
     * @param {object} params - エディタから設定されるパラメータ
     */
    constructor(scene, gameObject, params) {
        this.scene = scene;
        this.gameObject = gameObject;
        
        // ★ パラメータをプロパティとして保持
        this.texture = params.texture || 'spark';
        this.scale = params.scale || 1.0;
        this.duration = params.duration || 200;

        // ★★★ 衝突イベントをリッスンする ★★★
        // (BaseGameSceneが、onHitトリガーのイベントを発行してくれることを期待)
        this.gameObject.on('onHit', this.playEffect, this);
    }

    playEffect() {
        // [flash_effect]タグハンドラと、全く同じロジック
        const effect = this.scene.add.image(this.gameObject.x, this.gameObject.y, this.texture)
            .setScale(this.scale)
            .setDepth(this.gameObject.depth + 1)
            .setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: effect,
            alpha: { from: 1, to: 0 },
            duration: this.duration,
            onComplete: () => effect.destroy()
        });
    }

    destroy() {
        // ★ リスナーを必ず解除
        this.gameObject.off('onHit', this.playEffect, this);
    }
}

FlashEffect.define = {
    params: [
        { 
            key: 'texture',
            type: 'text',
            label: 'テクスチャ',
            defaultValue: 'spark'
        },
        { 
            key: 'scale',
            type: 'range',
            label: '拡大率',
            min: 0.1,
            max: 5,
            step: 0.1,
            defaultValue: 1.0
        },
        { 
            key: 'duration',
            type: 'range',
            label: '表示時間(ms)',
            min: 50,
            max: 2000,
            step: 50,
            defaultValue: 200
        }
    ]
};