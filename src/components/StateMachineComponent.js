export default class StateMachineComponent {
    constructor(scene, owner, params = {}) {
        this.scene = scene;
        this.gameObject = owner;
        
        this.currentStateName = null;
        this.currentStateLogic = null;
        this.stateMachineData = null; // 初期値は null
        this.actionInterpreter = this.scene.actionInterpreter;
        this.actionInterpreter = this.scene.registry.get('actionInterpreter');

        // --- 念のためのガード節 ---
        if (!this.actionInterpreter) {
            console.error("[StateMachineComponent] CRITICAL: ActionInterpreter not found in scene registry!");
        }
    }

     // 新しい初期化メソッド
    init(stateMachineData) {
        this.stateMachineData = stateMachineData;
        if (this.stateMachineData && this.stateMachineData.initialState) {
            this.transitionTo(this.stateMachineData.initialState);
        }
    }

    update(time, delta) {
        if (!this.currentStateLogic || !this.currentStateLogic.onUpdate) return;
        if (this.actionInterpreter) {
            this.actionInterpreter.run(this.gameObject, this.currentStateLogic.onUpdate);
        }
    }

   transitionTo(newStateName) {
        if (!this.stateMachineData) {
             console.error(`[StateMachine] Error: stateMachineData is not initialized for '${this.gameObject.name}'.`);
             return; // ガード節
        }
        // 既にその状態なら何もしない
        if (this.currentStateName === newStateName) return;

        // console.log(`[StateMachine] Transitioning from '${this.currentStateName}' to '${newStateName}'...`, this.gameObject.name);

        // 1. 今の状態の onExit を実行 (完了を待たない)
        if (this.currentStateLogic && this.currentStateLogic.onExit) {
            this.actionInterpreter.run(this.gameObject, this.currentStateLogic.onExit);
        }

        const newStateLogic = this.stateMachineData.states[newStateName];
        if (!newStateLogic) {
            console.error(`[StateMachine] 状態 '${newStateName}' が見つかりません。`);
            this.currentStateName = null;
            this.currentStateLogic = null;
            return;
        }
        this.currentStateName = newStateName;
        this.currentStateLogic = newStateLogic;

        // 2. 新しい状態の onEnter を実行 (完了を待たない)
        if (this.currentStateLogic.onEnter) {
            this.actionInterpreter.run(this.gameObject, this.currentStateLogic.onEnter);
        }
        // console.log(`[StateMachine] Transition complete. Current state: '${this.currentStateName}'`, this.gameObject.name);
    }
}