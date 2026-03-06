/**
 * [wait] タグ - 待機
 * 
 * 指定された時間、シナリオの進行を停止します。スキップモード中は待機しません。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { time: number }
 */
export default async function handleWait(manager, params) {
    // スキップモード中は、何もせずに即座に完了
    if (manager.mode === 'skip') {
        return;
    }
    
    const time = Number(params.time) || 1000;
    if (time > 0) {
        await new Promise(resolve => setTimeout(resolve, time));
    }
}