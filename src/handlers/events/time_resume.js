// src/handlers/events/time_resume.js

/**
 * [time_resume] アクションタグ
 * ゲーム全体の時間を再開します。
 * @param {ActionInterpreter} interpreter
 */
import EngineAPI from '../../core/EngineAPI.js';

export default async function time_resume(interpreter) {
    EngineAPI.resumeTime();
}
/**
 * ★ VSLエディタ用の自己定義 ★
 */
time_resume.define = {
    description: 'ゲーム内世界の時間（物理演算など）を再開します。',
    params: []
};