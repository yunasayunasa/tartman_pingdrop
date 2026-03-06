/**
 * [s] タグ - 選択肢待ち停止 (Stop)
 * 
 * シナリオの進行を停止し、プレイヤーが選択肢を選ぶのを待ちます。
 * このタグの前に[link]と[r]が実行されている必要があります。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - パラメータ (このタグでは使用しません)
 */
export default async function handleS(manager, params) {
    // 選択肢が1つも定義されていない場合は、警告を出して処理を中断
    if (manager.scene.choiceButtons.length === 0) {
        console.warn("[s] タグが実行されましたが、表示する選択肢がありません。[link]と[r]を先に記述してください。");
        return;
    }
    
    // 「選択肢待ち」状態に移行する
    manager.isWaitingChoice = true;

    // このフラグを立てることで、ScenarioManagerのgameLoopが停止する
}
