/**
 * [chara_hide] タグ - キャラクターの退場
 * 
 * 指定されたキャラクターを画面から退場させます。
 * フェードアウト時間を指定できます。
 * アニメーション完了後、オブジェクトは破棄されます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - 退場させるキャラクターの管理名 (必須)
 * @param {number} [params.time=0] - フェードアウト時間(ms)
 */
export default async function handleCharaHide(manager, params) {
    const { name, time = 0 } = params;
    const scene = manager.scene;

    // --- 1. パラメータと対象キャラクターの検証 ---
    if (!name) {
        console.warn('[chara_hide] name属性は必須です。');
        return;
    }

    const chara = scene.characters[name];
    if (!chara) {
        // 対象がいない場合は、エラーではなく警告にとどめ、シナリオの進行を止めない
        console.warn(`[chara_hide] 非表示対象のキャラクター[${name}]は既に存在しません。`);
        return;
    }

    // --- 2. アニメーション（フェードアウト） ---
    const duration = Number(time);
    if (duration > 0) {
        // TweenをPromise化し、完了を待つ
        await new Promise(resolve => {
            scene.tweens.add({
                targets: chara,
                alpha: 0,
                duration: duration,
                ease: 'Linear',
                onComplete: () => resolve() // アニメーション完了でPromiseを解決
            });
        });
    }
    
    // --- 3. オブジェクトの破棄 ---
    // フェードアウト後、または即座に実行
    chara.destroy();
    delete scene.characters[name];
}