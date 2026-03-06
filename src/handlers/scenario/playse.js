/**
 * [playse] タグ - 効果音の再生
 * 
 * 指定された効果音（SE）を再生します。
 * デフォルトでは完了を待たずに次の行へ進みます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { storage: string, nowait?: boolean }
 */
export default async function handlePlaySe(manager, params) {
    const { storage, nowait = true } = params; // デフォルトは待たない

    if (!storage) {
        console.warn('[playse] storage属性は必須です。');
        return;
    }
    
    // SoundManagerのplaySeが、再生完了時に解決されるPromiseを返すように実装されていると仮定
    const sePromise = manager.soundManager.playSe(storage, params);

    // nowaitがfalseの場合のみ、再生完了を待つ
    if (!nowait && sePromise) {
        await sePromise;
    }
}