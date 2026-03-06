/**
 * [walk] タグ - キャラクターの歩行移動
 * 
 * キャラクターを上下に揺らしながら、指定されたX座標まで移動させます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - 対象キャラクターの管理名 (必須)
 * @param {number} [params.x] - 目標X座標 (デフォルトは現在位置)
 * @param {number} [params.time=2000] - 移動にかかる総時間(ms)
 * @param {number} [params.height=10] - 上下に揺れる幅(pixel)
 * @param {number} [params.speed=150] - 上下動一回の速さ(ms)
 */
export default async function handleWalk(manager, params) {
    const { name, time = 2000, height = 10, speed = 150 } = params;
    const scene = manager.scene;

    if (!name) { console.warn('[walk] name属性は必須です。'); return; }
    const chara = scene.characters[name];
    if (!chara) { console.warn(`[walk] キャラクター[${name}]が見つかりません。`); return; }

    const targetX = params.x !== undefined ? Number(params.x) : chara.x;
    const originY = chara.y; 
    const walkHeight = Number(height);
    const walkSpeed = Number(speed);

    // 上下動のオフセット用データ
    const walkData = { offsetY: 0 };
    
    // --- 毎フレームY座標を更新するリスナー ---
    const onUpdate = () => {
        chara.y = originY + walkData.offsetY;
    };

    // ★★★ try...finallyで、後片付け処理を確実に実行する ★★★
    try {
        // --- 1. 上下動のTweenを開始 ---
        // (データオブジェクトを揺らす)
        const walkTween = scene.tweens.add({
            targets: walkData,
            offsetY: -walkHeight,
            duration: walkSpeed,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // --- 2. updateリスナーを開始 ---
        scene.events.on('update', onUpdate);

        // --- 3. メインの移動Tween(X座標)の完了をawaitで待つ ---
        await new Promise(resolve => {
            scene.tweens.add({
                targets: chara,
                x: targetX,
                duration: Number(time),
                ease: 'Linear',
                onComplete: resolve // 移動が終わったらPromiseを解決
            });
        });

    } finally {
        // --- 4. 完了処理（成功時もエラー時も必ず実行される） ---
        // console.log(`[walk] キャラクター[${name}]の歩行が完了しました。`);
        // a. 上下動Tweenを確実に停止
        const walkTween = scene.tweens.getTweensOf(walkData)[0];
        if (walkTween) {
            walkTween.stop();
        }
        // b. updateリスナーを確実に解除
        scene.events.off('update', onUpdate);
        // c. 最終的な位置を正確に設定
        chara.setPosition(targetX, originY);
    }
}