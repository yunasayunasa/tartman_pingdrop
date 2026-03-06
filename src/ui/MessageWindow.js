// Containerをインポート（または直接Phaser.GameObjects.Containerを使用）
const Container = Phaser.GameObjects.Container;

export default class MessageWindow extends Container {
    // ★★★ 1. 依存関係を静的に宣言 ★★★
    // MessageWindowはゲーム変数(f)に依存しないため、空配列か、プロパティ自体を定義しない
    static dependencies = [];

    /**
     * @param {Phaser.Scene} scene 
     * @param {object} config - UISceneから渡される設定オブジェクト (x, y, stateManagerなど)
     */
    constructor(scene, config) {
        // コンテナ自身の位置はUISceneが設定するので、(0,0)で初期化
        super(scene, 0, 0);

        // --- 依存サービスの取得 (configから渡されたものを優先) ---
        // ★★★ 2. 依存サービスをconfigから受け取るように変更 ★★★
        this.soundManager = config.soundManager || scene.registry.get('soundManager');
        this.configManager = config.configManager || scene.registry.get('configManager');

        // --- 状態管理プロパティ (変更なし) ---
        this.charByCharTimer = null;
        this.isTyping = false;
        this.typingResolve = null;
        this.currentText = '';
        this.currentSpeaker = null;
        this.fullText = '';

        // --- ウィンドウ背景 (変更なし) ---
        this.windowImage = scene.add.image(0, 0, 'message_window');

        // --- テキストオブジェクト (変更なし) ---
        const padding = 35;
        const textWidth = this.windowImage.width - (padding * 2);
        const textHeight = this.windowImage.height - (padding * 2);
        this.textObject = scene.add.text(
            this.windowImage.x - (this.windowImage.width / 2) + padding,
            this.windowImage.y - (this.windowImage.height / 2) + padding,
            '',
            {
                fontFamily: '"Noto Sans JP", sans-serif',
                fontSize: '36px',
                fill: '#ffffff',
                wordWrap: { width: textWidth, useAdvancedWrap: true },
                fixedWidth: textWidth,
                fixedHeight: textHeight
            }
        );

        // --- クリック待ちアイコン (変更なし) ---
        const iconX = (this.windowImage.width / 2) - 60;
        const iconY = (this.windowImage.height / 2) - 50;
        this.nextArrow = scene.add.image(iconX, iconY, 'next_arrow');
        this.nextArrow.setScale(0.5).setVisible(false);
        this.arrowTween = scene.tweens.add({
            targets: this.nextArrow,
            y: this.nextArrow.y - 10,
            duration: 400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            paused: true
        });

        // --- コンフィグとの連携 (変更なし) ---
        this.textDelay = 50;
        if (this.configManager) {
            this.updateTextSpeed();
            this.configManager.on('change:textSpeed', this.updateTextSpeed, this);
        }

        // --- 全ての要素をコンテナに追加 (変更なし) ---
        this.add([this.windowImage, this.textObject, this.nextArrow]);
        
        // ★★★ 3. UISceneがadd.existing(this)を呼ぶので、シーンへの追加は不要 ★★★
    }

    // ★★★ 4. (推奨) 状態変数に依存しないため、updateValueメソッドを空で定義 ★★★
    // これにより、将来的に何らかのキーをwatchした場合でもエラーを防げる
    updateValue(state) {
        // このコンポーネントは状態変数に応じて表示を更新する必要はない
    }

    // ★★★ 5. (推奨) コンポーネント破棄時にリスナーをクリーンアップする ★★★
    destroy(fromScene) {
        // console.log("MessageWindow: destroyされました。イベントリスナーを解除します。");
        if (this.configManager) {
            this.configManager.off('change:textSpeed', this.updateTextSpeed, this);
        }
        if (this.arrowTween) {
            this.arrowTween.destroy();
        }
        // 親のdestroyを呼び出す（Container内の全要素が破棄される）
        super.destroy(fromScene);
    }
    
    updateTextSpeed() {
        const textSpeedValue = this.configManager.getValue('textSpeed');
        this.textDelay = 100 - textSpeedValue;
    }

    setTypingSpeed(newSpeed) {
        this.textDelay = newSpeed;
    }

    setText(text, useTyping = true, speaker = null) {
        this.typingResolve = null;

        return new Promise(resolve => {
            this.typingResolve = resolve;
            this.currentText = text;
            this.currentSpeaker = speaker;
            this.fullText = text;

            if (this.charByCharTimer) {
                this.charByCharTimer.remove();
                this.charByCharTimer = null;
            }
            this.textObject.setText('');
            this.hideNextArrow();

            const typeSoundMode = this.configManager.getValue('typeSound');

            if (!useTyping || text.length === 0 || this.textDelay <= 0) {
                this.textObject.setText(text);
                this.isTyping = false;
                if (this.typingResolve) this.typingResolve();
                return;
            }
            
            this.isTyping = true;
            let index = 0;
            
            this.charByCharTimer = this.scene.time.addEvent({
                delay: this.textDelay,
                callback: () => {
                    if (typeSoundMode === 'se') {
                        this.soundManager.playSe('popopo');
                    }
                    this.textObject.text += this.fullText[index];
                    index++;
                    if (index === this.fullText.length) {
                        if(this.charByCharTimer) this.charByCharTimer.remove();
                        this.charByCharTimer = null;
                        this.isTyping = false;
                        if (this.typingResolve) this.typingResolve();
                    }
                },
                callbackScope: this,
                loop: true
            });
        });
    }

    skipTyping() {
        if (!this.isTyping || !this.charByCharTimer) return;

        this.charByCharTimer.remove();
        this.charByCharTimer = null;
        this.isTyping = false;
        
        this.textObject.setText(this.fullText);
        
        if (this.typingResolve) {
            this.typingResolve();
            this.typingResolve = null;
        }
    }

    reset() {
        this.textObject.setText('');
        this.currentText = '';
        this.currentSpeaker = null;
        this.isTyping = false;
        if (this.charByCharTimer) {
            this.charByCharTimer.remove();
            this.charByCharTimer = null;
        }
        this.hideNextArrow();
    }

    showNextArrow() {
        this.nextArrow.setVisible(true);
        if (this.arrowTween && this.arrowTween.isPaused()) {
            this.arrowTween.resume();
        }
    }
    
    hideNextArrow() {
        this.nextArrow.setVisible(false);
        if (this.arrowTween && this.arrowTween.isPlaying()) {
            this.arrowTween.pause();
        }
    }
}