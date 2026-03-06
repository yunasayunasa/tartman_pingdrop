// src/handlers/events/run_scenario.js (本当の最終FIX版)
import EngineAPI from '../../core/EngineAPI.js';

export default async function run_scenario(interpreter, params) {
    const file = params.file;
    if (!file) {
        console.warn('[run_scenario] "file" parameter is missing.');
        return '__interrupt__'; // 何もしない場合も中断はする
    }

    // ★ イベントを発行する際に、パラメータを一緒に渡す
    EngineAPI.fireGameFlowEvent('RUN_NOVEL_OVERLAY', { 
        scenario: file 
    });
    
    // VSLの実行をここで中断する
    return '__interrupt__';
}
/**
 * ★ VSLエディタ用の自己定義 ★
 */
run_scenario.define = {
    description: '現在のシーンの上で、オーバーレイとしてノベルパートを再生します。',
    params: [
        { key: 'file', type: 'string', label: 'シナリオファイル名', defaultValue: '' },
        { key: 'block_input', type: 'select', options: ['true', 'false'] ,label: '背後を操作不能に', defaultValue: true }
    ]
};