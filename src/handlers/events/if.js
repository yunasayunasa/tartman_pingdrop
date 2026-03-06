// src/handlers/events/if.js

/**
 * [if] アクションタグ
 * 条件式(exp)を評価し、結果に応じて実行フローを分岐させます。
 * 処理の本体は ActionInterpreter 側が特別にハンドリングします。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function _if(interpreter, params) {
    // このハンドラ自体は何も実行せず、即座に終了します。
    // 分岐ロジックは ActionInterpreter の責務です。
    return Promise.resolve();
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
_if.define = {
    description: '条件式を評価し、結果に応じてTrue/Falseのルートに処理を分岐します。',
    // VSLエディタに、このノードが持つピンの種類を教える
    pins: {
        inputs: [{ name: 'input' }], // 入力ピン
        outputs: [
            { name: 'output_true', label: 'True' }, // Trueの場合の出力ピン
            { name: 'output_false', label: 'False' } // Falseの場合の出力ピン
        ]
    },
    params: [
        { 
            key: 'exp', 
            type: 'string', 
            label: '条件式 (exp)', 
            defaultValue: 'f.hoge === true',
            required: true
        }
    ]
};