/**
 * [flip] タグ - キャラクターの反転
 * 
 * キャラクターを反転させます。表情差分を同時に指定することも可能です。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - 対象キャラクターの管理名 (必須)
 * @param {string} [params.face] - 反転と同時に変更する表情名
 * @param {number} [params.time=500] - 反転にかかる総時間(ms)
 */
export default async function handleFlip(manager, params) {
    const { name, face, time = 500 } = params;
    const scene = manager.scene;

    if (!name) { console.warn('[flip] name属性は必須です。'); return; }
    const chara = scene.characters[name];
    if (!chara) { console.warn(`[flip] キャラクター[${name}]が見つかりません。`); return; }
    
    const duration = Number(time) / 2;
    const originalScaleX = chara.scaleX;

    // --- 1. 半分の時間かけて画像を横に潰すアニメーションの完了を待つ ---
    await new Promise(resolve => {
        scene.tweens.add({
            targets: chara,
            scaleX: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: resolve
        });
    });

    // --- 2. 潰れた瞬間にテクスチャと向きを差し替える ---
    chara.toggleFlipX(); // 向きを反転

    if (face) {
        const def = manager.characterDefs[name];
        const newStorage = def?.face?.[face];
        if (newStorage) {
            chara.setTexture(newStorage);
        } else {
            console.warn(`[flip] キャラクター[${name}]の表情[${face}]が見つかりません。`);
        }
    }
    
    // --- 3. 潰れた状態から、元の幅に戻すアニメーションの完了を待つ ---
    await new Promise(resolve => {
        scene.tweens.add({
            targets: chara,
            scaleX: originalScaleX, // 元のスケールに戻す
            duration: duration,
            ease: 'Linear',
            onComplete: resolve
        });
    });
}