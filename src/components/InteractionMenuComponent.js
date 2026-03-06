/**
 * 裁判中のインタラクション（反論/賛成/疑問）メニューを表示するコンポーネント。
 */
export default class InteractionMenuComponent {
    constructor(scene, gameObject, params) {
        this.scene = scene;
        this.gameObject = gameObject; // 通常、メニュー用のContainer
        this.menuItems = [];
        this.onSelection = params.onSelection || null;

        this.gameObject.setVisible(false);
    }

    show(highlightData) {
        this.gameObject.removeAll(true);
        this.gameObject.setVisible(true);

        const choices = highlightData.choices || [
            { text: "反論する", type: "contradict" },
            { text: "賛成する", type: "agree" },
            { text: "問い詰める", type: "doubt" }
        ];

        choices.forEach((choice, index) => {
            this.createChoiceButton(choice, index);
        });

        // 背景などの装飾
        // ...
    }

    createChoiceButton(choice, index) {
        const y = index * 60;
        const btn = this.scene.add.text(0, y, choice.text, {
            fontSize: '24px',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
            this.hide();
            if (this.onSelection) {
                this.onSelection(choice);
            }
        });

        this.gameObject.add(btn);
    }

    hide() {
        this.gameObject.setVisible(false);
    }
}
