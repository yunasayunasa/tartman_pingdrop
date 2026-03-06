/**
 * Odyssey Engine - Scene Control VSL Tag Handlers
 * 
 * これらのタグは、主に game_flow.json のステートマシンから ActionInterpreter を通じて実行されることを想定しています。
 * SystemScene の Phaser.Scenes.SceneManager を直接操作するためのインターフェースを提供します。
 */

// ヘルパー関数：SystemSceneのインスタンスを安全に取得する
function getSystemScene(interpreter) {
    // ActionInterpreterはどのシーンからでも実行されうるため、
    // interpreter.scene.scene.get('SystemScene') を使って確実にSystemSceneを取得します。
    return interpreter.scene.scene.get('SystemScene');
}

// --- VSL Tag Handlers ---
// src/handlers/system/scene_control.js

async function run_scene(interpreter, params) {
    const systemScene = getSystemScene(interpreter);
    const sceneKey = params.sceneKey;

    if (systemScene && sceneKey) {
        // console.log(`[VSL:run_scene] Relaying 'request-run-scene' event to SystemScene for scene: '${sceneKey}'`);
        // ★★★ シーンを直接runするのをやめ、SystemSceneにイベントを投げるだけにする ★★★
        systemScene.events.emit('request-run-scene', {
            sceneKey: sceneKey,
            params: params.params || {}
        });
    }
}
run_scene.define = {
    params: [{ key: 'sceneKey', type: 'string', required: true, label: 'シーンキー' }]
};


/**
 * [stop_scene]: 指定されたシーンを停止(stop)する
 */
async function stop_scene(interpreter, params) {
    const systemScene = getSystemScene(interpreter);
    const sceneKey = params.sceneKey;

    if (systemScene && sceneKey) {
        // console.log(`[VSL:stop_scene] Requesting to stop scene: '${sceneKey}'`);
        systemScene.scene.stop(sceneKey);
    }
}
stop_scene.define = {
    params: [{ key: 'sceneKey', type: 'string', required: true, label: 'シーンキー' }]
};


/**
 * [pause_scene]: 指定されたシーンを一時停止(pause)する
 */
async function pause_scene(interpreter, params) {
    const systemScene = getSystemScene(interpreter);
    const sceneKey = params.sceneKey;

    if (systemScene && sceneKey) {
        // @previousState のような特別なキーワードを解決するロジックが必要になるが、まずは直接指定から実装
        // console.log(`[VSL:pause_scene] Requesting to pause scene: '${sceneKey}'`);
        systemScene.scene.pause(sceneKey);
    }
}
pause_scene.define = {
    params: [{ key: 'sceneKey', type: 'string', required: true, label: 'シーンキー' }]
};


/**
 * [resume_scene]: 指定されたシーンを再開(resume)する
 */
async function resume_scene(interpreter, params) {
    const systemScene = getSystemScene(interpreter);
    const sceneKey = params.sceneKey;

    if (systemScene && sceneKey) {
        // console.log(`[VSL:resume_scene] Requesting to resume scene: '${sceneKey}'`);
        systemScene.scene.resume(sceneKey);
    }
}
resume_scene.define = {
    params: [{ key: 'sceneKey', type: 'string', required: true, label: 'シーンキー' }]
};


/**
 * [launch_scene]: 指定されたシーンを起動(launch)する。主にオーバーレイ用。
 */
async function launch_scene(interpreter, params) {
    const systemScene = getSystemScene(interpreter);
    const sceneKey = params.sceneKey;

    if (systemScene && sceneKey) {
        // layoutKeyなどの追加パラメータも渡せるように、params全体を渡す
        // console.log(`[VSL:launch_scene] Requesting to launch scene: '${sceneKey}' with params:`, params);
        systemScene.scene.launch(sceneKey, params);
    }
}
launch_scene.define = {
    params: [
        { key: 'sceneKey', type: 'string', required: true, label: 'シーンキー' },
        { key: 'layoutKey', type: 'string', required: false, label: 'レイアウトキー' }
    ]
};


// --- エクスポート ---
// 作成した全てのハンドラをエクスポートする
export {
    run_scene,
    stop_scene,
    pause_scene,
    resume_scene,
    launch_scene
};