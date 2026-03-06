/**
 * [playbgm] タグ - BGMの再生
 * 
 * 指定されたBGMを再生します。
 * フェードイン時間を指定した場合、完了するまで待機します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { storage: string, time?: number }
 */
export default async function handlePlayBgm(manager, params) {
    const storage = params.storage;
    if (!storage) {
        console.warn('[playbgm] storage属性は必須です。');
        return;
    }

    const time = Number(params.time) || 0; // パラメータ名を'time'に統一

    // SoundManagerのplayBgmがPromiseを返すことを期待する
    await manager.soundManager.playBgm(storage, time);
}