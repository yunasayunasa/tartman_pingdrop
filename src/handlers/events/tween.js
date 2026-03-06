// src/handlers/events/tween.js

/**
 * [tween] アクションタグ
 * ターゲットのプロパティを、時間をかけて変化（アニメーション）させます。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target
 * @returns {Promise<void>} Tween完了時に解決されるPromise
 */
export default async function tween(interpreter, params, target) {
    return new Promise(resolve => {
        const scene = interpreter.scene;
        if (!target || !scene || !scene.tweens) {
            resolve();
            return;
        }

        const tweenConfig = {
            targets: target,
            duration: parseInt(params.time, 10) || 1000,
            ease: params.ease || 'Linear',
            yoyo: params.yoyo === 'true',
            loop: params.loop ? parseInt(params.loop) : 0,
        };
        
        const prop = params.property;
        if (!prop || params.to === undefined) {
            console.warn('[tween] "property" and "to" parameters are required.');
            resolve();
            return;
        }

        // ▼▼▼【ここが、Tint対応の新しいロジックです】▼▼▼
        // --------------------------------------------------------------------
        
        // ★ ケース1: プロパティが 'tint' の場合 ★
        if (prop === 'tint') {
            if (typeof target.setTintFill !== 'function') {
                console.warn(`[tween] Target '${target.name}' does not support tint.`);
                resolve();
                return;
            }
            
            // 色をアニメーションさせるための特殊な設定
            const startColor = Phaser.Display.Color.ValueToColor(target.tintTopLeft);
            const endColor = Phaser.Display.Color.ValueToColor(params.to);

            tweenConfig.onUpdate = (tween) => {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(startColor, endColor, 100, tween.progress * 100);
                const colorInt = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
                target.setTint(colorInt);
            };

        } 
        // ★ ケース2: 通常のプロパティの場合 ★
        else {
            tweenConfig[prop] = parseFloat(params.to);
        }
        
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        tweenConfig.onComplete = () => {
            if (tweenConfig.loop !== -1) {
                target.clearTint(); // ★ 念のため、終わったらTintをクリア
                resolve();
            }
        };

        scene.tweens.add(tweenConfig);

        if (tweenConfig.loop === -1) {
            resolve();
        }
    });
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
// in src/handlers/events/tween.js

/**
 * ★ VSLエディタ用の自己定義 (タスク2 適用版) ★
 */
tween.define = {
    description: 'ターゲットのプロパティをアニメーションさせます。propertyに"tint", toに"0xff0000"で色を赤にできます。',
    params: [
        { 
            key: 'property', 
            // ▼▼▼【ここが修正の核心です】▼▼▼
            type: 'select', 
            options: [
                'x', 
                'y', 
                'alpha', 
                'scale', // scaleXとscaleYを同時に変更
                'scaleX', 
                'scaleY', 
                'angle', 
                'tint'  // 特別対応済みのtint
            ],
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
            label: 'プロパティ', 
            defaultValue: 'alpha' 
        },
        { key: 'to', type: 'string', label: '目標値', defaultValue: '0' },
        { key: 'time', type: 'number', label: '時間(ms)', defaultValue: 1000 },
        { key: 'ease', type: 'string', label: 'イージング', defaultValue: 'Linear' },
        { key: 'yoyo', type: 'select', options: ['true', 'false'], label: 'ヨーヨー再生', defaultValue: 'false' }, // デフォルト値を文字列に
        { key: 'loop', type: 'number', label: 'ループ回数(-1で無限)', defaultValue: 0 }
    ]
};