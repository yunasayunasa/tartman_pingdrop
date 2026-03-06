/**
 * [chara_mod] タグ - キャラクターの画像変更 (表情差分など)
 * 
 * 表示中のキャラクターの画像を、クロスフェードで差し替えます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - 対象キャラクターの管理名 (必須)
 * @param {string} params.face - 新しい表情名 (必須)
 * @param {string} [params.storage] - 新しい画像キー (faceより優先)
 * @param {number} [params.time=200] - クロスフェード時間(ms)
 */
export default async function handleCharaMod(manager, params) {
    const { name, face, time = 200 } = params;
    let storage = params.storage;
    const scene = manager.scene;

    // --- 1. パラメータと対象キャラクターの検証 ---
    if (!name) { console.warn('[chara_mod] name属性は必須です。'); return; }
    if (!face && !storage) { console.warn('[chara_mod] face属性またはstorage属性は必須です。'); return; }

    const oldChara = scene.characters[name];
    if (!oldChara) { console.warn(`[chara_mod] 変更対象のキャラクター[${name}]が見つかりません。`); return; }

    // --- 2. 新しい画像(storage)を決定 ---
    if (!storage) {
        const def = manager.characterDefs[name];
        if (!def) { console.warn(`[chara_mod] キャラクター[${name}]の定義が見つかりません。`); return; }
        storage = def.face[face];
        if (!storage) { console.warn(`[chara_mod] キャラクター[${name}]の表情[${face}]が見つかりません。`); return; }
    }
    
    // --- 3. クロスフェード処理 ---
    const duration = Number(time);

    // a. 新しい画像を、古い画像と全く同じプロパティで上に重ねて作成
    const newChara = scene.add.image(oldChara.x, oldChara.y, storage);
    newChara.setAlpha(0);
    newChara.setScale(oldChara.scaleX, oldChara.scaleY);
    newChara.setFlipX(oldChara.flipX);
    newChara.setDepth(oldChara.depth);
    newChara.name = oldChara.name; // 名前も引き継ぐ
    manager.layers.character.add(newChara);

    // b. 新しいキャラクターオブジェクトに管理参照を差し替える
    scene.characters[name] = newChara;

    // c. フェードインとフェードアウトのTweenをPromise化する
    const fadeInPromise = new Promise(resolve => {
        scene.tweens.add({
            targets: newChara,
            alpha: 1,
            duration: duration,
            ease: 'Linear',
            onComplete: resolve
        });
    });

    const fadeOutPromise = new Promise(resolve => {
        scene.tweens.add({
            targets: oldChara,
            alpha: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                oldChara.destroy(); // フェードアウト完了後に古いオブジェクトを破棄
                resolve();
            }
        });
    });

    // d. ★★★ 両方のアニメーションが完了するのを待つ ★★★
    await Promise.all([fadeInPromise, fadeOutPromise]);
}