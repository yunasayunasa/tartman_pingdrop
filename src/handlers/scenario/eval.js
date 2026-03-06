/**
 * [eval] タグ - 変数の操作 (複合代入演算子対応版)
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { exp: string }
 */
export default async function handleEval(manager, params) {
    const { exp } = params;
    if (!exp) {
        console.warn('[eval] exp属性は必須です。');
        return;
    }

    try {
        // ★★★ これが全てを解決するロジックです ★★★
        const operators = ['+=', '-=', '*=', '/=', '='];
        let operator = null;

        // どの演算子が使われているかを探す
        for (const op of operators) {
            if (exp.includes(op)) {
                operator = op;
                break;
            }
        }
        
        // 代入式の場合 (いずれかの演算子が見つかった)
        if (operator) {
            const parts = exp.split(operator);
            const path = parts[0].trim();
            const valueExpression = parts[1].trim();

            if (path.startsWith('f.') || path.startsWith('sf.')) {
                // 右辺の値を評価
                const value = manager.stateManager.eval(valueExpression);
                
                if (value !== undefined) {
                    // 単純な代入 '=' の場合
                    if (operator === '=') {
                        manager.stateManager.setValueByPath(path, value);
                    } 
                    // 複合代入演算子の場合
                    else {
                        // 1. 現在の値を取得
                        const currentValue = manager.stateManager.getValue(path);
                        let newValue = currentValue;

                        // 2. 演算を実行
                        switch (operator) {
                            case '+=': newValue += value; break;
                            case '-=': newValue -= value; break;
                            case '*=': newValue *= value; break;
                            case '/=': newValue /= value; break;
                        }

                        // 3. 計算後の新しい値を設定
                        manager.stateManager.setValueByPath(path, newValue);
                    }
                } else {
                    console.error(`[eval] 値の評価に失敗したため、代入を中止しました: ${valueExpression}`);
                }
            } else {
                console.warn(`[eval] 無効な代入式です。左辺は 'f.' または 'sf.' で始まる必要があります: ${exp}`);
            }

        } else {
            // 代入式ではない場合 (例: [eval exp="someFunction()"])
            manager.stateManager.eval(exp);
        }

    } catch (e) {
        console.error(`[eval] 式の実行中に予期せぬエラーが発生しました: "${exp}"`, e);
    }
}