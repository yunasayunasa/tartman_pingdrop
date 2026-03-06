// src/handlers/events/state_transition.js を一時的に書き換える

export default async function state_transition(interpreter, params, target) {
    // console.log("%c[state_transition] Handler executed.", "color: magenta;");

    const newStateName = params.to;
    if (!newStateName) {
        console.warn('[state_transition] "to" parameter is missing.');
        return;
    }

    const finalTarget = target || interpreter.currentSource;
    if (!finalTarget) {
        console.warn('[state_transition] Target object not found.');
        return;
    }

    // ▼▼▼【ここからデバッグコード】▼▼▼
    // console.log("--- StateMachineComponent Debug ---");
    // console.log("Final target is:", finalTarget);
    // console.log("Does finalTarget have 'components' property?", finalTarget.hasOwnProperty('components'));
    
    // finalTargetにアタッチされているはずの全コンポーネントを表示
    // もしコンポーネントシステムが別の名前でプロパティを持っているなら、それに変える
    // console.log("All components on target:", finalTarget.components); 

    const stateMachine = finalTarget.components?.StateMachineComponent;
    
    // console.log("Retrieved stateMachine object:", stateMachine);
    
    if (stateMachine) {
        // console.log("Is stateMachine an instance of StateMachineComponent?", stateMachine.constructor.name === 'StateMachineComponent');
        // console.log("Does it have 'transitionTo' method?", typeof stateMachine.transitionTo);
        
        // console.log(`>>> NOW CALLING transitionTo('${newStateName}')`);
        await stateMachine.transitionTo(newStateName);
        // console.log("<<< CALL to transitionTo FINISHED");

    } else {
        console.warn(`[state_transition] Target '${finalTarget.name}' does not have a StateMachineComponent or it's null.`);
    }
    // console.log("--- End of StateMachineComponent Debug ---");
    // ▲▲▲【ここまでデバッグコード】▲▲▲
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
state_transition.define = {
    description: 'キャラクターなどのオブジェクトの状態（State）を切り替えます。',
    params: [
        { 
            key: 'to', 
            type: 'string', 
            label: '遷移先の状態名', 
            defaultValue: '',
            required: true
        },
        { 
            key: 'target', 
            type: 'string', 
            label: 'ターゲット', 
            defaultValue: 'source' 
        }
    ]
};