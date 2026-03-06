// src/handlers/events/set_collision.js

/**
 * [set_collision] アクションタグ
 * ターゲットの物理ボディの衝突ルール（カテゴリとマスク）を設定します。
 * @param {ActionInterpreter} interpreter
 * @param {object} params
 * @param {Phaser.GameObjects.GameObject} target
 */
export default async function set_collision(interpreter, params, target) {
    if (!target || !target.body) return;
    
    const physicsDefine = interpreter.scene.registry.get('physics_define');
    if (!physicsDefine || !physicsDefine.categories) return;
    const categories = physicsDefine.categories;

    // カテゴリの設定
    if (params.category) {
        const categoryName = params.category;
        if (categories[categoryName]) {
            target.setCollisionCategory(categories[categoryName]);
        }
    }

    // マスクの設定
    if (params.mask) {
        let newMask = 0;
        const maskNames = params.mask.split(',').map(s => s.trim());
        
        maskNames.forEach(name => {
            if (categories[name]) {
                newMask |= categories[name];
            }
        });
        
        target.setCollidesWith(newMask);
    }
}

/**
 * ★ VSLエディタ用の自己定義 ★
 */
set_collision.define = {
    description: 'ターゲットの物理カテゴリ（自分は誰か）と衝突マスク（誰と衝突するか）を設定します。',
    params: [
        { key: 'category', type: 'string', label: 'カテゴリ名', defaultValue: '' },
        { key: 'mask', type: 'string', label: 'マスク名(カンマ区切り)', defaultValue: '' }
    ]
};