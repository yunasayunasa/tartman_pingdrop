/**
 * [fadeout] タグ - 画面のフェードアウト
 * 
 * 画面全体を指定された色（デフォルトは黒）にフェードアウトさせます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {number} [params.time=1000] - フェードアウトにかかる時間(ms)
 * @param {string} [params.color='000000'] - 目標の色 (16進数文字列, '0x'は不要)
 */
export default async function handleFadeout(manager, params) {
    const { time = 1000, color = '000000' } = params;
    const scene = manager.scene;
    const camera = scene.cameras.main;

    // カラーコードを数値に変換
    const colorInt = parseInt(color.replace(/^0x/, ''), 16);
    const r = (colorInt >> 16) & 0xFF;
    const g = (colorInt >> 8) & 0xFF;
    const b = colorInt & 0xFF;
    
    // カメラのフェードアウト完了をawaitで待つ
    await new Promise(resolve => {
        // 'camerafadeoutcomplete' イベントを一度だけリッスンする
        camera.once('camerafadeoutcomplete', resolve);
        // フェードアウトを開始
        camera.fadeOut(Number(time), r, g, b);
    });
}