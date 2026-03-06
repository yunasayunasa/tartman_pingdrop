/**
 * [er] タグ - オブジェクトの消去 (erase)
 * 
 * 指定された名前のオブジェクト、またはレイヤー上の全てのオブジェクトを消去します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { name?: string, layer?: string }
 */
export default async function handleEr(manager, params) {
    const { name, layer } = params;
    const scene = manager.scene;

    // --- name指定による個別削除 ---
    if (name) {
        const targetObject = scene.characters[name]; // まずはキャラクターを探す
        if (targetObject) {
            targetObject.destroy();
            delete scene.characters[name];
        } else {
            console.warn(`[er] 消去対象のオブジェクト[${name}]が見つかりません。`);
        }
        return;
    }

    // --- layer指定による一括削除 ---
    if (layer) {
        const targetLayer = manager.layers[layer];
        if (targetLayer) {
            targetLayer.removeAll(true);
            if (layer === 'character') {
                scene.characters = {};
            }
        } else {
            console.warn(`[er] 指定されたレイヤー[${layer}]が見つかりません。`);
        }
        return;
    }
    
    console.warn('[er] layer属性またはname属性は必須です。');
}