/**
 * [vibrate] タグ - 画面全体の揺れ
 * 
 * カメラを揺らし、画面全体に振動を与えます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {number} [params.time=500] - 揺らす総時間(ms)
 * @param {number} [params.power=0.005] - 揺れの強さ (0.0 to 1.0)
 */
export default async function handleVibrate(manager, params) {
    const { time = 500, power = 0.005 } = params;
    const scene = manager.scene;
    const camera = scene.cameras.main;

    // カメラのシェイク完了をawaitで待つ
    await new Promise(resolve => {
        // 'camerashakecomplete' イベントを一度だけリッスンする
        camera.once('camerashakecomplete', resolve);
        // カメラシェイクを開始
        camera.shake(Number(time), Number(power));
    });
}