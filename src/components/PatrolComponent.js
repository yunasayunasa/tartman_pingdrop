// src/components/PatrolComponent.js

export default class PatrolComponent {
    constructor(scene, owner, params = {}) {
        this.gameObject = owner;
        this.scene = scene;
        this.npcController = null;
        
        this.currentWaypoint = null; // ★ 現在のターゲットウェイポイント
        this.state = 'PATROLLING';
        this.waitTimer = 0;
        this.enabled = true;
    }

    start() {
        this.npcController = this.gameObject.components.NpcController;
        if (!this.npcController) { this.enabled = false; return; }

        this.scene.time.delayedCall(0, () => {
            const params = this.getCurrentParams();
            
            // ★ パトロールの「開始地点」となるウェイポイントを探す
            this.currentWaypoint = this.scene.children.getByName(params.startWaypoint);

            if (!this.currentWaypoint) {
                console.warn(`[PatrolComponent] Start waypoint '${params.startWaypoint}' not found. Disabling.`);
                this.enabled = false;
            } else {
// // console.log(`[PatrolComponent] Patrolling enabled. Starting at '${this.currentWaypoint.name}'.`);
            }
        }, [], this);

        this.gameObject.on('onAiBehaviorChange', this.handleBehaviorChange, this);
    }

   update(time, delta) {
    if (!this.enabled || !this.currentWaypoint) return;

    if (this.state === 'PATROLLING') {
        const distance = Phaser.Math.Distance.BetweenPoints(this.gameObject, this.currentWaypoint);
        const params = this.getCurrentParams();

        // ウェイポイントに到着したら
        if (distance < params.arrivalThreshold) {
            this.npcController.stop();
            this.state = 'WAITING';
            this.waitTimer = time + params.waitTime;
            
            // ★★★ 次のウェイポイントを探しに行く処理をここで行う ★★★
            const nextWaypointName = this.currentWaypoint.getData('nextWaypoint');
            if (nextWaypointName) {
                const nextWaypoint = this.scene.children.getByName(nextWaypointName);
                if (nextWaypoint) {
                    this.currentWaypoint = nextWaypoint; // 次のターゲットを「予約」する
                } else {
                    this.currentWaypoint = null;
                }
            } else {
                this.currentWaypoint = null;
            }
        } else {
                // --- 移動中の処理 (変更なし) ---
                const angle = Phaser.Math.Angle.BetweenPoints(this.gameObject, this.currentWaypoint);
            let vx = 0;
            let vy = 0;
            const speed = this.npcController.moveSpeed;
            
            // --- ▼▼▼ ここからが8軸対応のロジック ▼▼▼ ---
            if (params.is8Way) {
                // 8方向移動の場合：角度をそのまま速度ベクトルに変換
                vx = Math.cos(angle) * speed;
                vy = Math.sin(angle) * speed;
            } else {
                // 4方向移動（水平・垂直）の場合
                const angleDeg = Phaser.Math.RadToDeg(angle);
                if (Math.abs(angleDeg) < 45 || Math.abs(angleDeg) > 135) {
                    // 左右の移動を優先
                    vx = (Math.abs(angleDeg) < 45) ? speed : -speed;
                    vy = 0;
                } else {
                    // 上下の移動を優先
                    vx = 0;
                    vy = (angleDeg > 0) ? speed : -speed;
                }
            }
            // --- ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ ---
            
            this.npcController.move(vx, vy);
        }
    } 
    else if (this.state === 'WAITING') {
        if (time > this.waitTimer) {
            // ★★★ 待機時間が終わった後、ここで再度次のウェイポイントを探す ★★★
            if (this.currentWaypoint) {
                // 次の目的地が設定されていれば、パトロール再開
                this.state = 'PATROLLING';
            } else {
                // 待機時間が終わっても、次の目的地が見つからない場合
                // （ここでパトロールを終了させるか、あるいは最初の地点に戻るか、仕様次第）
// // console.log(`[PatrolComponent] End of path reached and no next waypoint found after waiting.`);
                this.enabled = false;
            }
        }
    }
}

    handleBehaviorChange(event) {
        // 自分自身が発行したイベントは無視
        if (event.source === 'PatrolComponent') return;
        
        // 他のAIコンポーネントがアクティブになったら、自分は無効になる
        this.enabled = !event.active;

        if (this.enabled) {
            // 活動再開
            this.state = 'PATROLLING';
        } else {
            // 活動停止
            this.npcController.stop();
        }
    }

    getCurrentParams() {
        const allCompsData = this.gameObject.getData('components') || [];
        const myData = allCompsData.find(c => c.type === 'PatrolComponent');
        const defaultParams = PatrolComponent.define.params.reduce((acc, p) => ({...acc, [p.key]: p.defaultValue}), {});
        return myData ? { ...defaultParams, ...myData.params } : defaultParams;
    }

    enable() { this.isEnabled = true; }
    disable() { this.isEnabled = false; }
    toggle() { this.isEnabled = !this.isEnabled; } // toggleメソッドを追加

    
    destroy() {
        if (this.gameObject?.off) {
            this.gameObject.off('onAiBehaviorChange', this.handleBehaviorChange, this);
        }
    }
}

PatrolComponent.define = {
    methods: ['enable', 'disable', 'toggle'],
    params: [
        // ★ 'pathGroup' を 'startWaypoint' に変更
        { key: 'startWaypoint', type: 'text', label: 'Start Waypoint', defaultValue: 'waypoint_A_01' },
        { key: 'waitTime', type: 'range', label: 'Wait Time (ms)', min: 0, max: 10000, step: 100, defaultValue: 2000 },
        { key: 'arrivalThreshold', type: 'range', label: 'Arrival Threshold', min: 5, max: 100, step: 1, defaultValue: 10 },
        { key: 'is8Way', type: 'checkbox', label: '8-Way Movement', defaultValue: true }
    ]
};