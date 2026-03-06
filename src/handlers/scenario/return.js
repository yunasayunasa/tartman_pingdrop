/**
 * [return] タグ - サブルーチンからの復帰
 * 
 * [call]タグで呼び出されたサブルーチンから、呼び出し元のシナリオに戻ります。
 * 呼び出し元の情報はコールスタックから取得されます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ (このタグでは使用しません)
 */
export default async function handleReturn(manager, params) {
    // 1. コールスタックが空でないかチェック
    if (manager.callStack.length === 0) {
        console.warn('[return] 呼び出し元(callStack)がありません。シナリオの進行を続けます。');
        return; // 何もせず、ループは次の行へ進む
    }
    
    // 2. コールスタックから戻り先の情報を取り出す
    const returnInfo = manager.callStack.pop();
    if (!returnInfo || !returnInfo.file || returnInfo.line === undefined) {
        console.error('[return] コールスタックから無効な情報が取得されました。', returnInfo);
        return;
    }

    // console.log(`[return] 呼び出し元へ復帰します -> ${returnInfo.file} (Line: ${returnInfo.line})`);

    const { file, line } = returnInfo;

    // 3. 呼び出し元のシナリオファイルをロードする
    //    (ファイルが同じ場合はロードはスキップされ、コンテキストのみが更新される)
    await manager.loadScenario(file);
    
    // 4. 保存しておいた行番号に、シナリオの読み取り位置を直接設定する
    manager.currentLine = line;

    // このハンドラが完了すると、ScenarioManagerのgameLoopは、
    // 更新された`currentLine`から次の行の処理を開始します。
}