import EngineAPI from '../../core/EngineAPI.js';

export default async function time_stop(interpreter) {
    EngineAPI.stopTime();
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
time_stop.define = {
    description: 'ゲーム内世界の時間（物理演算など）を停止させます。UIアニメーションなどは影響を受けません。',
    params: []
};