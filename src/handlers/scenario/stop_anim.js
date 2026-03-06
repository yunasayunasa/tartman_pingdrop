/**
 * [stop_anim] タグ - アニメーションの停止と状態のリセット
 * 
 * 指定されたnameを持つオブジェクトに適用されている全てのTweenアニメーションを停止し、
 * さらに、スケール、角度、原点をデフォルトの状態にリセットします。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - 対象オブジェクトの管理名 (必須)
 */
export default async function handleStopAnim(manager, params) {
    const { name } = params;
    const scene = manager.scene;

    if (!name) {
        console.warn('[stop_anim] name属性は必須です。');
        return;
    }
    
    // キャラクターリストからターゲットを探す
    const target = scene.characters[name];
    
    if (!target) {
        console.warn(`[stop_anim] 停止対象のオブジェクト[${name}]が見つかりません。`);
        return;
    }

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★★★ これが、全てを解決する「代用」の核心です ★★★
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

    // 1. 指定されたターゲットに紐づくTweenをすべて停止・削除する
    scene.tweens.killTweensOf(target);
    // console.log(`[stop_anim] オブジェクト[${name}]のアニメーションを停止しました。`);

    // 2. キャラクターの状態を、安全なデフォルト値に強制的にリセットする
    //    (呼吸アニメーションの副作用を完全に消し去る)
    
    // a. 元のY座標を、原点が中央(0.5)だったと仮定して計算
    const resetY = target.originY === 0.7 ? target.y - (target.displayHeight * 0.2) : target.y;

    // b. 原点を中央に戻す
    target.setOrigin(0.5, 0.5);
    
    // c. Y座標を、原点補正後の正しい位置に設定
    target.setY(resetY);
    
    // d. スケールを1に、角度を0に戻す
    target.setScale(1);
    target.setAngle(0);

    // console.log(`[stop_anim] オブジェクト[${name}]の状態をリセットしました。`);
    
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
}