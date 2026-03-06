/**
 * 裁判セグメントの進行を管理するコンポーネント。
 * JSONから証言データをロードし、TestimonyFlowComponentを持つオブジェクトを生成・制御する。
 */
export default class TrialSegmentManager {
    constructor(scene, gameObject, params) {
        this.scene = scene;
        this.gameObject = gameObject;
        this.segmentData = null;
        this.currentTestimonyIndex = 0;
        this.activeTestimonies = [];
        this.isInteracting = false;
        this.isFlowing = false;

        this.interactionMenu = null;
        this.progressIndicator = null;

        if (this.scene.updatableComponents) {
            this.scene.updatableComponents.add(this);
        }
    }

    start() {
        // コンポーネントの検索
        this.scene.updatableComponents.forEach(comp => {
            if (comp.constructor.name === 'InteractionMenuComponent') {
                this.interactionMenu = comp;
                comp.onSelection = (choice) => this.handleChoice(choice);
            }
            if (comp.constructor.name === 'ProgressIndicatorComponent') {
                this.progressIndicator = comp;
            }
        });

        const layoutData = this.scene.cache.json.get(this.scene.layoutDataKey || this.scene.scene.key);
        if (layoutData && layoutData.trial_data) {
            this.segmentData = layoutData.trial_data;
            this.startDebateLoop();
        }
    }

    startDebateLoop() {
        this.isFlowing = true;
        this.currentTestimonyIndex = 0;
        this.spawnNextTestimony();

        // タイマー開始を要求
        this.scene.events.emit('START_DEBATE');
    }

    spawnNextTestimony() {
        if (!this.isFlowing || this.scene.isPaused) return;

        const testimonyData = this.segmentData.testimonies[this.currentTestimonyIndex];
        if (!testimonyData) {
            this.currentTestimonyIndex = 0;
            this.spawnNextTestimony();
            return;
        }

        this.createTestimonyObject(testimonyData);
        this.currentTestimonyIndex++;

        this.scene.time.delayedCall(this.segmentData.interval || 4000, () => {
            this.spawnNextTestimony();
        });
    }

    createTestimonyObject(data) {
        const x = this.scene.cameras.main.width + 100;
        const y = 200 + (this.activeTestimonies.length % 3) * 100;

        const container = this.scene.add.container(x, y);
        const textObj = this.scene.add.text(0, 0, data.text, {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        });
        container.add(textObj);

        this.scene.addComponent(container, 'TestimonyFlowComponent', {
            text: data.text,
            speed: 50,
            moveSpeed: 120
        });

        // ハイライト設定
        if (data.highlights) {
            data.highlights.forEach(h => {
                const index = data.text.indexOf(h.text);
                if (index !== -1) {
                    textObj.setInteractive({ useHandCursor: true });
                    textObj.on('pointerdown', () => this.onHighlightClicked(h));

                    // ハイライトされたテキストの一部を色変えっぽく見せる（プロトタイプ版）
                    // 本格的にはBBCodeText等を使うが、ここでは「クリック可能」であることを優先
                    textObj.setTint(0xffff00);
                }
            });
        }

        this.activeTestimonies.push(container);
    }

    onHighlightClicked(highlightData) {
        if (this.isInteracting) return;

        this.scene.events.emit('PAUSE_TRIAL');
        this.isInteracting = true;

        if (this.interactionMenu) {
            this.interactionMenu.show(highlightData);
        }
    }

    handleChoice(choice) {
        console.log('[TrialManager] Choice selected:', choice.text);

        if (choice.correct) {
            this.proceedToNextPhase();
        } else if (choice.action === 'update_testimony') {
            this.updateTestimony(choice.target, choice.new_text);
        } else {
            // ペナルティ等の処理をここに追加可能
            this.isInteracting = false;
            this.scene.events.emit('RESUME_TRIAL');
        }
    }

    updateTestimony(targetId, newText) {
        const testimony = this.segmentData.testimonies.find(t => t.id === targetId);
        if (testimony) {
            testimony.text = newText;

            if (this.progressIndicator) {
                this.progressIndicator.show("議論進行…", 2000);
                this.scene.events.once('PROGRESS_INDICATOR_COMPLETE', () => {
                    this.isInteracting = false;
                    this.scene.events.emit('RESUME_TRIAL');
                });
            } else {
                this.isInteracting = false;
                this.scene.events.emit('RESUME_TRIAL');
            }
        }
    }

    proceedToNextPhase() {
        console.log('論破成功！次のフェーズへ。');
        // 本来はノベルシーンへの復帰や次の裁判JSONへの切り替えを行う
        if (this.progressIndicator) {
            this.progressIndicator.show("論破！！", 3000);
        }
    }

    update(time, delta) {
        // 画面外に出た証言の破棄
        this.activeTestimonies = this.activeTestimonies.filter(obj => {
            if (obj.x < -1500) { // 十分に左へ
                obj.destroy();
                return false;
            }
            return true;
        });
    }
}
