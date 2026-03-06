import BaseGameScene from './BaseGameScene.js';

/**
 * 裁判パート用のシーン。
 * BaseGameSceneを継承し、証言のフロー制御、ポーズ機能、タイマー管理を追加する。
 */
export default class TrialScene extends BaseGameScene {
    constructor() {
        super({ key: 'TrialScene' });
        this.isPaused = false;
        this.timer = null;
        this.currentTime = 0;
        this.maxTime = 300; // デフォルト300秒
    }

    init(data) {
        super.init(data);
        if (data && data.maxTime) {
            this.maxTime = data.maxTime;
        }
        this.currentTime = this.maxTime;
    }

    create() {
        super.create();

        // 議論開始イベントの待機
        this.events.on('START_DEBATE', this.startDebate, this);
        this.events.on('PAUSE_TRIAL', this.setPause, this, true);
        this.events.on('RESUME_TRIAL', this.setPause, this, false);

        this.events.emit('scene-ready');
    }

    startDebate() {
        // タイマーの開始
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        if (this.isPaused) return;

        this.currentTime--;
        this.registry.get('stateManager').setF('trial_timer', this.currentTime);

        if (this.currentTime <= 0) {
            this.handleTimeUp();
        }
    }

    handleTimeUp() {
        console.log('[TrialScene] Time Up!');
        this.events.emit('TIME_UP');
        // GameFlowManager等を通じてゲームオーバーへ
        const systemScene = this.scene.get('SystemScene');
        if (systemScene && systemScene.gameFlowManager) {
            systemScene.gameFlowManager.handleEvent('GAME_OVER');
        }
    }

    setPause(pause) {
        this.isPaused = pause;
        // シーン内の全オブジェクトの物理/アニメーション停止を検討
        if (pause) {
            this.matter.world.pause();
            this.updatableComponents.forEach(comp => {
                if (comp.onPause) comp.onPause();
            });
        } else {
            this.matter.world.resume();
            this.updatableComponents.forEach(comp => {
                if (comp.onResume) comp.onResume();
            });
        }
    }

    update(time, delta) {
        if (this.isPaused) return;
        super.update(time, delta);
    }
}
