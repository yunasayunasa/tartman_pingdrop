// src/handlers/events/set_ui_visible.js

/**
 * [set_ui_visible] アクションタグ
 * 指定されたグループに属するUI要素の表示/非表示を切り替えます。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 */
export default async function set_ui_visible(interpreter, params) {
    const group = params.group;
    if (!group) {
        console.warn('[set_ui_visible] "group" parameter is missing.');
        return;
    }

    const visible = params.visible !== 'false'; // デフォルトはtrue

    const uiScene = interpreter.scene.scene.get('UIScene');
    if (uiScene && typeof uiScene.setGroupVisible === 'function') {
        uiScene.setGroupVisible(group, visible);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
set_ui_visible.define = {
    description: '指定されたUIグループ全体の表示/非表示を切り替えます。',
    params: [
        { key: 'group', type: 'string', label: 'UIグループ名', defaultValue: '' },
        { key: 'visible', ype: 'boolean',type: 'select', options: ['true', 'false'], label: '表示する', defaultValue: true }
    ]
};