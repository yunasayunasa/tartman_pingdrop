// src/core/ItemData.js (新規作成)

export const ITEM_DATA = {
    'sword': {
        name: '剣',
        storage: 'item_sword', // アセットキー
        shape: [[1], [1], [1]], // 3x1の形状
        effects: { attack: 5 }
    },
    'shield': {
        name: '盾',
        storage: 'item_shield',
        shape: [[1, 1], [1, 1]], // 2x2の形状
        effects: { defense: 5 }
    },
    'potion': {
        name: 'ポーション',
        storage: 'item_potion',
        shape: [[1]], // 1x1の形状
        effects: { heal: 10 }
    }
    // ... 他のアイテムを追加
};