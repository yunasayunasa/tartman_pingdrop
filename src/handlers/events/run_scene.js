// in src/handlers/events/run_scene.js
export default async function run_scene(interpreter, params) {
    const sceneKey = params.sceneKey;
    if (!sceneKey) return;

    // ★★★ interpreter.game から SystemScene を取得する ★★★
    const systemScene = interpreter.game.scene.getScene('SystemScene');
    if (!systemScene) return;

    // ★ どのシーンから来たかは、SystemScene の gameState で判断
    const fromSceneKey = systemScene.gameState;

    // ★ シーンに渡すパラメータも、JSONから取得
    const sceneParams = params.params || {};
    // GameSceneの場合、グローバルな定義もマージする
    if (sceneKey === 'GameScene' && systemScene.globalCharaDefs) {
        sceneParams.charaDefs = systemScene.globalCharaDefs;
    }

    systemScene.events.emit('request-simple-transition', {
        from: fromSceneKey,
        to: sceneKey,
        params: sceneParams
    });
}
// ... (defineは修正)
run_scene.define = {
    params: [
        { key: 'sceneKey', type: 'string', label: 'シーンキー' },
        { key: 'params', type: 'string', label: 'シーンパラメータ(JSON)' }
    ]
};