// in src/components/Interactor.js

export default class Interactor {
    constructor(scene, owner, params = {}) {
        this.scene = owner.scene;
        this.gameObject = owner;
        
        this.interactKey = scene.input.keyboard.addKey(params.key || 'UP');
        this.interactionRadius = params.radius || 50;
        this.targetGroup = params.targetGroup || 'interactable';
        
        this.iconType = params.iconType ?? 'exclamation';
        this.iconColor = Phaser.Display.Color.ValueToColor(params.iconColor ?? '0xffff00').color;
        
        this.closestInteractable = null;
        this.interactIcon = null;
this.enabled = true; // ★★★ enabledフラグを追加 ★★★
        this.interactKey.on('down', this.onInteract, this);
        this.scene.events.on('interact_button_pressed', this.onInteract, this);
    }

    start() {
        this.interactIcon = this.scene.add.graphics();
        this.interactIcon.setAlpha(0);
        this.interactIcon.setDepth(1000);
    }

    update(time, delta) {
           // ▼▼▼【この一行をupdateの先頭に追加】▼▼▼
        if (!this.enabled) {
            // もし無効化されていたら、アイコンを消して処理を中断
            if (this.closestInteractable && this.interactIcon) {
                this.scene.tweens.add({ targets: this.interactIcon, alpha: 0, duration: 200 });
            }
            this.closestInteractable = null;
            return;
        }
        const candidates = this.scene.getObjectsByGroup(this.targetGroup);
        let closest = null;
        let minDistance = this.interactionRadius;

        if (candidates) {
            for (const candidate of candidates) {
                if (candidate === this.gameObject) continue;
                const distance = Phaser.Math.Distance.BetweenPoints(this.gameObject, candidate);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = candidate;
                }
            }
        }
        
        if (this.closestInteractable !== closest) {
            this.closestInteractable = closest;
            if (this.interactIcon) {
                if (this.closestInteractable) {
                    this.interactIcon.setPosition(this.closestInteractable.x, this.closestInteractable.y - 40);
                    this.drawInteractIcon();
                    this.scene.tweens.add({ targets: this.interactIcon, alpha: 1, duration: 200 });
                } else {
                    this.scene.tweens.add({ targets: this.interactIcon, alpha: 0, duration: 200 });
                }
            }
        }
    }

    drawInteractIcon() {
        if (!this.interactIcon) return;
        this.interactIcon.clear();
        if (this.iconType === 'none') return;

        this.interactIcon.fillStyle(this.iconColor);

        switch (this.iconType) {
            case 'exclamation': {
                const barWidth = 10, barHeight = 22, dotRadius = 5, gap = 5;
                this.interactIcon.fillRoundedRect(-barWidth / 2, -(barHeight / 2 + dotRadius + gap), barWidth, barHeight, 3);
                this.interactIcon.fillCircle(0, dotRadius, dotRadius);
                break;
            }
            case 'question': {
                this.interactIcon.fillCircle(0, 0, 15); // Placeholder
                break;
            }
            case 'dots': {
                this.interactIcon.fillCircle(-15, 0, 4);
                this.interactIcon.fillCircle(0, 0, 4);
                this.interactIcon.fillCircle(15, 0, 4);
                break;
            }
        }
    }

  
onInteract() {
    // ▼▼▼【ここからデバッグログを追加】▼▼▼
    console.group(`%c[DEBUG] Interactor.onInteract Fired!`, 'color: cyan; font-weight: bold;');
    
    if (!this.closestInteractable) {
// // console.log("Status: No interactable object in range. Aborting.");
        console.groupEnd();
        return;
    }
// // console.log(`Status: Closest interactable is '${this.closestInteractable.name}'.`);
// // console.log("Action: Finding 'onInteract' trigger in its events data...");
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const events = this.closestInteractable.getData('events') || [];
    let foundInteractEvent = false;
    for (const eventData of events) {
        if (eventData.trigger === 'onInteract') {
            foundInteractEvent = true;
// // console.log("Action: 'onInteract' trigger found! Requesting ActionInterpreter to run...");
            this.scene.registry.get('actionInterpreter').run(this.closestInteractable, eventData, this.gameObject);
        }
    }

    if (!foundInteractEvent) {
        console.warn(`Warning: No 'onInteract' trigger found on '${this.closestInteractable.name}'.`);
    }
    console.groupEnd();
}

    destroy() {
        if (this.interactIcon) {
            this.interactIcon.destroy();
            this.interactIcon = null;
        }
        this.interactKey.off('down', this.onInteract, this);
        this.scene.events.off('interact_button_pressed', this.onInteract, this);
    }
    
} // ★★★★★★★【これが正しいクラスの閉じ括弧です】★★★★★★★

/**
 * IDEのプロパティパネルに表示するための自己定義
 */
Interactor.define = {
    params: [
        { key: 'key', type: 'text', label: 'インタラクトキー', defaultValue: 'UP' },
        { key: 'radius', type: 'range', label: '対話半径', min: 10, max: 200, step: 5, defaultValue: 50 },
        { key: 'targetGroup', type: 'text', label: '対話対象のGroup', defaultValue: 'interactable' },
        { 
            key: 'iconType', 
            type: 'select',
            label: 'アイコンタイプ',
            options: ['exclamation', 'question', 'dots', 'none'],
            defaultValue: 'exclamation'
        },
        { 
            key: 'iconColor', 
            type: 'color',
            label: 'アイコン色',
            defaultValue: '0xffff00'
        }
    ]
};