// src/handlers/events/move_to_target.js (最終完成版)

// このハンドラ内で計算結果を使い回すため、モジュールのトップレベルに一度だけVector2を生成します。
// これにより、毎フレーム`new`で新しいオブジェクトが作られるのを防ぎ、パフォーマンスを向上させます。
const reusableVector = new Phaser.Math.Vector2();

/**
 * 自分自身(source)を、指定された目標オブジェクト(destinationTarget)に向かって移動させます。
 * onUpdateでの毎フレーム実行を想定し、パフォーマンスが最適化されています。
 */
export default async function move_to_target(interpreter, params, destinationTarget) {
    // --- 引数の解釈を明確化 ---
    // interpreter.currentSource : この移動アクションの主体（例：Enemy）
    // destinationTarget         : 移動の目標地点となるオブジェクト（例：Player）

    const source = interpreter.currentSource;
    const speed = parseFloat(params.speed) || 2;

    // --- 1. 処理に必要なオブジェクトが全て揃っているか確認 ---
    //    (移動主体、その物理ボディ、目標地点)
    //    onUpdateで頻繁に呼ばれるため、エラーは出さずに静かに処理を中断します。
    if (!source || !source.body || !destinationTarget) {
        return;
    }

    // --- 2. 角度の計算 ---
    //    Phaserが提供する、最適化された高速な静的メソッドを利用します。
    const angle = Phaser.Math.Angle.Between(
        source.x, source.y,
        destinationTarget.x, destinationTarget.y
    );

    // --- 3. 速度ベクトルの計算 ---
    //    `new`を避け、使い回しの`reusableVector`オブジェクトの値を更新します。
    reusableVector.set(Math.cos(angle), Math.sin(angle));
    
    // --- 4. 速度の設定 ---
    //    計算済みの方向ベクトルにスピードを乗じて、移動主体の物理ボディに速度を設定します。
    source.setVelocity(
        reusableVector.x * speed,
        reusableVector.y * speed
    );
};

/**
 * VSLエディタ用の自己定義
 */
move_to_target.define = {
    description: "自分自身(source)を、ターゲットオブジェクトに向かって移動させます。(物理ボディ必須)",
    params: [
        { key: "target", type: "string", label: "目標", defaultValue: "player" },
        { key: "speed", type: "number", label: "速度", defaultValue: 2 }
    ]
};