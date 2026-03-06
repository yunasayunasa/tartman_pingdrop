/**
 * [r] タグ - 改行 兼 選択肢表示 (Render)
 * 
 * メッセージウィンドウをクリアし、[link]で定義された選択肢を画面に表示します。
 * このタグ自体はクリックを待ちません。待機は[s]タグが担当します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - パラメータ (このタグでは使用しません)
 */
export default async function handleR(manager, params) {
    
    // GameSceneに選択肢ボタンの表示を命令する
    if (manager.scene.pendingChoices.length > 0) {
        manager.scene.displayChoiceButtons();
    }
}