
// src/components/ui/TextDisplayComponent.js

export default class TextDisplayComponent {
    /**
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Text} gameObject - ★アタッチ先はTextオブジェクトを想定
     * @param {object} params
     * @param {string} params.template - 表示テンプレート (例: "SCORE: {value}")
     */
    constructor(scene, gameObject, params) {
        this.scene = scene;
        this.gameObject = gameObject;
        this.template = params.template || "{value}"; // デフォルトは値そのものを表示

        // --- ガード節: アタッチ先がTextオブジェクトでなければ警告を出す ---
        if (!(this.gameObject instanceof Phaser.GameObjects.Text)) {
            console.warn(`[TextDisplayComponent] This component should be attached to a Text object, but was attached to a ${gameObject.constructor.name}.`);
            return;
        }

        // --- 神経からの信号を待つ ---
        this.gameObject.on('onValueChanged', this.updateText, this);
    }

    /**
     * WatchVariableComponentから'onValueChanged'イベントが発行されたときに呼ばれる
     * @param {*} currentValue - 現在の値 (数値でも文字列でもOK)
     */
     updateText(currentValue) {
        // console.log(`%c[LOG BOMB 3 | TextDisplay] OK! '${this.gameObject.name}' が 'onValueChanged' を受信しました。ペイロード: ${currentValue}`, 'color: lime;');
        
        const newText = this.template.replace('{value}', currentValue);
        this.gameObject.setText(newText);
        this.gameObject.dirty = true;
        
       
    }

    destroy() {
        this.gameObject.off('onValueChanged', this.updateText, this);
    }
}

TextDisplayComponent.define = {
    params: [
        { 
            key: 'template',
            type: 'text',
            label: '表示テンプレート',
            defaultValue: '{value}'
        }
    ]
};