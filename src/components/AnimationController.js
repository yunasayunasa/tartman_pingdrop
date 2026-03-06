// in src/components/AnimationController.js

export default class AnimationController {
    constructor(scene, owner, params = {}) {
        this.gameObject = owner;
        // ★★★ "scene"引数は使わず、ownerから直接シーンを取得する ★★★
        this.scene = owner.scene; 

        this.animPrefix = params.prefix || owner.getData('anim_prefix') || owner.name.split('_')[0]; 
        
// // console.log(`[AnimationController] Initialized for '${owner.name}'. Using prefix: '${this.animPrefix}'. Scene key: '${this.scene.scene.key}'`);
        
        this.lastState = 'idle';
        this.lastDirection = 'right';
    }
    
    start() {
        if (this.gameObject.on) {
            this.gameObject.on('onStateChange', this.handleStateChange, this);
            this.gameObject.on('onDirectionChange', this.handleDirectionChange, this);
        }
        this.updateAnimation();
    }

    handleStateChange(newState, oldState) {
        if (this.lastState !== newState) {
            this.lastState = newState;
            this.updateAnimation();
        }
    }

    handleDirectionChange(newDirection, oldDirection) {
        if (this.lastDirection !== newDirection) {
            this.lastDirection = newDirection;
            this.updateAnimation();
        }
    }

    // in src/components/AnimationController.js

updateAnimation() {
    if (!this.gameObject || !this.gameObject.active || !this.scene) return;
    
    // ▼▼▼【ここからが最終修正版です】▼▼▼
    
    let animKey;
    let flipX = this.lastDirection.includes('left'); // ★ 1. 左向きならflipXをtrueに

    // ★ 2. アニメーションキーは、常に'right'（あるいは向きなし）で組み立てる
    if (this.lastState === 'idle') {
        animKey = `${this.animPrefix}_idle`;
    } else {
        // lastDirectionから'left'や'right'を取り除いた純粋な向きを取得
        // (将来の'up', 'down'のため)
        const pureDirection = this.lastDirection.replace('left', '').replace('right', '').trim();
        
        if (pureDirection) {
             // up_right, down_rightのようなキーを想定
            animKey = `${this.animPrefix}_${this.lastState}_${pureDirection}_right`;
        } else {
            // ただの 'walk' -> walk_right
            animKey = `${this.animPrefix}_${this.lastState}_right`;
        }
    }

    const currentAnimKey = this.gameObject.anims.currentAnim ? this.gameObject.anims.currentAnim.key : null;
    
    // ★ 3. 再生しようとしているアニメとスプライトの向きが同じなら、何もしない
    if (currentAnimKey === animKey && this.gameObject.flipX === flipX) {
        return; 
    }

    if (this.scene.anims.exists(animKey)) {
        // ★ 4. アニメーションを再生する"前"に、向きを確定させる
        this.gameObject.setFlipX(flipX);
        this.gameObject.play(animKey, true);
    } else {
        // フォールバック処理（idleを探す）
        const idleKey = `${this.animPrefix}_idle`;
        if (this.scene.anims.exists(idleKey)) {
            // idleアニメーションの場合でも、向きは反映させる
            this.gameObject.setFlipX(flipX);
            if (currentAnimKey !== idleKey) {
                this.gameObject.play(idleKey, true);
            }
        } else {
            this.gameObject.stop();
        }
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
}

    destroy() {
        if (this.gameObject && this.gameObject.off) {
            this.gameObject.off('onStateChange', this.handleStateChange, this);
            this.gameObject.off('onDirectionChange', this.handleDirectionChange, this);
        }
    }
}