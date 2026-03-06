/**
 * [shake] タグ - キャラクターの揺れ
 * 
 * 指定されたキャラクターを水平に揺らします。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - 対象キャラクターの管理名 (必須)
 * @param {number} [params.time=500] - 揺らす総時間(ms)
 * @param {number} [params.power=10] - 揺れの幅(pixel)
 */
export default async function handleShake(manager, params) {
    const { name, time = 500, power = 10 } = params;
    const scene = manager.scene;

    if (!name) { console.warn('[shake] name属性は必須です。'); return; }
    const chara = scene.characters[name];
    if (!chara) { console.warn(`[shake] キャラクター[${name}]が見つかりません。`); return; }

    const duration = Number(time);
    const intensity = Number(power);
    const originX = chara.x;

    // Tweenの完了をawaitで待つ
    await new Promise(resolve => {
        scene.tweens.add({
            targets: chara,
            x: originX + intensity,
            duration: 50, // 1回の揺れの速さ
            ease: 'Linear',
            yoyo: true,
            repeat: Math.floor((duration / 100) - 1),
            onComplete: () => {
                chara.setX(originX); // 最終的な位置を補正
                resolve();
            }
        });
    });
}