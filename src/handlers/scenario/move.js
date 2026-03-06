/**
 * [move] タグ - キャラクターの移動・変形
 * 
 * 指定されたキャラクターの位置、透明度、拡大率、角度などを
 * スムーズにアニメーションさせます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - 対象キャラクターの管理名 (必須)
 * @param {number} [params.x] - 目標X座標
 * @param {number} [params.y] - 目標Y座標
 * @param {number} [params.alpha] - 目標透明度 (0.0 - 1.0)
 * @param {number} [params.scale] - 目標拡大率 (全体)
 * @param {number} [params.scaleX] - 目標X拡大率
 * @param {number} [params.scaleY] - 目標Y拡大率
 * @param {number} [params.angle] - 目標角度 (-180 - 180)
 * @param {number} [params.time=1000] - アニメーション時間(ms)
 */
export default async function handleMove(manager, params) {
    const { name, time = 1000 } = params;
    const scene = manager.scene;

    if (!name) {
        console.warn('[move] name属性は必須です。');
        return;
    }
    
    const chara = scene.characters[name];
    if (!chara) {
        console.warn(`[move] 移動対象のキャラクター[${name}]が見つかりません。`);
        return;
    }

    const duration = Number(time);
    
    // Tweenで変更するプロパティを動的に構築
    const tweenProps = {
        targets: chara,
        duration: duration,
        ease: 'Cubic.easeInOut',
    };

    // 指定されたプロパティだけをtweenPropsに追加
    const propsToTween = ['x', 'y', 'alpha', 'scale', 'scaleX', 'scaleY', 'angle'];
    let hasProps = false;
    for (const prop of propsToTween) {
        if (params[prop] !== undefined) {
            tweenProps[prop] = Number(params[prop]);
            hasProps = true;
        }
    }

    if (!hasProps) {
        console.warn('[move] 移動先のx, yやalphaなどのプロパティが指定されていません。');
        return;
    }

    // --- アニメーションの実行と待機 ---
    if (duration > 0) {
        await new Promise(resolve => {
            tweenProps.onComplete = resolve; // onCompleteにresolveを直接設定
            scene.tweens.add(tweenProps);
        });
    } else {
        // 即時反映
        for (const prop in tweenProps) {
            if (propsToTween.includes(prop)) {
                chara[prop] = tweenProps[prop];
            }
        }
    }
}