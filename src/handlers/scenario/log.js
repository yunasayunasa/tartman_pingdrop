/**
 * [log] タグ - デバッグログ出力
 * 
 * 指定された式を評価し、その結果をブラウザのコンソールに出力します。
 * ゲームの変数状態を確認するデバッグ用途に最適です。
 * 
 * 例:
 * [log exp="f.love_meter"]
 * [log exp="sf.boot_count"]
 * [log exp="f.player.name === 'kaito'"]
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.exp - 評価してコンソールに出力するJavaScript式 (必須)
 */
export default async function handleLog(manager, params) {
    const { exp } = params;
    if (!exp) {
        console.warn('[log] exp属性は必須です。');
        return;
    }

    try {
        // StateManagerに式の評価を依頼し、結果を受け取る
        const value = manager.stateManager.eval(exp);
        
        // 評価した式とその結果を、スタイル付きで分かりやすくコンソールに出力
        // console.log(`%c[Log Tag] ${exp}:`, "color: dodgerblue; font-weight: bold;", value);
        
    } catch (e) {
        console.error(`[log] 式の評価中にエラーが発生しました: "${exp}"`, e);
    }

    // このタグは同期的（待つべき処理がない）なので、これだけで完了です。
}