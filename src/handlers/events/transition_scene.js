// src/handlers/events/transition_scene.js
import EngineAPI from '../../core/EngineAPI.js'; // ★ 1. インポート

export default async function transition_scene(interpreter, params) {
    const toSceneKey = params.scene;
    if (!toSceneKey) {
        console.warn('[transition_scene] Missing required parameter: "scene".');
        return;
    }
    const currentScene = interpreter.scene;
    if (!currentScene) return;

    const fromSceneKey = currentScene.scene.key;
    const transitionParams = {
        layoutDataKey: params.data,
        startScript: params.script
    };
    
    // ★ 2. EngineAPIを呼び出す
    EngineAPI.requestSimpleTransition(fromSceneKey, toSceneKey, transitionParams);
}
// define部分は変更なし

/**
 * ★ VSLエディタ用の自己定義 ★
 */
transition_scene.define = {
    description: '指定した別のゲームシーンへ遷移します。',
    params: [
        { key: 'scene', type: 'string', label: '遷移先シーン名', defaultValue: '' },
        { key: 'data', type: 'string', label: 'レイアウトJSON名', defaultValue: '' },
        { key: 'script', type: 'string', label: '開始シナリオ名', defaultValue: '' }
    ]
};