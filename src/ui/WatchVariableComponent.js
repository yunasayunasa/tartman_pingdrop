// src/components/ui/WatchVariableComponent.js

export default class WatchVariableComponent {
    constructor(scene, gameObject, params) {
        this.scene = scene;
        this.gameObject = gameObject;
        this.variableToWatch = params.variable;

        this.stateManager = this.scene.registry.get('stateManager');
        if (!this.stateManager) return;

        this.lastValue = null;
        this.listener = (key, value) => this.onVariableChanged(key, value);
        
        // --- StateManagerの変更イベントを購読開始 ---
        this.stateManager.on('f-variable-changed', this.listener);

        // ▼▼▼【ここが、今回の修正の核心です】▼▼▼
        // --------------------------------------------------------------------
        // ★★★ コンポーネントが生成された「後」、次のフレームで初期値を確認する ★★★
        // これにより、他のすべてのオブジェクトの初期化が終わるのを待つことができる。
        this.scene.time.delayedCall(0, () => this.checkInitialValue());
        // --------------------------------------------------------------------
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }

    /**
     * StateManagerから変数の変更通知を受け取ったときの処理
     * @param {string} key - 変更された変数のキー
     * @param {*} value - 新しい値
     */
     onVariableChanged(key, value) {
        if (!this.variableToWatch) return;
        const watchKey = this.variableToWatch.replace('f.', '').trim();
        const eventKey = key.trim();
        
        if (eventKey === watchKey) {
            // ▼▼▼ ログ爆弾 No.2 (再) ▼▼▼
            // console.log(`%c[LOG BOMB 2 | WatchVariable] OK! イベントキー '${eventKey}' が一致しました。これから '${this.gameObject.name}' に対して 'onValueChanged' (ペイロード: ${value}) をemitします。`, 'color: cyan; font-weight: bold; font-size: 1.2em;');
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            this.gameObject.emit('onValueChanged', value, this.lastValue);
            this.lastValue = value;
        }
    }
      /**
     * ★★★ 強化版 ★★★
     * コンポーネント生成時に、一度だけ現在の変数の値を確認し、UIに反映させる
     */
    checkInitialValue() {
        if (!this.variableToWatch) return; // 監視対象がなければ何もしない

        // ★ stateManagerから、現在の最新の値を取得
        const initialValue = this.stateManager.getValue(this.variableToWatch);
        
        // console.log(`%c[WatchVariableComponent] Initial check for '${this.variableToWatch}'. Current value is: ${initialValue}`, "color: yellow;");

        // ★ 値が存在する場合のみ、イベントを発行
        if (initialValue !== undefined) {
            // ★★★ 2回イベントが発行されるのを防ぐため、lastValueと比較する ★★★
            if (this.lastValue !== initialValue) {
                this.gameObject.emit('onValueChanged', initialValue, this.lastValue);
                this.lastValue = initialValue;
            }
        }
    }

    /**
     * このコンポーネントが破棄されるときに呼ばれるクリーンアップ処理
     */
     destroy() {
        if (this.stateManager) {
            // ★★★ 購読した 'f-variable-changed' を解除する ★★★
            this.stateManager.off('f-variable-changed', this.listener);
        }
        // console.log(`[WatchVariableComponent] for ${this.gameObject.name} destroyed.`);
    }
}
WatchVariableComponent.define = {
    params: [
        { 
            key: 'variable',
            type: 'text', // UIはテキスト入力欄
            label: '監視する変数',
            defaultValue: '' // デフォルトは空文字
        }
    ]
};