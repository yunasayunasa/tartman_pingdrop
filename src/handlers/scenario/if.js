/**
 * [if] タグ - 条件分岐の開始
 * 
 * 条件式を評価し、結果に応じて後続のシナリオ行をスキップするかどうかを決定します。
 * 評価結果はifStackに記録されます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { exp: string }
 */
export default async function handleIf(manager, params) {
    const { exp } = params;
    if (exp === undefined) {
        console.warn("[if] exp属性は必須です。");
        // 条件式がない場合は、常にfalseとして扱う
        manager.ifStack.push({ conditionMet: false, skipping: true });
        return;
    }

    // StateManagerに式の評価を依頼する
    const result = manager.stateManager.eval(exp);
    
    // 評価結果をifStackに記録する
    manager.ifStack.push({
        conditionMet: !!result, // resultがtrueならtrue、それ以外はfalse
        skipping: !result       // resultがtrueならスキップしない、falseならスキップする
    });
}