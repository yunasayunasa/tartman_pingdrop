// src/core/TimeManager.js

/**
 * ゲーム全体の時間（特に物理エンジン）の停止・再開を管理する専門クラス。
 */
export default class TimeManager {
    /** @type {Phaser.Game} */
    game; // PhaserのGameインスタンスを直接保持

    _isTimeStopped = false;

    constructor(gameInstance) {
        this.game = gameInstance;
    }

    /**
     * 時間が停止しているかどうかを取得する。
     * @returns {boolean}
     */
    get isTimeStopped() {
        return this._isTimeStopped;
    }

    /**
     * 時間を停止または再開する。
     * @param {boolean} value 
     */
    setTimeStop(value) {
        if (this._isTimeStopped === value) return;
        this._isTimeStopped = value;
        this._broadcastTimeScale(); // 状態が変化したら、伝播させる
    }

    /**
     * 時間を停止する。
     */
    stopTime() {
        this.setTimeStop(true);
    }

    /**
     * 時間を再開する。
     */
    resumeTime() {
        this.setTimeStop(false);
    }

    /**
     * アクティブな全シーンに、タイムスケールを伝播させる (SystemSceneから移植)
     * @private
     */
    _broadcastTimeScale() {
        const newTimeScale = this._isTimeStopped ? 0 : 1;
        // console.log(`%c[TimeManager] Broadcasting new timeScale: ${newTimeScale}`, "color: #9C27B0; font-weight: bold;");

        for (const scene of this.game.scene.getScenes(true)) {
            if (scene.matter && scene.matter.world) {
                scene.matter.world.engine.timing.timeScale = newTimeScale;
            }
        }
    }
}