/**
 * [endif] タグ - 条件分岐の終了
 * 
 * [if]ブロックの終わりを示します。ifStackから最新の状態を取り除きます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - パラメータ (このタグでは使用しません)
 */
export default async function handleEndif(manager, params) {
    if (manager.ifStack.length > 0) {
        // ifStackから現在の[if]ブロックの状態を取り除く
        manager.ifStack.pop();
    } else {
        console.error("[endif] 対応する[if]が存在しません。");
    }
    
    // [endif]に到達したら、スキップ状態は必ず解除されるべき
    // (ネストされたif文の場合を考慮し、親のifStateをチェックする)
    const parentIfState = manager.ifStack.length > 0 ? manager.ifStack[manager.ifStack.length - 1] : null;
    if (parentIfState) {
        // 親のスキップ状態に追従する
        // (このロジックはScenarioManagerのparseメソッド側で処理されるので、ここでは不要)
    }
}