// src/handlers/events/save_game.js
export default async function save_game(interpreter, params) {
    const stateManager = interpreter.scene.registry.get('stateManager');
    const slot = params.slot || 'checkpoint';
    const currentScene = interpreter.scene;

    if (!stateManager) return;

    let saveData = null;

    // --- 実行中のシーンに ScenarioManager が存在するかどうかで処理を分岐 ---
    if (currentScene.scenarioManager && typeof stateManager.getState === 'function') {
        // ノベルシーンの場合：既存の getState を使う
        saveData = stateManager.getState(currentScene.scenarioManager);
    } 
    else if (typeof stateManager.createSaveData === 'function') {
        // それ以外のシーンの場合：新しい汎用メソッドを使う
        saveData = stateManager.createSaveData(currentScene);
    } 
    else { return; }

    if (saveData) {
        localStorage.setItem(`save_slot_${slot}`, JSON.stringify(saveData));
        // console.log(`%c[SAVE GAME] Game state saved to slot '${slot}'.`, 'color: lightblue;', saveData);
    }
}