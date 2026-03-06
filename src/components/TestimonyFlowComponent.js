/**
 * 証言テキストの流れを制御するコンポーネント。
 * 文字を1文字ずつ表示（タイプ音付き）しながら画面内を移動させる。
 */
export default class TestimonyFlowComponent {
    constructor(scene, gameObject, params) {
        this.scene = scene;
        this.gameObject = gameObject; // TextオブジェクトまたはContainer

        this.fullText = params.text || gameObject.text || "";
        this.typingSpeed = params.speed || 50;
        this.moveSpeed = params.moveSpeed || 100;
        this.charIndex = 0;
        this.isTyping = false;
        this.isComplete = false;
        this.typeTimer = null;

        // 初期状態はテキストを空に
        if (typeof gameObject.setText === 'function') {
            gameObject.setText("");
        }

        // シーンの更新ループに登録
        if (this.scene.updatableComponents) {
            this.scene.updatableComponents.add(this);
        }
    }

    start() {
        this.startTyping();
    }

    startTyping() {
        if (this.typeTimer) this.typeTimer.remove();

        this.isTyping = true;
        this.typeTimer = this.scene.time.addEvent({
            delay: this.typingSpeed,
            callback: this.typeNextChar,
            callbackScope: this,
            loop: true
        });
    }

    typeNextChar() {
        if (this.scene.isPaused) return;

        if (this.charIndex < this.fullText.length) {
            this.charIndex++;
            const visibleText = this.fullText.substring(0, this.charIndex);

            if (typeof this.gameObject.setText === 'function') {
                this.gameObject.setText(visibleText);
            }

            // タイプ音再生
            this.playTypeSound();
        } else {
            this.isTyping = false;
            this.isComplete = true;
            if (this.typeTimer) this.typeTimer.remove();
        }
    }

    playTypeSound() {
        const systemScene = this.scene.scene.get('SystemScene');
        if (systemScene && systemScene.soundManager) {
            // 'popopo' を使用
            systemScene.soundManager.playSe('popopo');
        }
    }

    update(time, delta) {
        if (this.scene.isPaused) return;

        // 横移動
        this.gameObject.x -= (this.moveSpeed * delta) / 1000;

        // 画面外判定
        const width = this.gameObject.width || 0;
        if (this.gameObject.x < -width - 100) {
            this.onExitScreen();
        }
    }

    onExitScreen() {
        // ループさせる場合は座標を戻す、そうでない場合は破棄するなどの処理
        // 今回は単純に右端に戻してループとする（暫定）
        this.gameObject.x = this.scene.cameras.main.width + 100;
    }

    destroy() {
        if (this.typeTimer) this.typeTimer.remove();
        if (this.scene.updatableComponents) {
            this.scene.updatableComponents.delete(this);
        }
    }
}
