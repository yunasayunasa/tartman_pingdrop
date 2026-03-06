// in src/handlers/events/call_component_method.js

/**
 * [call_component_method]
 * ターゲットオブジェクトの指定されたコンポーネントの、指定されたメソッドを呼び出す。
 */
export default async function call_component_method(interpreter, params, target) {
    if (!target) return;

    const componentName = params.component;
    const methodName = params.method;
    
    if (!componentName || !methodName) {
        console.warn(`[call_component_method] 'component'と'method'パラメータは必須です。`);
        return;
    }

    // 1. ターゲットオブジェクトに、指定されたコンポーネントが存在するか確認
    const componentInstance = target.components?.[componentName];
    if (!componentInstance) {
        console.warn(`[call_component_method] Target '${target.name}'に'${componentName}'が見つかりません。`);
        return;
    }

    // 2. そのコンポーネントに、指定されたメソッドが存在するか確認
    const method = componentInstance[methodName];
    if (typeof method !== 'function') {
        console.warn(`[call_component_method] Component '${componentName}'に'${methodName}'というメソッドはありません。`);
        return;
    }

    // 3. パラメータを準備して、メソッドを呼び出す
    //    params.params は文字列 " { \"vx\": -2 } " のように渡されるので、JSON.parseする
    let methodArgs = [];
    if (params.params) {
        try {
            const parsedParams = JSON.parse(params.params);
            // オブジェクトなら値を、配列なら要素を引数リストにする
            methodArgs = Array.isArray(parsedParams) ? parsedParams : Object.values(parsedParams);
        } catch (e) {
            console.error(`[call_component_method] 'params'のJSONパースに失敗しました: ${params.params}`, e);
            return;
        }
    }
    
    // 4. メソッドを実行
    //    .call(componentInstance, ...) を使い、メソッド内の`this`がコンポーネント自身を指すようにする
    method.apply(componentInstance, methodArgs);
}

call_component_method.define = {
    description: 'オブジェクトのコンポーネントが持つメソッドを呼び出します。',
    
    params: [
        { key: 'target', type: 'string', label: '対象オブジェクト', defaultValue: 'self' },
        { key: 'component', type: 'component_select', label: 'コンポーネント名', required: true },
       { 
            key: 'method', 
            type: 'component_method_select', // ★ 新しいtypeを指定
            label: 'メソッド名', 
            required: true,
            dependsOn: 'component' // ★ 'component'パラメータの値に依存することを示す
        },
        { key: 'params', type: 'string', label: '引数(JSON配列/オブジェクト)', defaultValue: '[]' }
    ]
};