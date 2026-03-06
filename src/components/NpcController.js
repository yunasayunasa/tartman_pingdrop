// in src/components/NpcController.js

export default class NpcController {
    
    constructor(scene, owner, params = {}) {
        this.scene = owner.scene;
        this.gameObject = owner;
        this.moveSpeed = params.moveSpeed || 2;
        this.state = 'idle';
        this.direction = 'right';
    }

    update(time, delta) {
        // このメソッドは変更なし。これが唯一の正しいロジック。
        if (!this.gameObject?.body?.velocity) return;

        const vx = this.gameObject.body.velocity.x;
        const vy = this.gameObject.body.velocity.y;

        const oldState = this.state;
        if (vy < -0.1) this.state = 'jump_up';
        else if (vy > 0.1) this.state = 'fall_down';
        else if (Math.abs(vx) > 0.1) this.state = 'walk';
        else this.state = 'idle';

        if (this.state !== oldState) {
            this.gameObject.emit('onStateChange', this.state, oldState);
        }
        
        const oldDirection = this.direction;
        if (vx < -0.1) this.direction = 'left';
        else if (vx > 0.1) this.direction = 'right';
        
        if (this.direction !== oldDirection) {
            this.gameObject.emit('onDirectionChange', this.direction, oldDirection);
        }
    }

    // ▼▼▼【ここから修正】▼▼▼
    move(vx = 0, vy = 0) {
        if (this.gameObject?.body) {
            // Y方向の速度は現在のものを維持するのが一般的
            this.gameObject.setVelocity(vx, this.gameObject.body.velocity.y);
        }
        // ★★★ updateAnimationTriggers()の呼び出しを削除！ ★★★
    }

    stop() {
        if (this.gameObject?.body) {
            this.gameObject.setVelocity(0, this.gameObject.body.velocity.y);
        }
        // ★★★ updateAnimationTriggers()の呼び出しを削除！ ★★★
    }
    
    face(newDirection) {
        // このメソッドは変更なし
        if (this.direction !== newDirection && (newDirection === 'left' || newDirection === 'right')) {
            const oldDirection = this.direction;
            this.direction = newDirection;
            this.gameObject.emit('onDirectionChange', newDirection, oldDirection);
        }
    }

    // ★★★ 古いロジックである updateAnimationTriggers メソッドをまるごと削除 ★★★
    /*
    updateAnimationTriggers(vx, vy) { ... }
    */
    
    destroy() {
        this.gameObject = null;
        this.scene = null;
    }
}

// ★★★ defineプロパティも忘れずに追加 ★★★
NpcController.define = {
    params: [
        { 
            key: 'moveSpeed',
            type: 'range',
            label: '移動速度',
            min: 1,
            max: 20,
            step: 0.5,
            defaultValue: 4
        }
    ]
};