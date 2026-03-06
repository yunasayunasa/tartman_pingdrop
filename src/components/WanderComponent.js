// in src/components/WanderComponent.js

export default class WanderComponent {
    constructor(scene, owner, params = {}) {
        this.gameObject = owner;
        this.npcController = null;
        this.timer = 0;
        this.state = 'WAITING';
         this.enabled = true; // ★ isSuppressedからenabledに名前を変更
        // constructorでは、paramsをプロパティに保存しない！
    }

     start() {
        this.npcController = this.gameObject.components.NpcController;
        if (!this.npcController) {
            console.error(`[WanderComponent] ERROR: 'NpcController' is required on '${this.gameObject.name}'. Disabling.`);
            this.enabled = false;
            return; // 依存コンポーネントがなければ、ここで終了
        }

        // ★★★ イベントリスナーの登録を、正しい場所に移動 ★★★
        this.gameObject.on('onAiBehaviorChange', this.handleBehaviorChange, this);

        const myParams = this.getCurrentParams();
        const waitDuration = myParams.waitDuration ?? 2000;
        this.timer = this.gameObject.scene.time.now + waitDuration;
    }
  handleBehaviorChange(event) {
        if (event.source === 'WanderComponent') return;
        // 他のコンポーネントがアクティブになったら自分は無効に、そうでなければ有効になる
        this.enabled = !event.active;

        if (!this.enabled) {
            this.npcController.stop(); // 抑制されたら、動きを止める
        } else {
            // 活動再開時は、待機状態からリスタート
            this.state = 'WAITING';
            const myParams = this.getCurrentParams();
            const waitDuration = myParams.waitDuration ?? 2000;
            this.timer = this.gameObject.scene.time.now + waitDuration;
        }
    }
     update() {
         if (!this.npcController || !this.enabled) return; // ★ enabledでガードするだけでOK

        if (this.gameObject.scene.time.now > this.timer) {
            const myParams = this.getCurrentParams();
            const walkDuration = myParams.walkDuration ?? 3000;
            const waitDuration = myParams.waitDuration ?? 2000;
            const is8Way = myParams.is8Way ?? false;
            
            if (this.state === 'WAITING') {
                this.state = 'WALKING';
                this.timer = this.gameObject.scene.time.now + walkDuration;
                
                let vx = 0; let vy = 0;
                const speed = this.npcController.moveSpeed;
                if (is8Way) {
                    const angle = Phaser.Math.RND.angle();
                    const vec = new Phaser.Math.Vector2().setAngle(Phaser.Math.DegToRad(angle));
                    vx = vec.x * speed;
                    vy = vec.y * speed;
                } else {
                    vx = (Math.random() < 0.5 ? -1 : 1) * speed;
                }
                this.npcController.move(vx, vy);
            } else { // WALKING
                this.state = 'WAITING';
                this.timer = this.gameObject.scene.time.now + waitDuration;
                this.npcController.stop();
            }
        }
    }
   getCurrentParams() {
        const allCompsData = this.gameObject.getData('components') || [];
        const myData = allCompsData.find(c => c.type === 'WanderComponent');
        return myData ? myData.params : {};
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
WanderComponent.define = {
    methods: ['enable', 'disable', 'toggle'],
    params: [
        
        { 
            key: 'walkDuration',
            type: 'range',
            label: '歩行時間(ms)',
            min: 500, max: 10000, step: 100,
            defaultValue: 3000
        },
        { 
            key: 'waitDuration', 
            type: 'range',
            label: '待機時間(ms)',
            min: 500, max: 10000, step: 100,
            defaultValue: 2000 
        },
        { 
            key: 'is8Way',
            type: 'checkbox',
            label: '8方向移動',
            defaultValue: false
        }
    ]
};