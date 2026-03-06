// src/scenes/GameOverScene.js
import EngineAPI from '../core/EngineAPI.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#330000');
        
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, 'GAME OVER', { fontSize: '64px', fill: '#FF0000' }).setOrigin(0.5);
        
        const restartText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, 'RESTART', { fontSize: '32px', fill: '#FFFFFF' }).setOrigin(0.5);
        restartText.setInteractive({ useHandCursor: true });
        restartText.on('pointerdown', () => {
            EngineAPI.fireGameFlowEvent('RESTART_GAME');
        });

        this.events.emit('scene-ready');
    }
}