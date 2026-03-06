// src/handlers/events/eval.js

/**
 * [eval] アクションタグ
 * StateManager経由で、任意のJavaScript式を実行します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target - デフォルトの'self'ターゲット
 */
export default async function eval_expression(interpreter, params, target) {
    if (!params.exp) {
        console.warn('[eval tag] Missing required parameter: exp');
        return;
    }

    const scene = interpreter.scene;
    const stateManager = scene.registry.get('stateManager');
    if (!stateManager) return;

    try {
        const context = {
            source: interpreter.currentSource,
            target: interpreter.currentTarget,
            self: target
        };
        stateManager.execute(params.exp, context); 
    } catch (e) {
        console.error(`[eval tag] Error executing expression: "${params.exp}"`, e);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
eval_expression.define = {
    description: '任意のJavaScript式を実行します。変数の操作には setF() を使います。',
    params: [
        { key: 'exp', type: 'string', label: '実行する式', defaultValue: "setF('variable', 10)" }
    ]
};