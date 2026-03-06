// in src/components/ReturnHomeComponent.js (新規作成)

export default class ReturnHomeComponent {

    constructor(scene, owner, params = {}) {
        this.gameObject = owner;
        this.scene = owner.scene;

        // --- パラメータ ---
        this.fadeOutDuration = params.fadeOutDuration || 500; // 消えるまでの時間(ms)
        this.repopDelay = params.repopDelay || 1000;      // 再出現までの待機時間(ms)
        this.fadeInDuration = params.fadeInDuration || 500;   // 再出現時の時間(ms)

        // --- 内部状態 ---
        this.homePosition = new Phaser.Math.Vector2(); // 初期位置を記憶する
        this.isReturning = false; // 帰宅中かどうかのフラグ
    }

    start() {
        // --- 1. 自身の初期位置を「故郷」として記憶する ---
        this.homePosition.set(this.gameObject.x, this.gameObject.y);
        // console.log(`[ReturnHome] '${this.gameObject.name}' home set to (${this.homePosition.x}, ${this.homePosition.y})`);
    }

    /**
     * ★★★ ChaseComponentから呼び出される、このコンポーネントの心臓部 ★★★
     * 帰宅プロセスを開始する。
     */
   startReturning() {
        if (this.isReturning) return;
        this.isReturning = true;
        this.gameObject.emit('onAiBehaviorChange', { source: 'ReturnHomeComponent', active: true });
        // console.log(`[ReturnHome] '${this.gameObject.name}' starting to return.`);

        // 物理ボディを一時的に無効化（壁などに引っかからないように）
        if (this.gameObject.body) this.gameObject.body.enable = false;
        
        this.scene.tweens.add({
            targets: this.gameObject,
            alpha: 0,
            duration: this.fadeOutDuration,
            onComplete: () => {
                this.gameObject.setVisible(false); // 見えなくするだけ
                this.scene.time.delayedCall(this.repopDelay, this.repopAtHome, [], this);
            }
        });
    }

    /**
     * 初期位置に再出現（リポップ）させる処理
     */
    repopAtHome() {
        // console.log(`[ReturnHome] '${this.gameObject.name}' repoping.`);
        this.gameObject.setPosition(this.homePosition.x, this.homePosition.y);
        this.gameObject.setVisible(true); // 再び見えるように
        if (this.gameObject.body) this.gameObject.body.enable = true;

        this.scene.tweens.add({
            targets: this.gameObject,
            alpha: 1,
            duration: this.fadeInDuration,
            onComplete: () => {
                this.isReturning = false;
                // 「私の仕事は終わった」とブロードキャスト
                this.gameObject.emit('onAiBehaviorChange', { source: 'ReturnHomeComponent', active: false });
                // console.log(`[ReturnHome] '${this.gameObject.name}' has returned.`);
            }
        });
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
    toggle() { this.isEnabled = !this.isEnabled; } // toggleメソッドを追加


    // このコンポーネントはupdateループを必要としない
}

/**
 * IDEのプロパティパネルに表示するための自己定義
 */
ReturnHomeComponent.define = {
    methods: ['enable', 'disable', 'toggle'],
    params: [
        { key: 'fadeOutDuration', type: 'range', label: 'フェードアウト時間(ms)', min: 100, max: 2000, step: 50, defaultValue: 500 },
        { key: 'repopDelay', type: 'range', label: 'リポップ遅延(ms)', min: 0, max: 5000, step: 100, defaultValue: 1000 },
        { key: 'fadeInDuration', type: 'range', label: 'フェードイン時間(ms)', min: 100, max: 2000, step: 50, defaultValue: 500 }
    ]
};