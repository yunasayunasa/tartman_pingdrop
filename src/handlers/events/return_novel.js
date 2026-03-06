// src/handlers/events/return_novel.js
import EngineAPI from '../../core/EngineAPI.js'; // ★ 1. インポート

export default async function return_novel(interpreter, params) {
    const scene = interpreter.scene;
    if (!scene) return;

    let returnParams = {}; // ★ 変数名を変更して明確化
    if (params.params) {
        try {
            const sanitizedJson = params.params.replace(/'/g, '"');
            returnParams = JSON.parse(sanitizedJson);
        } catch (e) {
            console.error(`[return_novel] "params"の解析に失敗しました。`, e);
        }
    }

    // ★ 2. EngineAPIを呼び出す
    EngineAPI.requestReturnToNovel(scene.scene.key, returnParams);
}
// define部分は変更なし
/**
 * ★ VSLエディタ用の自己定義 ★
 */
return_novel.define = {
    description: '現在のゲームシーンを終了し、ノベルパートに戻ります。',
    params: [
        {
            key: 'params',
            type: 'string',
            label: '復帰後パラメータ',
            defaultValue: ''
        }
    ]
};