/**
 * [link] タグ - 選択肢の定義
 * 
 * 選択肢の情報をGameSceneに登録します。
 * この時点ではボタンは表示されません。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { target: string, text: string }
 */
export default async function handleLink(manager, params) {
    const { target, text } = params;

    if (!target || !text) {
        console.warn('[link] target属性とtext属性は必須です。');
        return;
    }

    // GameSceneが持つpendingChoices配列に選択肢情報を追加
    manager.scene.pendingChoices.push({ text, target });
}