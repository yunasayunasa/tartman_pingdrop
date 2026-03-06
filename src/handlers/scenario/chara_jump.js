/**
 * [chara_jump] タグ - キャラクターのジャンプ
 * 
 * キャラクターを放物線を描くようにジャンプさせます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - 対象キャラクターの管理名 (必須)
 * @param {number} [params.time=500] - ジャンプにかかる総時間(ms)
 * @param {number} [params.height=50] - ジャンプの高さ(pixel)
 * @param {boolean} [params.loop=false] - ジャンプを繰り返すか
 * @param {boolean} [params.nowait=false] - 完了を待たずに次の行へ進むか
 */
export default async function handleCharaJump(manager, params) {
    const { name, time = 500, height = 50, loop = false, nowait = false } = params;
    const scene = manager.scene;

    if (!name) { console.warn('[chara_jump] name属性は必須です。'); return; }
    const chara = scene.characters[name];
    if (!chara) { console.warn(`[chara_jump] キャラクター[${name}]が見つかりません。`); return; }

    const duration = Number(time);
    const jumpHeight = Number(height);
    const originY = chara.y;
    
    // Tweenの設定オブジェクトを作成
    const tweenConfig = {
        targets: chara,
        y: originY - jumpHeight,
        duration: duration / 2,
        ease: 'Sine.Out',
        yoyo: true, // 自動で元のY座標に戻る
        loop: loop ? -1 : 0, // loopがtrueなら無限ループ
    };

    // nowait=true または loop=true の場合、完了を待たない
    if (nowait || loop) {
        scene.tweens.add(tweenConfig);
        return; // 即座に関数を終了し、シナリオを進める
    }

    // 通常のジャンプの場合、完了をawaitで待つ
    await new Promise(resolve => {
        tweenConfig.onComplete = resolve;
        scene.tweens.add(tweenConfig);
    });
}