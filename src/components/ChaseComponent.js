// in src/components/ChaseComponent.js (リファクタリング後)

export default class ChaseComponent {
    constructor(scene, owner, params = {}) {
        this.gameObject = owner;
        this.scene = owner.scene;
        this.npcController = null;
        this.returnHome = null;
        this.chaseSpeed = params.chaseSpeed || 3;
        this.state = 'IDLE';
        this.chaseTarget = null;
        this.enabled = true;

        // ★索敵ロジックに関するプロパティは不要になるので削除
        // this.targetGroup = ...
        // this.detectionType = ...
        // this.visionAngle = ...
        // this.detectionRadius = ...
        // this.giveUpRadius = ...
        // this.visionCone = ...
    }

    start() {
        this.npcController = this.gameObject.components.NpcController;
        if (!this.npcController) {
          
            this.enabled = false;
            return;
        }
        
        this.returnHome = this.gameObject.components.ReturnHomeComponent;

        // --- ★ イベントリスナーの登録 ---
        this.gameObject.on('onAiBehaviorChange', this.handleBehaviorChange, this);
        // ★ DetectionAreaComponentが発するイベントをリッスンする
        this.gameObject.on('onAreaEnter', this.onTargetDetected, this);
        this.gameObject.on('onAreaLeave', this.onTargetLost, this);
        this.scene.time.delayedCall(500, () => {
        console.group("%c[PHYSICS DEBUG] Body Inspection", "color: red; font-size: 1.5em;");

        // 1. センサーボディを調べる
        const detectionArea = this.gameObject.components.DetectionAreaComponent;
        if (detectionArea && detectionArea.sensorBody) {
// // console.log("▼ SENSOR BODY ▼", detectionArea.sensorBody);
// // console.log("SENSOR collisionFilter:", detectionArea.sensorBody.collisionFilter);
        } else {
           
        }

        // 2. プレイヤーボディを調べる
        const player = this.scene.children.getByName('player');
        if (player && player.body) {
// // console.log("▼ PLAYER BODY ▼", player.body);
// // console.log("PLAYER collisionFilter:", player.body.collisionFilter);
        } else {
            console.error("Player body NOT FOUND in the scene!");
        }
        console.groupEnd();
    });
    }

    handleBehaviorChange(event) {
        if (event.source === 'ChaseComponent') return;
        this.enabled = !event.active;
    }

    // ★★★ onTargetDetected: DetectionAreaComponentから呼ばれる新しいメソッド ★★★
    onTargetDetected(target) {
        if (!this.enabled || this.state === 'CHASING') return;

// // console.log(`[ChaseComponent] Target '${target.name}' detected!`);
        this.chaseTarget = target;
        this.startChasing();
    }

    // ★★★ onTargetLost: DetectionAreaComponentから呼ばれる新しいメソッド ★★★
    onTargetLost(target) {
        // 見失ったターゲットが、現在追跡中のターゲットと同じなら追跡をやめる
        if (this.state === 'CHASING' && this.chaseTarget === target) {
// // console.log(`[ChaseComponent] Target '${target.name}' lost!`);
            this.stopChasing();
        }
    }

    update(time, delta) {
        if (!this.npcController || !this.gameObject.active || !this.enabled) {
            return;
        }
        
        // ★ update内から索敵ロジックを全て削除！
        
        // --- 追跡中の処理だけが残る ---
        if (this.state === 'CHASING') {
            if (!this.chaseTarget || !this.chaseTarget.active || this.chaseTarget.getData('group') === 'hidden') {
                this.stopChasing();
                return;
            }

            const angle = Phaser.Math.Angle.BetweenPoints(this.gameObject, this.chaseTarget);
            const vx = Math.cos(angle) * this.chaseSpeed;
            const vy = Math.sin(angle) * this.chaseSpeed;
            this.npcController.move(vx, vy);
        }
    }

    startChasing() {
        if (this.state === 'CHASING') return;
        this.state = 'CHASING';
        this.gameObject.emit('onAiBehaviorChange', { source: 'ChaseComponent', active: true });
    }

    stopChasing() {
        if (this.state === 'IDLE') return;
        this.state = 'IDLE';
        this.chaseTarget = null; // ターゲットをクリア
        this.npcController.stop();
        this.gameObject.emit('onAiBehaviorChange', { source: 'ChaseComponent', active: false });

        if (this.returnHome?.startReturning) {
            this.returnHome.startReturning();
        }
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
    toggle() { this.isEnabled = !this.isEnabled; } // toggleメソッドを追加


    destroy() {
        // ★ リスナーの解除を追加
        if (this.gameObject?.off) {
            this.gameObject.off('onAiBehaviorChange', this.handleBehaviorChange, this);
            this.gameObject.off('onAreaEnter', this.onTargetDetected, this);
            this.gameObject.off('onAreaLeave', this.onTargetLost, this);
        }
    }
}

// ★★★ defineプロパティをシンプル化 ★★★
ChaseComponent.define = {
    methods: ['enable', 'disable', 'toggle'],
    params: [
        { key: 'chaseSpeed', type: 'range', label: '追跡速度', min: 1, max: 10, step: 0.5, defaultValue: 3 }
        // 索敵関連のパラメータは全てDetectionAreaComponentに移管されるため不要
    ]
};
