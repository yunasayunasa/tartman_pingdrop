// src/handlers/events/open_menu.js (最終FIX・改訂版)
import EngineAPI from '../../core/EngineAPI.js';

export default async function open_menu(interpreter, params) {
    // console.log(`%c[VSL LOG] Firing Game Flow Event: OPEN_PAUSE_MENU`, 'color: #2196F3;');
    
    // ★「ポーズ状態にしてくれ」と、CEOにお願いする
    EngineAPI.fireGameFlowEvent('OPEN_PAUSE_MENU');

    // ★ 遷移系ではないので '__interrupt__' は不要
}
// defineの params.layout はもう使わないので削除しても良い