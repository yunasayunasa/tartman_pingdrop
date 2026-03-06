/**
 * [cm] タグ - メッセージクリア (Clear Message)
 * 
 * メッセージウィンドウのテキストをクリアし、クリック待ち状態に入ります。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 */
export default async function handleCm(manager, params) {
    // メッセージウィンドウをクリア
    await manager.messageWindow.setText('', false);
    
    // クリック待ち状態に設定
    manager.isWaitingClick = true;
    manager.messageWindow.showNextArrow();
}