// 画面サイズを引数に取り、各位置の座標を返すオブジェクト
export const Layout = {
    // 縦向き (portrait) のレイアウト
    portrait: {
        width: 1280,
        height: 720,
        character: {
            // Y座標は共通にしておくと綺麗に見える
            left:   { x: 280, y: 450 },
            center: { x: 640, y: 450 },
            right:  { x: 1000, y: 450 }
        }
    },
      ui: {
        messageWindow: {
            x: 640,  // 画面中央 (1280 / 2)
            y: 600,  // 画面下部
            padding: 35
        },
        choiceButton: {
            // この定義は、GameSceneのdisplayChoiceButtonsで直接計算しても良い
            startY: 200,
            stepY: 90
        }
    },
  
    // 横向き (landscape) のレイアウト
    landscape: {
        width: 1280,
        height: 720,
        character: {
            left:   { x: 280, y: 450 },
            center: { x: 640, y: 450 },
            right:  { x: 1000, y: 450 }
        }
    }
};
