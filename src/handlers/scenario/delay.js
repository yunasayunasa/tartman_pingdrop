/**
 * [delay] タグ - テキスト表示速度の変更
 * 
 * メッセージウィンドウの文字送り速度を変更します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { speed: number }
 */
export default async function handleDelay(manager, params) {
    const { speed } = params;
    if (speed === undefined) {
        console.warn('[delay] speed属性は必須です。');
        return;
    }
    
    manager.messageWindow.setTypingSpeed(Number(speed));
}