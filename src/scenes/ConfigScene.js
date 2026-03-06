export default class ConfigScene extends Phaser.Scene {
    constructor() {
        super('ConfigScene');
        // constructorでは、キーの定義と、プロパティの存在宣言だけを行う
        this.configManager = null;
        this.uiElements = [];
    }

    create() {
            this.scene.bringToTop();

        // console.log("ConfigScene: create 開始");

        // ★★★ 1. createの冒頭で、プロパティを確実に初期化する ★★★
        this.configManager = this.sys.registry.get('configManager');
        // 前回作られたUI要素があれば、すべて破棄して配列を空にする
        this.uiElements.forEach(el => el.destroy());
        this.uiElements = [];

        // --- 2. UIのセットアップ (背景、タイトル、戻るボタン) ---
        const bg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.9).setOrigin(0, 0);
        const title = this.add.text(this.scale.width / 2, 100, 'コンフィグ', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        const backButton = this.add.text(this.scale.width - 100, 50, '戻る', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        
        // 生成したUI要素を、管理リストに追加
        this.uiElements.push(bg, title, backButton);

        backButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
            this.scene.resume('UIScene');
        });

        // --- 3. 設定項目を定義から自動生成 ---
          const configDefs = this.configManager.getDefs();
        
        let y = 250;
        for (const key in configDefs) {
            const def = configDefs[key];
            
            const label = this.add.text(100, y, def.label, { fontSize: '32px', fill: '#fff' }).setOrigin(0, 0.5);
            this.uiElements.push(label);

            if (def.type === 'slider') {
                const valueText = this.add.text(1280 - 400, y, this.configManager.getValue(key), { fontSize: '32px', fill: '#fff' }).setOrigin(1, 0.5);
                const minusButton = this.add.text(1280 - 300, y, '-', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5).setInteractive();
                const plusButton = this.add.text(1280 - 200, y, '+', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5).setInteractive();
                this.uiElements.push(valueText, minusButton, plusButton);

                const updateValue = (newValue) => {
                    newValue = Phaser.Math.Clamp(newValue, def.min, def.max);
                    newValue = parseFloat((Math.round(newValue / def.step) * def.step).toFixed(2));
                    this.configManager.setValue(key, newValue);
                    valueText.setText(this.configManager.getValue(key));
                };
                minusButton.on('pointerdown', () => updateValue(this.configManager.getValue(key) - def.step));
                plusButton.on('pointerdown', () => updateValue(this.configManager.getValue(key) + def.step));

            } else if (def.type === 'option') {
                const options = def.options;
                const currentValue = this.configManager.getValue(key);
                let buttonX = 1280 - 150;

                Object.keys(options).reverse().forEach(optionKey => {
                    const optionLabel = options[optionKey];
                    const button = this.add.text(buttonX, y, optionLabel, { fontSize: '32px' }).setOrigin(1, 0.5).setInteractive().setPadding(10);
                    this.uiElements.push(button);
                    
                    if (optionKey === currentValue) {
                        button.setBackgroundColor('#555');
                    }
                    
                    button.on('pointerdown', () => {
                        this.configManager.setValue(key, optionKey);
                        this.scene.restart(); 
                    });
                    buttonX -= button.width + 20;
                });
            }
            y += 100;
        }
    }
}