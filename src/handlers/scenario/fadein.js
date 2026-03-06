/**
 * [fadein] タグ - 画面のフェードイン
 * 
 * フェードアウトされた画面を、通常表示に戻します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {number} [params.time=1000] - フェードインにかかる時間(ms)
 * @param {string} [params.color='000000'] - 開始する色 (通常はfadeoutと合わせる)
 */
export default async function handleFadein(manager, params) {
    const { time = 1000, color = '000000' } = params;
    const scene = manager.scene;
    const camera = scene.cameras.main;
    
    // カラーコードを数値に変換
    const colorInt = parseInt(color.replace(/^0x/, ''), 16);
    const r = (colorInt >> 16) & 0xFF;
    const g = (colorInt >> 8) & 0xFF;
    const b = colorInt & 0xFF;

    // カメラのフェードイン完了をawaitで待つ
    await new Promise(resolve => {
        // 'camerafadeincomplete' イベントを一度だけリッスンする
        camera.once('camerafadeincomplete', resolve);
        // フェードインを開始
        camera.fadeIn(Number(time), r, g, b);
    });
}