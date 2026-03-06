/**
 * [else] タグ - 条件分岐 (else)
 * 
 * それまでの[if]および[elsif]の条件がすべてfalseだった場合に、このブロックを実行します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - パラメータ (このタグでは使用しません)
 */
export default async function handleElse(manager, params) {
    if (manager.ifStack.length === 0) {
        console.error("[else] 対応する[if]が存在しません。");
        return;
    }

    const ifState = manager.ifStack[manager.ifStack.length - 1];

    // 既に前のブロックの条件が成立している場合は、このブロックは無条件でスキップ
    if (ifState.conditionMet) {
        ifState.skipping = true;
    } 
    // まだどのブロックも成立していない場合、このブロックを実行する
    else {
        ifState.skipping = false;     // このブロックは実行する
        ifState.conditionMet = true;  // この[if]文全体が成立したことを記録
    }
}