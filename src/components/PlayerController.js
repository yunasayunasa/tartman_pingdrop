//
// Odyssey Engine - PlayerController Component (State Machine Design)
// src/components/PlayerController.js

export default class PlayerController {
    
    constructor(scene, target, params = {}) {
        this.scene = scene;
        this.gameObject = target;

        // --- パラメータ設定 ---
        this.moveForce = params.moveForce || 0.01;
        this.maxSpeed = params.maxSpeed || 5;
        this.jumpVelocity = params.jumpVelocity || -10;
        this.walkSoundKey = params.walkSoundKey || null;
        this.jumpSoundKey = params.jumpSoundKey || null;

        // --- 内部状態 ---
        this.coyoteTimeThreshold = 100;
        this.lastGroundedTime = 0;
        this.cursors = null;
        this.keyboardEnabled = false;
        this.isInitialized = false;
        this.isPlayingWalkSound = false;

        // --- ステートマシン関連 ---
        this.state = 'idle';
        this.direction = 'right';
    }
    
    // シーンのセーブ/ロード用のメソッド（現在は未使用）
    serialize() { return {}; }
    deserialize(data) {}

    /**
     * キーボード入力を安全なタイミングで初期化する
     */
    initKeyboard() {
        if (this.isInitialized) return;
        if (this.scene?.input?.keyboard) {
            this.keyboardEnabled = true;
            this.cursors = this.scene.input.keyboard.createCursorKeys();
        }
        this.isInitialized = true;
    }

    /**
     * 毎フレーム呼び出される更新処理
     */
    update(time, delta) {
        if (!this.isInitialized) {
            this.initKeyboard();
        }
        
        if (!this.gameObject?.body || !this.gameObject.active) {
            this.changeState('idle'); // 安全のためアイドル状態に
            return;
        }

        // --- 隠れている状態の特別処理 ---
        if (this.state === 'hiding') {
            this.gameObject.setVelocity(0, 0);
            return;
        }

        const body = this.gameObject.body;
        const joystick = this.scene.joystick;
        
        // --- 1. 入力に基づいて、左右の移動と向きを決定する ---
        let moveX = 0;
        if (this.keyboardEnabled && this.cursors) {
            if (this.cursors.left.isDown) moveX = -1;
            else if (this.cursors.right.isDown) moveX = 1;
        }
        if (joystick) {
            if (joystick.left) moveX = -1;
            else if (joystick.right) moveX = 1;
        }

        let newDirection = this.direction;
        if (moveX < 0) newDirection = 'left';
        else if (moveX > 0) newDirection = 'right';

        if (this.direction !== newDirection) {
            this.direction = newDirection;
            this.gameObject.emit('onDirectionChange', this.direction);
        }
        
        this.gameObject.setVelocity(moveX * this.maxSpeed, body.velocity.y);
        
        // --- 2. 物理状態に基づいて、次の状態を「決定」する ---
        const isOnGround = this.checkIsOnGround();
        if (isOnGround) {
            this.lastGroundedTime = this.scene.time.now;
        }

        let nextState = this.state;
        if (!isOnGround) {
            nextState = (body.velocity.y < 0) ? 'jump_up' : 'fall_down';
        } else if (Math.abs(body.velocity.x) > 0.1) {
            nextState = 'walk';
        } else {
            nextState = 'idle';
        }
        
        // --- 3. 決定した状態をステートマシンに通知する ---
        this.changeState(nextState);
        
        // --- 4. ジャンプ入力を処理する ---
        if (this.keyboardEnabled && this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jump();
        }
    }

    /**
     * ジャンプを実行する
     */
    jump() {
        if (!this.gameObject?.body) return;

        const timeSinceGrounded = this.scene.time.now - this.lastGroundedTime;
        if (timeSinceGrounded <= this.coyoteTimeThreshold) {
            this.gameObject.setVelocityY(this.jumpVelocity);
            
            // ★ ジャンプ音は、アクションが発生したこの瞬間に鳴らす
            if (this.jumpSoundKey) {
                const soundManager = this.scene.registry.get('soundManager');
                soundManager ? soundManager.playSe(this.jumpSoundKey) : this.scene.sound.play(this.jumpSoundKey);
            }
            
            this.changeState('jump_up'); // 状態も即座に更新
            this.lastGroundedTime = 0; 
        }
    }

    /**
     * ★★★ 新しいステートマシン・コアメソッド ★★★
     * 状態を安全に遷移させ、遷移時のアクションを実行する
     */
    changeState(newState) {
        if (this.state === newState) return;

        const oldState = this.state;
        const soundManager = this.scene.registry.get('soundManager');

        // --- 1. 古い状態から出る時の処理 (onExit) ---
        switch (oldState) {
            case 'walk':
                if (this.isPlayingWalkSound) {
                    // console.log('[PlayerController] Exiting Walk state. Stopping walk sound.');
                    soundManager ? soundManager.stopSe(this.walkSoundKey) : this.scene.sound.stopByKey(this.walkSoundKey);
                    this.isPlayingWalkSound = false;
                }
                break;
        }

        // --- 2. 状態を更新 ---
        this.state = newState;

        // --- 3. 新しい状態に入る時の処理 (onEnter) ---
        switch (newState) {
            case 'walk':
                if (this.walkSoundKey && !this.isPlayingWalkSound) {
                    // console.log('[PlayerController] Entering Walk state. Playing walk sound.');
                    soundManager ? soundManager.playSe(this.walkSoundKey, { loop: true }) : this.scene.sound.play(this.walkSoundKey, { loop: true });
                    this.isPlayingWalkSound = true;
                }
                break;
        }
        
        // --- 4. 外部に状態変化を通知 ---
        this.gameObject.emit('onStateChange', newState, oldState);
    }

    // ... (checkIsOnGround, toggleHiding, hide, unhide メソッドは変更なし) ...

    checkIsOnGround() {
        if (!this.gameObject || !this.gameObject.body) return false;
        const body = this.gameObject.body;
        const bounds = body.bounds;
        const allBodies = this.scene.matter.world.getAllBodies();
        const checkY = bounds.max.y + 1;
        const pointsToCheck = [
            { x: bounds.min.x + 1, y: checkY },
            { x: body.position.x, y: checkY },
            { x: bounds.max.x - 1, y: checkY }
        ];
        for (const point of pointsToCheck) {
            const bodiesAtPoint = this.scene.matter.query.point(allBodies, point);
            const filteredBodies = bodiesAtPoint.filter(b => b.id !== body.id);
            if (filteredBodies.length > 0) return true;
        }
        return false;
    }

    toggleHiding(hidingSpot) {
        if (this.state === 'hiding') {
            this.unhide();
        } else {
            this.hide(hidingSpot);
        }
    }

    hide(hidingSpot) {
        if (this.state === 'hiding') return;
        
        // ★ 隠れる前に、まず歩行音などを止める
        this.changeState('idle'); // idle状態を経由して音を止める

        const oldState = this.state;
        this.state = 'hiding';
        this.gameObject.emit('onStateChange', 'hiding', oldState);
        
        this.gameObject.setAlpha(0.5);
        if (this.gameObject.body) {
            const physicsDefine = this.scene.registry.get('physics_define');
            if (physicsDefine?.categories.HIDDEN) {
                this.gameObject.setCollisionCategory(physicsDefine.categories.HIDDEN);
            }
        }
        this.gameObject.setData('group', 'hidden');
    }

    unhide() {
        if (this.state !== 'hiding') return;
        
        this.gameObject.setAlpha(1); 
        if (this.gameObject.body) {
            const physicsDefine = this.scene.registry.get('physics_define');
            if (physicsDefine?.categories.player) {
                this.gameObject.setCollisionCategory(physicsDefine.categories.player);
            }
        }
        this.gameObject.setData('group', 'player');
        
        this.changeState('idle'); // idle状態に戻る
    }

    destroy() {
        // ★ コンポーネントが破棄される時に、再生中の音を止める
        if (this.isPlayingWalkSound) {
            const soundManager = this.scene.registry.get('soundManager');
            soundManager ? soundManager.stopSe(this.walkSoundKey) : this.scene.sound.stopByKey(this.walkSoundKey);
            this.isPlayingWalkSound = false;
        }
    }
}

// PlayerController.define は変更なし
PlayerController.define = {
    params: [
        { key: 'moveForce', type: 'range', label: 'Move Force', min: 0.001, max: 0.1, step: 0.001, defaultValue: 0.01 },
        { key: 'maxSpeed', type: 'range', label: 'Max Speed', min: 1, max: 20, step: 0.5, defaultValue: 5 },
        { key: 'jumpVelocity', type: 'range', label: 'Jump Velocity', min: -20, max: -5, step: 1, defaultValue: -10 },
        { key: 'walkSoundKey', type: 'select', label: 'Walk Sound (SE)', options: 'asset:audio', defaultValue: null },
        { key: 'jumpSoundKey', type: 'select', label: 'Jump Sound (SE)', options: 'asset:audio', defaultValue: null }
    ]
};