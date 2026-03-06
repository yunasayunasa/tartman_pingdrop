/**
 * [stopbgm] タグ - BGMの停止
 * 
 * 現在再生中のBGMをフェードアウトさせて停止します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { time?: number }
 */
export default async function handleStopBgm(manager, params) {
    const time = Number(params.time) || 0;

    // SoundManagerに停止を依頼
    manager.soundManager.stopBgm(time);

    // フェードアウト時間分だけ待機する
    if (time > 0) {
        await new Promise(resolve => setTimeout(resolve, time));
    }
}