// in src/handlers/events/distance_check.js

export default async function distance_check(interpreter, params, target) {
    // ★★★ target引数は使わない。paramsで指定された2つのオブジェクトを比較する
    const source = interpreter.currentSource; // このタグを実行しているオブジェクト（例：Enemy）
    
    // params.target1 と params.target2 で比較対象を指定できるようにする
    const targetId1 = params.target1 || 'self'; // デフォルトは自分自身
    const targetId2 = params.target2 || 'player'; // デフォルトはプレイヤー
    const threshold = parseFloat(params.distance) || 100; // 比較する距離

    const obj1 = interpreter.findTarget(targetId1, interpreter.scene, source);
    const obj2 = interpreter.findTarget(targetId2, interpreter.scene, source);

    // ▼▼▼【ここからがデバッグログ】▼▼▼
   
    if (!obj1 || !obj2) {
        console.error("比較対象のオブジェクトが見つかりません。");
       
       
        return 'output_far'; // エラー時は「遠い」として扱う
    }

    const currentDistance = Phaser.Math.Distance.Between(obj1.x, obj1.y, obj2.x, obj2.y);
    const isNear = currentDistance < threshold;
    const resultPin = isNear ? 'output_near' : 'output_far';

    
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    return resultPin;
}

distance_check.define = {
    description: "2つのオブジェクト間の距離を測定し、指定した距離より近いか遠いかで処理を分岐します。",
    pins: {
        outputs: [
            { name: 'output_near', label: '近い' },
            { name: 'output_far', label: '遠い' }
        ]
    },
    params: [
        { key: 'target1', type: 'string', label: '対象1', defaultValue: 'self' },
        { key: 'target2', type: 'string', label: '対象2', defaultValue: 'player' },
        { key: 'distance', type: 'number', label: '距離のしきい値', defaultValue: 100 }
    ]
};