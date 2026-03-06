
const Container = Phaser.GameObjects.Container;
const Rectangle = Phaser.GameObjects.Rectangle;
const Text = Phaser.GameObjects.Text;

export default class BottomPanel extends Container {
    /**
     * @param {Phaser.Scene} scene - この場合はUISceneのインスタンス
     * @param {object} config - UISceneから渡される設定オブジェクト
     */
    constructor(scene, config) {
        super(scene, config.x, config.y); // JSONから渡された座標を使う

        // ★★★ 司令塔(SystemScene)への参照を最初に、かつ安全に取得 ★★★
        const systemScene = scene.scene.get('SystemScene');
        if (!systemScene) {
            console.error("BottomPanel: SystemScene could not be found.");
            return;
        }

        const gameWidth = scene.scale.width;

        // パネル背景
        const panelBg = new Rectangle(scene, gameWidth / 2, 0, gameWidth, 120, 0x000000, 0.8).setInteractive();
        
        // ★★★ イベントハンドラの正しい書き方 ★★★
        panelBg.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });


        // 各ボタンを生成
        const buttonStyle = { fontSize: '32px', fill: '#fff' };
        const saveButton = new Text(scene, 0, 0, 'セーブ', buttonStyle).setOrigin(0.5).setInteractive();
        const loadButton = new Text(scene, 0, 0, 'ロード', buttonStyle).setOrigin(0.5).setInteractive();
        const backlogButton = new Text(scene, 0, 0, '履歴', buttonStyle).setOrigin(0.5).setInteractive();
        const configButton = new Text(scene, 0, 0, '設定', buttonStyle).setOrigin(0.5).setInteractive();
        const autoButton = new Text(scene, 0, 0, 'オート', buttonStyle).setOrigin(0.5).setInteractive();
        const skipButton = new Text(scene, 0, 0, 'スキップ', buttonStyle).setOrigin(0.5).setInteractive();
        
        this.add([panelBg, saveButton, loadButton, backlogButton, configButton, autoButton, skipButton]);

        // ボタンのレイアウト
        const buttons = [saveButton, loadButton, backlogButton, configButton, autoButton, skipButton];
        const areaStartX = 250;
        const areaWidth = gameWidth - areaStartX - 100;
        const buttonMargin = areaWidth / buttons.length;
        buttons.forEach((button, index) => {
            button.setX(areaStartX + (buttonMargin * index) + (buttonMargin / 2));
        });

         saveButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            systemScene.events.emit('request-subscene', { targetScene: 'SaveLoadScene', launchData: { mode: 'save' } });
        });

        loadButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            systemScene.events.emit('request-subscene', { targetScene: 'SaveLoadScene', launchData: { mode: 'load' } });
        });

        autoButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            systemScene.events.emit('request-gamemode-toggle', 'auto');
        });

        skipButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            systemScene.events.emit('request-gamemode-toggle', 'skip');
        });
 backlogButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            systemScene.events.emit('request-subscene', { targetScene: 'BacklogScene' });
        });

        configButton.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            systemScene.events.emit('request-subscene', { targetScene: 'ConfigScene' });
        });

        // ... (他のボタンも同様に) ...
    }


    // 規約に準拠するためのお作法
    updateValue(state) {}
}