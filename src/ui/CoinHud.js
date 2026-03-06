export default class CoinHud extends Phaser.GameObjects.Container {
    // ★★★ 1. 依存関係を静的に自己申告する ★★★
    static dependencies = ['coin'];

    constructor(scene, config) {
        // configオブジェクトから値を取り出す
        const x = config.x || 0;
        const y = config.y || 0;
        
        super(scene, x, y);

        // アイコンとテキストの作成
        const icon = scene.add.image(0, 0, 'coin_icon'); 
        this.add(icon);
        this.coinText = scene.add.text(40, 0, '0', {
            fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0, 0.5);
        this.add(this.coinText);

        scene.add.existing(this);
        
        // ★★★ 削除 ★★★
        // StateManagerの直接購読は行わない
        // this.stateManager = config.stateManager;
        // this.stateManager.on(...);
    }
    
    // ★★★ 2. 規約に沿った更新メソッドを実装する ★★★
    // UISceneから呼び出されることを想定
    updateValue(state) {
        const coinValue = state.coin || 0;
        if (this.coinText && this.coinText.text !== coinValue.toString()) {
            this.coinText.setText(String(coinValue));
        }
    }
    
    // ★★★ 削除 ★★★
    // イベントリスナーを購読しないので、destroyでの解除も不要
    // destroy(fromScene) { ... }
}