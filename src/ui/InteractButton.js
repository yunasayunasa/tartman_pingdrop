// in src/ui/InteractButton.js (最終・確定FIX版)

import Button from './Button.js'; // 汎用ボタンクラスをインポート

export default class InteractButton extends Button {

    constructor(scene, params) {
        // --- 1. まず、親クラスに見た目を作ってもらう ---
        super(scene, params);

        // --- 2. 親が登録した'pointerdown'リスナーを、一度完全にクリアする ---
        this.off('pointerdown');
        
        // --- 3. このクラス専用の、新しい'pointerdown'リスナーを登録する ---
        this.on('pointerdown', this.onPointerDown, this);
    }
    
    /**
     * ★★★ このクラスの心臓部 ★★★
     * ボタンがクリックされたときに、直接実行される。
     */
    onPointerDown() {
        // 1. ボタンのアニメーションは、親と同じものを実行する
        this.scene.tweens.add({ targets: this, scale: 0.95, duration: 80, yoyo: true });

        // 2. ゲームプレイシーンを探す
        const gameScene = this.scene.scene.manager.getScenes(true).find(s =>
            s.scene.key !== 'UIScene' &&
            s.scene.key !== 'SystemScene' &&
            s.scene.key !== 'PreloadScene'
        );

        // 3. ゲームプレイシーンにイベントを発火させる
        if (gameScene) {
            gameScene.events.emit('interact_button_pressed');
            // console.log(`[InteractButton] Fired 'interact_button_pressed' on scene '${gameScene.scene.key}'.`);
        } else {
            console.warn('[InteractButton] Could not find an active game scene to fire event on.');
        }
    }
    
    // setTextなどの、見た目を変更するメソッドは、親クラスのものをそのまま使うので、
    // このクラスに再定義する必要はない。
}