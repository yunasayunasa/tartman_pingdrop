/**
 * [jump] タグ - シーン遷移 / ラベルジャンプ
 * 
 * 他のPhaserシーンへ遷移するか、現在のシナリオファイル内のラベルへジャンプします。
 * シーン遷移の際は、オートセーブを実行し、パラメータを渡すことができます。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { storage, target, params }
 */
import EngineAPI from '../../core/EngineAPI.js'; // ★ インポート
export default async function handleJump(manager, params) {
    
    // --- シーン間遷移の場合 ---
    if (params.storage) {
        const toSceneKey = params.storage;
        // console.log(`[jump] シーン[${toSceneKey}]へ遷移します。`);

        // 1. オートセーブを実行
        manager.scene.performSave(0);

        // 2. 遷移先に渡すパラメータを解決
        let transitionParams = {};
        if (params.params) {
            try {
                // params="{ key1: f.value1, key2: 'some_string' }" のような形式を想定
                // StateManagerのgetValueを使って、安全にオブジェクトを生成する
                transitionParams = manager.stateManager.getValue(`(${params.params})`);
            } catch (e) {
                console.error(`[jump] params属性の解析に失敗しました: "${params.params}"`, e);
                transitionParams = {}; // 失敗した場合は空のオブジェクトにする
            }
        }
        
           const fromSceneKey = manager.scene.scene.key;
       
        

      // ★ 1. まずは遷移リクエストを確実に発行する
        EngineAPI.requestJump(fromSceneKey, toSceneKey, transitionParams);
    
        // ★ 2. そして、即座に、同期的に、自分の仕事を終える
        manager.stop();
        // console.log(`[handleJump] Ordering parent scene (${manager.scene.scene.key}) to shut down.`);
        manager.scene.scene.stop();
    
    } else if (params.target && params.target.startsWith('*')) {
        manager.jumpTo(params.target);
    } else {
        console.warn('[jump] 有効なstorage属性またはtarget属性が指定されていません。');
    }
}