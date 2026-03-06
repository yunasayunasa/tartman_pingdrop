// src/handlers/events/set_visible.js

/**
 * [set_visible] アクションタグ
 * ターゲットオブジェクトの表示/非表示を切り替えます。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target
 */
export default async function set_visible(interpreter, params, target) {
    if (target && typeof target.setVisible === 'function') {
        const isVisible = params.value !== 'false'; // デフォルトはtrue
        target.setVisible(isVisible);
    } else {
        const targetName = target ? target.name : 'unknown';
        console.warn(`[set_visible] Target '${targetName}' cannot set visibility.`);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
set_visible.define = {
    description: 'ターゲットの表示/非表示を切り替えます。',
    params: [
        { key: 'value', 
           丶type: 'select', // ★ タイプを'select'に
options: ['true', 'false'], // ★ 選択肢のリストを追加
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
label: '表示する',
defaultValue: true
}
]
};