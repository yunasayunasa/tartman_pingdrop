const Text = Phaser.GameObjects.Text;

export default class MenuButton extends Text {
    // 依存関係はなし
    static dependencies = [];

    /**
     * @param {Phaser.Scene} scene - この場合はUISceneのインスタンス
     * @param {object} config - UISceneから渡される設定オブジェクト
     */
    constructor(scene, config) {
        // Textオブジェクトとして初期化
        super(scene, 0, 0, 'MENU', { fontSize: '36px', fill: '#fff' });
        this.setOrigin(0.5);

        // クリックされたら、UISceneのパネル切り替えメソッドを呼び出す
        this.setInteractive().on('pointerdown', () => {
            // console.log("MenuButton clicked. Telling UIScene to toggle 'bottom_panel'.");
            // `scene` は UIScene のインスタンスなので、そのメソッドを直接呼べる
            if (scene && typeof scene.togglePanelByName === 'function') {
                scene.togglePanelByName('bottom_panel');
            }
        });
    }

    // 規約に準拠するためのお作法
    updateValue(state) {}
}