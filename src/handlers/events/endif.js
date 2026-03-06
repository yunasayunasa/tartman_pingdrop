// src/handlers/events/endif.js

/**
 * [endif] アクションタグ
 * [if]タグのTrueルートと、[else]タグのルートが合流するポイントです。
 * 処理の本体は ActionInterpreter 側が特別にハンドリングします。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function endif(interpreter, params) {
    return Promise.resolve();
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
endif.define = {
    description: '[if] からの分岐を合流させ、処理を続行します。',
    params: [] // パラメータは不要
};