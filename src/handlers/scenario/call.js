/**
 * [call] タグ - サブルーチン呼び出し
 * 
 * 別のシナリオファイルやPhaserシーンをサブルーチンとして呼び出します。
 * 呼び出し元の位置はコールスタックに記録され、[return]タグで復帰します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { storage, target, params }
 */
export default async function handleCall(manager, params) {
    const { storage, target, params: callParams } = params;

    // 1. 戻り先の情報をコールスタックに記録する
    manager.callStack.push({
        file: manager.currentFile,
        line: manager.currentLine // manager.currentLineは既に次の行を指しているので、これで正しい
    });
    // console.log("CallStack Pushed:", manager.callStack);

    // --- .ksファイル（サブルーチン）呼び出しの場合 ---
    if (storage && storage.endsWith('.ks')) {
        // console.log(`[call] サブルーチンシナリオ [${storage}] を呼び出します。`);
        await manager.loadScenario(storage, target);
        // loadScenarioが終わったら、gameLoopが次の行から実行を再開する
    } 
    // --- 別のPhaserシーン呼び出しの場合 ---
    else if (storage) {
        // console.log(`[call] サブルーチンシーン [${storage}] を呼び出します。`);
        
        // ★★★ [jump]ハンドラと全く同じロジックで遷移する ★★★
        
        // a. オートセーブを実行
        manager.scene.performSave(0);

        // b. パラメータを解決
        let transitionParams = {};
        if (callParams) {
            try {
                transitionParams = manager.stateManager.getValue(`(${callParams})`);
            } catch (e) {
                console.error(`[call] params属性の解析に失敗しました: "${callParams}"`, e);
            }
        }
        
        // c. SystemSceneに遷移をリクエスト
        const fromSceneKey = manager.scene.scene.key;
        manager.scene.scene.get('SystemScene').events.emit('request-scene-transition', {
            to: storage,
            from: fromSceneKey,
            params: transitionParams
        });
        
        // d. シナリオループを停止
        manager.stop();

    } else {
        console.warn('[call] 有効なstorage属性が指定されていません。');
        // 不正なcallの場合は、積んだスタックを戻すのが親切
        manager.callStack.pop(); 
    }
}