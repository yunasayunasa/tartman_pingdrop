// src/handlers/events/else.js

/**
 * [else] アクションタグ
 * [if]タグのFalseルートから接続され、Trueルートの処理をスキップして合流するポイントです。
 * 処理の本体は ActionInterpreter 側が特別にハンドリングします。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function _else(interpreter, params) {
    return Promise.resolve();
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
_else.define = {
    description: '[if] の False ルートから接続し、True ルートの処理をスキップします。',
    // ピンの情報を持たないことで、VSLエディタはデフォルトのピン(input/output)を描画する
    params: [] // パラメータは不要
};