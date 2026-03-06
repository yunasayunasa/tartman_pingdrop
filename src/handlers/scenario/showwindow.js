// src/handlers/scenario/showwindow.js (改造版)

/**
 * [showwindow] タグ - メッセージウィンドウを指定された位置に表示する
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} [params.align='bottom'] - 'top', 'center', 'bottom' のいずれか
 * @param {number} [params.x] - X座標 (指定された場合、alignより優先)
 * @param {number} [params.y] - Y座標 (指定された場合、alignより優先)
 * @param {number} [params.margin_y=20] - 上下揃えの際の、画面端からの余白
 */
export default async function handleShowWindow(manager, params) {
    const scene = manager.scene;
    const messageWindow = manager.messageWindow;

    if (!messageWindow) return;

    // --- パラメータの取得 ---
    const { align = 'bottom', x: paramX, y: paramY, margin_y = 20 } = params;
    
    // --- 座標の計算 ---
    const gameWidth = scene.scale.width;
    const gameHeight = scene.scale.height;
    const windowHeight = messageWindow.height; // コンテナの高さを取得
    
    let targetX = messageWindow.x; // 現在のX座標をデフォルト値とする
    let targetY = messageWindow.y; // 現在のY座標をデフォルト値とする

    // X座標の決定
    if (paramX !== undefined) {
        targetX = Number(paramX);
    } else {
        // alignに基づいてX座標を中央に設定（デフォルト）
        targetX = gameWidth / 2;
    }

    // Y座標の決定
    if (paramY !== undefined) {
        targetY = Number(paramY);
    } else {
        switch (align) {
            case 'top':
                targetY = (windowHeight / 2) + Number(margin_y);
                break;
            case 'center':
                targetY = gameHeight / 2;
                break;
            case 'bottom':
            default:
                targetY = gameHeight - (windowHeight / 2) - Number(margin_y);
                break;
        }
    }
    
    // --- 実行 ---
    messageWindow.setVisible(true); // 念のため表示状態にする
    messageWindow.setPosition(targetX, targetY);

    // console.log(`[showwindow] Message window moved to (${targetX}, ${targetY})`);
}