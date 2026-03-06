/**
 * [elsif] タグ - 条件分岐 (else if)
 * 
 * 直前の[if]または[elsif]の条件がfalseの場合に、新しい条件式を評価します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { exp: string }
 */
export default async function handleElsif(manager, params) {
    if (manager.ifStack.length === 0) {
        console.error("[elsif] 対応する[if]が存在しません。");
        return;
    }

    const ifState = manager.ifStack[manager.ifStack.length - 1];

    // 既に前のブロックの条件が成立している場合は、このブロックは無条件でスキップ
    if (ifState.conditionMet) {
        ifState.skipping = true;
    } 
    // まだどのブロックも成立していない場合、新しい条件式を評価する
    else {
        const { exp } = params;
        if (exp === undefined) {
            console.warn("[elsif] exp属性は必須です。");
            ifState.skipping = true; // 式がない場合はスキップ
            return;
        }

        const result = manager.stateManager.eval(exp);
        if (result) {
            // 条件が成立した場合
            ifState.skipping = false;     // このブロックは実行する
            ifState.conditionMet = true;  // この[if]文全体が成立したことを記録
        } else {
            // 条件が成立しなかった場合
            ifState.skipping = true;      // このブロックはスキップする
        }
    }
}