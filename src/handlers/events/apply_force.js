// in src/handlers/events/apply_force.js (スケール調整・最終FIX版)

const MatterBody = Phaser.Physics.Matter.Matter.Body;
const MatterEngine = Phaser.Physics.Matter.Matter.Engine;

// 1フレームの時間 (ミリ秒) を定数として定義
const DELTA_TIME_MS = 16.66;

export default async function apply_force(interpreter, params, target) {
    if (!target || !target.body) {
        console.warn(`[apply_force] Target or its physics body not found.`);
        return;
    }

    // ▼▼▼【ここが最後の修正です】▼▼▼
    // --------------------------------------------------------------------
    // 1. パラメータから「ユーザーが意図した力」を取得
    const forceX = parseFloat(params.x) || 0;
    const forceY = parseFloat(params.y) || 0;
    
    // 2. Matter.jsの内部計算（力 × 時間）を打ち消すため、
    //    あらかじめ力（force）を時間（delta）で割っておく。
    //    これにより、ユーザーが指定した値が、ほぼそのまま速度変化に近い値になる。
    //    (※ 1000で割っているのは、DELTA_TIME_MSがミリ秒単位だから)
    const normalizedForce = {
        x: forceX / (DELTA_TIME_MS / 1000),
        y: forceY / (DELTA_TIME_MS / 1000)
    };
    
    // console.log(`%c[Force Normalized] User force: (${forceX}, ${forceY}) -> Engine force: (${normalizedForce.x.toFixed(2)}, ${normalizedForce.y.toFixed(2)})`, 'color: white; background: red;');
    
    // 3. 正規化された力をエンジンに与える
    MatterBody.applyForce(target.body, target.body.position, normalizedForce);
    
    // 4. エンジンを手動で1ステップ進める
    const engine = target.scene.matter.world.engine;
    MatterEngine.update(engine, DELTA_TIME_MS);
    // --------------------------------------------------------------------
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // console.log(`  > Velocity AFTER manual engine step: { x: ${target.body.velocity.x.toFixed(2)}, y: ${target.body.velocity.y.toFixed(2)} }`);
}
/**
 * ★ VSLエディタ用の自己定義 ★
 */
apply_force.define = {
    description: '物理ボディを持つオブジェクトに、瞬間的な力（衝撃）を加えます。',
    params: [
        {
            key: 'x', type: 'number', label: 'X方向の力', defaultValue: 0
        },
        {
            key: 'y', type: 'number', label: 'Y方向の力', defaultValue: 0
        },
        // ▼▼▼【ここを追加】▼▼▼
        {
            key: 'target',
            type: 'string',
            label: '力の対象',
            defaultValue: 'source'
        }
        // ▲▲▲【ここまで追加】▲▲▲
    ]
};