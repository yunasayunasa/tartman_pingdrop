// src/handlers/events/camera_follow.js

/**
 * [camera_follow] アクションタグ
 * カメラの追従ターゲットを設定します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target - このタグは'target'パラメータを優先します
 */
export default async function camera_follow(interpreter, params) {
    const targetName = params.target;
    if (!targetName) {
        console.warn('[camera_follow] "target" parameter is missing.');
        return;
    }

    const scene = interpreter.scene;
    const camera = scene.cameras.main;
    
    if (targetName.toLowerCase() === 'none') {
        camera.stopFollow();
    } else {
        const targetObject = interpreter.findTarget(targetName, interpreter.currentSource, interpreter.currentTarget);

        if (targetObject) {
            camera.startFollow(targetObject, true, 0.05, 0.05);
        } else {
            console.warn(`[camera_follow] Target object '${targetName}' not found.`);
        }
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
camera_follow.define = {
    description: 'カメラを指定したターゲットに追従させます。',
    params: [
        { key: 'target', type: 'string', label: 'ターゲット名', defaultValue: 'self' }
    ]
};