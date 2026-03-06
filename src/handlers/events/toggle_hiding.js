// in src/handlers/events/toggle_hiding.js

export default async function toggle_hiding(interpreter, params, target) {
    // ▼▼▼【ここからデバッグログを追加】▼▼▼
    console.group(`%c[DEBUG] [toggle_hiding] Tag Handler Executed!`, 'color: yellow; font-weight: bold;');
    
    const player = interpreter.scene.children.getByName('player');
    if (!player) {
        console.error("CRITICAL: 'player' object not found in the scene.");
        console.groupEnd();
        return;
    }
    // console.log(`Status: Found 'player' object.`);

    const playerController = player.components?.PlayerController;
    if (!playerController || typeof playerController.toggleHiding !== 'function') {
        console.error(`CRITICAL: 'PlayerController' or 'toggleHiding' method not found on 'player'.`);
        console.groupEnd();
        return;
    }
    // console.log(`Status: Found 'PlayerController' and 'toggleHiding' method.`);
    // console.log(`Action: Calling playerController.toggleHiding() with target '${target.name}'...`);
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    playerController.toggleHiding(target);
    
    console.groupEnd();
}
// ...

toggle_hiding.define = {
    description: 'プレイヤーの隠れる/出る状態を切り替えます。',
    params: [
        // このタグは'player'に対してしか機能しないので、ターゲット指定は不要
    ]
};
