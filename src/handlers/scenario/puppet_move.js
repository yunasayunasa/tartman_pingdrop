/**
 * [puppet_move] タグ - 人形劇風の移動
 * 
 * キャラクターを人形劇のように揺らしながら移動させます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 */
export default async function handlePuppetMove(manager, params) {
    const { name, time = 2000, x: paramX, y: paramY, sway_amount = 10, sway_speed = 250, angle = 0, pivot = 'bottom', nowait = false } = params;
    const scene = manager.scene;

    if (!name) { console.warn('[puppet_move] name属性は必須です。'); return; }
    const chara = scene.characters[name];
    if (!chara) { console.warn(`[puppet_move] キャラクター[${name}]が見つかりません。`); return; }

    // --- 1. パラメータの数値化 ---
    const duration = Number(time);
    const finalTargetX = paramX !== undefined ? Number(paramX) : chara.x;
    const finalTargetY = paramY !== undefined ? Number(paramY) : chara.y;
    const swayAmount = Number(sway_amount);
    const swaySpeed = Number(sway_speed);

    // --- 2. 完了を待つかどうかの判定 ---
    if (nowait) {
        // nowaitの場合はTweenを開始して即座に完了
        createPuppetMoveTweens(scene, chara, { duration, finalTargetX, finalTargetY, swayAmount, swaySpeed, angle, pivot });
        return;
    }

    // --- 3. 完了を待つ場合 ---
    await new Promise(resolve => {
        createPuppetMoveTweens(scene, chara, { duration, finalTargetX, finalTargetY, swayAmount, swaySpeed, angle, pivot }, resolve);
    });
}

/**
 * puppet_moveのTween群を作成・実行するヘルパー関数
 */
function createPuppetMoveTweens(scene, chara, config, onCompleteCallback = null) {
    const { duration, finalTargetX, finalTargetY, swayAmount, swaySpeed, angle, pivot } = config;
    
    // a. 原点と座標を補正
    const originalOriginY = chara.originY;
    const originalY = chara.y;
    let startY = originalY;
    let targetY = finalTargetY;

    if (pivot === 'bottom') {
        if (originalOriginY !== 1.0) startY = originalY + (chara.displayHeight / 2);
        targetY = finalTargetY + (chara.displayHeight / 2);
        chara.setOrigin(0.5, 1.0);
    } else {
        if (originalOriginY !== 0.5) startY = originalY - (chara.displayHeight / 2);
        targetY = finalTargetY;
        chara.setOrigin(0.5, 0.5);
    }
    chara.y = startY;

    // b. 移動Tweenを開始
    const moveTween = scene.tweens.add({
        targets: chara,
        x: finalTargetX,
        y: targetY,
        duration: duration,
        ease: 'Sine.easeInOut'
    });

    // c. 揺れTweenを開始
    const swayTween = scene.tweens.add({
        targets: chara,
        angle: { from: angle - swayAmount, to: angle + swayAmount },
        duration: swaySpeed,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });
    
    // d. 移動完了時のクリーンアップ
    moveTween.on('complete', () => {
        swayTween.stop();
        // 原点と最終的な位置・角度をリセット
        chara.setOrigin(0.5, 0.5);
        chara.setPosition(finalTargetX, finalTargetY);
        chara.setAngle(0);
        
        if (onCompleteCallback) {
            onCompleteCallback();
        }
    });
}