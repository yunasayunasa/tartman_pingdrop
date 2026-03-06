// src/handlers/events/spawn_object.js

/**
 * [spawn_object] アクションタグ
 * プレハブから新しいオブジェクトをシーンに生成（スポーン）します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function spawn_object(interpreter, params) {
    const prefabKey = params.prefab;
    if (!prefabKey) {
        console.warn('[spawn_object] "prefab" parameter is missing.');
        return;
    }

    const scene = interpreter.scene;
    // ★ BaseGameScene以外（UISceneなど）で呼ばれた場合に備えてガードを追加
    if (typeof scene.createObjectFromLayout !== 'function') {
        console.error(`[spawn_object] This action can only be run in a scene that supports object creation (e.g., BaseGameScene). Current scene: ${scene.scene.key}`);
        return;
    }

    const prefabData = scene.cache.json.get(prefabKey);
    if (!prefabData) {
        console.warn(`[spawn_object] Prefab data for key '${prefabKey}' not found.`);
        return;
    }

    const newObjectLayout = { ...prefabData };
    const sourceObject = interpreter.currentSource;

    let spawnX = sourceObject.x;
    let spawnY = sourceObject.y;
    const at = params.at || 'source';

    if (at === 'pointer' && scene.input.activePointer) {
        spawnX = scene.input.activePointer.worldX;
        spawnY = scene.input.activePointer.worldY;
    } else if (at.includes(',')) {
        const coords = at.split(',').map(Number);
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            spawnX = coords[0];
            spawnY = coords[1];
        }
    } else if (at !== 'source') {
        const atObject = interpreter.findTarget(at, sourceObject, interpreter.currentTarget);
        if (atObject) {
            spawnX = atObject.x;
            spawnY = atObject.y;
        }
    }
    
    newObjectLayout.x = Math.round(spawnX);
    newObjectLayout.y = Math.round(spawnY);
    // nameはapplyPropertiesの中で設定されるので、ここでの設定は不要

    // ▼▼▼【ここが修正の核心です】▼▼▼
    // --------------------------------------------------------------------
    // 1. プレハブ自体にレイヤー指定があれば、それを最優先
    // 2. なければ、SystemScene経由でEditorUIの「現在のアクティブレイヤー名」を取得
    // 3. それもなければ、安全策として 'Gameplay' をデフォルトにする
    const systemScene = scene.scene.get('SystemScene');
    const activeLayerName = systemScene.editorUI?.activeLayerName;

    newObjectLayout.layer = prefabData.layer || activeLayerName || 'Gameplay';
    // --------------------------------------------------------------------
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // ★ createObjectFromLayout が name を自動生成してくれるはず
    const newGameObject = scene.createObjectFromLayout(newObjectLayout);
    if (newGameObject) {
        // ★ applyProperties がレイヤー設定を含むすべてのプロパティを適用する
        scene.applyProperties(newGameObject, newObjectLayout);
        // console.log(`[spawn_object] Successfully spawned '${newGameObject.name}' on layer '${newObjectLayout.layer}'.`);
    } else {
        console.error(`[spawn_object] Failed to create game object from prefab '${prefabKey}'.`);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
spawn_object.define = {
    description: 'プレハブから新しいオブジェクトを生成します。',
    params: [
        { 
            key: 'prefab', 
            // ▼▼▼【ここを、このように拡張します】▼▼▼
            type: 'asset_key',
            assetType: 'prefab', // ★ どのアセットタイプかを追加
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
            label: 'プレハブ名', 
            defaultValue: '' 
        },
        { key: 'at', type: 'string', label: '生成位置', defaultValue: 'source' }
    ]
};