// src/handlers/scenario/hidewindow.js (改造版)

/**
 * [hidewindow] タグ - メッセージウィンドウを隠す
 * (画面外へ移動させる)
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ (現在は未使用)
 */
export default async function handleHideWindow(manager, params) {
    const scene = manager.scene;
    const messageWindow = manager.messageWindow;

    if (!messageWindow) return;
    
    // --- 座標の計算 ---
    const gameHeight = scene.scale.height;
    const windowHeight = messageWindow.height;
    
    // Y座標を画面の下の外側へ
    const targetY = gameHeight + (windowHeight / 2);

    // --- 実行 ---
    messageWindow.setY(targetY);

    // setVisible(false)でも隠せるが、座標移動の方がアニメーションに繋げやすい
    // messageWindow.setVisible(false);

    // console.log(`[hidewindow] Message window hidden at y=${targetY}`);
}