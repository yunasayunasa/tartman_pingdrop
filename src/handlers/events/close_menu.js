// src/handlers/events/close_menu.js (最終FIX・改訂版)
import EngineAPI from '../../core/EngineAPI.js';

export default async function close_menu(interpreter) {
    // ★「ゲームを再開してくれ」と、CEOにお願いする
    EngineAPI.fireGameFlowEvent('CLOSE_PAUSE_MENU');
}