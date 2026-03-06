/**
 * [live_breath_stop] タグ - 呼吸アニメーション停止
 * 
 * [live_breath_start]で開始した呼吸アニメーションを停止し、
 * キャラクターの状態を完全に元に戻します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 */
export default async function handleLiveBreathStop(manager, params) {
    const { name } = params;
    const scene = manager.scene;

    if (!name) { console.warn('[live_breath_stop] name属性は必須です。'); return; }
    const chara = scene.characters[name];
    if (!chara) { console.warn(`[live_breath_stop] キャラクター[${name}]が見つかりません。`); return; }

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★★★ これが全てを解決する、唯一の修正です ★★★
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    
    // 1. キャラクターに保存されたTweenの参照を取得
    const breathTween = chara.getData('liveBreathTween');
    
    // 2. もしTweenが存在すれば、それを完全に削除する
    if (breathTween) {
        // stop()ではなくremove()を使い、TweenManagerから完全に除去する
        breathTween.remove();
        chara.removeData('liveBreathTween');
        // console.log(`[live_breath_stop] ${name}の呼吸Tweenを削除しました。`);
    }

    // 3. 保存しておいた元の状態情報を使って、キャラクターを復元する
    const breathInfo = chara.getData('breathInfo');
    if (breathInfo) {
        // a. スケールを元に戻す
        chara.setScale(chara.scaleX, breathInfo.originalScale);
        
        // b. Y座標を、補正量を引いて元に戻す
        chara.y -= breathInfo.yOffset;
        
        // c. ★最後に★、原点を元に戻す
        // (Y座標の計算が終わってから原点を戻すのが安全)
        chara.setOrigin(0.5, breathInfo.originalOriginY);
        
        // d. 使った情報は削除
        chara.removeData('breathInfo');
        // console.log(`[live_breath_stop] ${name}の状態を復元しました。`);
    }
}