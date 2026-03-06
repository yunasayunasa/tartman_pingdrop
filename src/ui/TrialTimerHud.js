/**
 * 裁判パート用のタイマーHUD。
 * StateManagerの f.trial_timer を監視して表示する。
 */
export default class TrialTimerHud extends Phaser.GameObjects.Container {
    static get dependencies() {
        return ['trial_timer'];
    }

    constructor(scene, x, y, params) {
        super(scene, x, y);

        this.timerText = scene.add.text(0, 0, 'TIME: 0:00', {
            fontSize: '32px',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 4,
            fontStyle: 'bold'
        });
        this.add(this.timerText);

        scene.add.existing(this);
    }

    /**
     * 監視対象の変数が変更された時に呼び出される
     * @param {object} state - 現在の変数の値 { trial_timer: value }
     */
    updateValue(state) {
        if (state.trial_timer !== undefined) {
            const totalSeconds = state.trial_timer;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            this.timerText.setText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`);

            // 残り時間が少なくなったら点滅させるなどの演出も可能
            if (totalSeconds < 30) {
                this.timerText.setTint(0xffffff);
                if (totalSeconds % 2 === 0) this.timerText.setTint(0xff0000);
            }
        }
    }
}
