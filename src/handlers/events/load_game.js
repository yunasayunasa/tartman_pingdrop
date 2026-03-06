// src/handlers/events/load_game.js
import EngineAPI from '../../core/EngineAPI.js'; // ★ 1. インポート

export default async function load_game(interpreter, params) {
    console.group(`%c[VSL LOG] Tag [load_game] Executed!`, 'background: #222; color: #ffeb3b;');
    const slot = params.slot || 'checkpoint';
    const saveDataString = localStorage.getItem(`save_slot_${slot}`);

    if (saveDataString) {
        try {
            const saveData = JSON.parse(saveDataString);
            const fromScene = interpreter.scene.scene.key;
            const toScene = saveData.currentSceneKey;
            const transitionParams = { loadData: saveData };

            // console.log(`Step 4: EngineAPI found. Calling 'requestSimpleTransition'.`);
            
            // ★ 2. EngineAPIを呼び出す
            EngineAPI.requestSimpleTransition(fromScene, toScene, transitionParams);

                // interpreter.stop() はもう不要
        // if (interpreter.stop) {
        //     interpreter.stop();
        // }
             // interpreter.stop() はもう不要
        // if (interpreter.stop) {
        //     interpreter.stop();
        // }
        return '__interrupt__'; // ★ 処理をここで中断させる
    
        } catch (e) {
            console.error("CRITICAL: Failed to parse save data JSON!", e);
        }
    } else {
        console.error(`CRITICAL: Save data for slot '${slot}' not found in localStorage!`);
    }
    console.groupEnd();
}
// define部分は変更なし

load_game.define = {
    params: [{ key: 'slot', type: 'string', label: 'ロードスロット名', defaultValue: 'checkpoint' }]
};