// src/handlers/events/set_flip_x.js

/**
 * [set_flip_x] アクションタグ
 * ターゲットオブジェクトの左右を反転させます。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target
 */
export default async function set_flip_x(interpreter, params, target) {
    if (target && typeof target.setFlipX === 'function') {
        const shouldFlip = (params.value === 'true');
        target.setFlipX(shouldFlip);
    } else {
        const targetName = target ? target.name : 'unknown';
        console.warn(`[set_flip_x] Target '${targetName}' cannot be flipped.`);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
set_flip_x.define = {
    description: 'ターゲットの左右の向きを反転させます。',
    params: [
        { key: 'value', type: 'select', options: ['true', 'false'], label: '反転する', defaultValue: true }
    ]
};