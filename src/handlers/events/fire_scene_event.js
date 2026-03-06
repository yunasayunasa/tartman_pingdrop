// in src/handlers/events/fire_scene_event.js (新規作成)

/**
 * [fire_scene_event]
 * 特定のシーンに、カスタムイベントを発火させます。
 */
export default async function fire_scene_event(interpreter, params) {
    const eventName = params.name;
    const sceneKey = params.scene;

    if (!eventName || !sceneKey) {
        console.warn(`[fire_scene_event] 'name'と'scene'パラメータは必須です。`);
        return;
    }

    const targetScene = interpreter.scene.scene.get(sceneKey);
    if (targetScene) {
        targetScene.events.emit(eventName);
        // console.log(`[fire_scene_event] Fired '${eventName}' on scene '${sceneKey}'.`);
    } else {
        console.warn(`[fire_scene_event] Scene with key '${sceneKey}' not found.`);
    }
}

fire_scene_event.define = {
    description: '特定のシーンに、カスタムイベントを発行します。',
    params: [
        { key: 'name', type: 'string', label: 'イベント名', required: true },
        { key: 'scene', type: 'string', label: 'ターゲットシーン名', required: true }
    ]
};