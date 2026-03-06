// src/handlers/events/set_data.js

export default async function set_data(interpreter, params) {
    const name = params.name;
    let value = params.value;

    if (name === undefined || value === undefined) {
        console.warn('[set_data] "name" and "value" parameters are required.');
        return;
    }

    const key = name.startsWith('f.') ? name.substring(2) : name;
    const stateManager = interpreter.scene.registry.get('stateManager');
    if (!stateManager) return;

    // ▼▼▼【デバッグログを追加】▼▼▼
    // console.log(`%c[DEBUG | set_data]これから評価する値(value):`, 'color: orange;', value, `(型: ${typeof value})`);

    let finalValue;
    try {
        finalValue = stateManager.eval(value);
    } catch (e) {
        finalValue = value;
    }
    
    // ▼▼▼【デバッグログを追加】▼▼▼
    // console.log(`%c[DEBUG | set_data]評価後の値(finalValue):`, 'color: orange;', finalValue, `(型: ${typeof finalValue})`);

    stateManager.setF(key, finalValue);
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
set_data.define = {
    description: 'ゲーム変数(f.)に値を設定します。値には式も使えます (例: f.score + 100)。',
    params: [
        { key: 'name', type: 'string', label: '変数名 (f.)', defaultValue: 'f.variable' },
        { key: 'value', type: 'string', label: '設定する値/式', defaultValue: '0' }
    ]
};