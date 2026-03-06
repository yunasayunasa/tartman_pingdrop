/**
 * 証言が変化した際などに「議論進行…」というメッセージを表示するコンポーネント。
 */
export default class ProgressIndicatorComponent {
    constructor(scene, gameObject, params) {
        this.scene = scene;
        this.gameObject = gameObject; // テキストオブジェクト
        this.gameObject.setVisible(false);
    }

    show(message = "議論進行…", duration = 2000) {
        this.gameObject.setText(message);
        this.gameObject.setVisible(true);
        this.gameObject.setAlpha(0);

        // フェードイン・アウトのアニメーション
        this.scene.tweens.add({
            targets: this.gameObject,
            alpha: 1,
            duration: 500,
            yoyo: true,
            hold: duration,
            onComplete: () => {
                this.gameObject.setVisible(false);
                this.scene.events.emit('PROGRESS_INDICATOR_COMPLETE');
            }
        });
    }
}
