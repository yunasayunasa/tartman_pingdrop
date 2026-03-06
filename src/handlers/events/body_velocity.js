// src/handlers/events/body_velocity.js

/**
 * [body_velocity] アクションタグ
 * ターゲットの物理ボディの速度（Velocity）を直接設定します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target
 */
export default async function body_velocity(interpreter, params, target) {
    if (target && target.body) {
        // ★ Phaser 3.60では、setVelocityは非推奨。body.velocityに直接代入する。
        const body = target.body;
        const currentVelocity = body.velocity;
        
        const x = params.x !== undefined ? Number(params.x) : currentVelocity.x;
        const y = params.y !== undefined ? Number(params.y) : currentVelocity.y;
        
        target.setVelocity(x, y); // setVelocityはまだ使えますが、直接代入が推奨
        // または: Matter.Body.setVelocity(body, { x: x, y: y });
    } else {
        const targetName = target ? target.name : 'unknown';
        console.warn(`[body_velocity] Target '${targetName}' has no physics body.`);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
body_velocity.define = {
    description: '物理ボディの速度を直接設定します。オブジェクトは慣性を無視して即座にその速度になります。',
    params: [
        { key: 'x', type: 'number', label: 'X方向の速度', defaultValue: 0 },
        { key: 'y', type: 'number', label: 'Y方向の速度', defaultValue: 0 }
    ]
};