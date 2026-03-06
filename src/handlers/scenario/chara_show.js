import { Layout } from '../../core/Layout.js';

/**
 * [chara_show] タグ - キャラクターの表示
 * 
 * 指定されたキャラクターを画面に登場させます。
 * storageが省略された場合、nameとfaceから画像キーを自動解決します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - タグのパラメータ
 * @param {string} params.name - キャラクター管理名 (必須)
 * @param {string} [params.storage] - 画像アセットキー (省略可能)
 * @param {string} [params.face='normal'] - 表情 (storageがない場合にキー解決に使用)
 * @param {string} [params.pos='center'] - 'left', 'center', 'right'などの定義済み位置
 * @param {number} [params.x] - X座標 (posより優先)
 * @param {number} [params.y] - Y座標 (posより優先)
 * @param {number} [params.time=0] - フェードイン時間(ms)
 */
export default async function handleCharaShow(manager, params) {
    const { name, face = 'normal', pos = 'center', x: paramX, y: paramY, time = 0 } = params;
    let storage = params.storage;
    const scene = manager.scene;

    // --- 1. storageの自動解決 ---
    if (!name) { console.warn('[chara_show] name属性は必須です。'); return; }
    if (!storage) {
        const def = manager.characterDefs[name];
        if (!def) { console.warn(`[chara_show] キャラクター[${name}]の定義が見つかりません。`); return; }
        storage = def.face[face];
        if (!storage) { console.warn(`[chara_show] キャラクター[${name}]の表情[${face}]のstorageが見つかりません。`); return; }
    }
    
    // --- 2. 座標の決定 ---
    const orientation = scene.scale.isPortrait ? 'portrait' : 'landscape';
    const layoutPos = Layout[orientation]?.character?.[pos] || Layout[orientation]?.character?.center;
    let x = paramX !== undefined ? Number(paramX) : layoutPos.x;
    let y = paramY !== undefined ? Number(paramY) : layoutPos.y;

    // --- 3. キャラクターオブジェクトの生成 ---
    if (scene.characters[name]) { scene.characters[name].destroy(); }

    const chara = scene.add.image(x, y, storage);
    chara.setAlpha(0); // ★★★ 最初は透明な状態で生成 ★★★
    chara.name = name;
    
    manager.layers.character.add(chara);
    scene.characters[name] = chara;
  // ▼▼▼ ログ爆弾 No.4 (最重要) ▼▼▼
    const messageWindow = scene.uiScene.uiElements.get('message_window');
   
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    // --- 4. エディタへの登録 ---
    const editorPlugin = scene.plugins.get('EditorPlugin');
    if (editorPlugin && editorPlugin.isEnabled) {
        editorPlugin.makeEditable(chara, scene);
    }

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★★★ ここでアニメーション機能が復活します ★★★
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

    // --- 5. アニメーション（フェードイン） ---
    const duration = Number(time);
    if (duration > 0) {
        // Tween（アニメーション）の完了をPromiseを使って待ち受ける
        await new Promise(resolve => {
            scene.tweens.add({
                targets: chara,
                alpha: 1, // 透明度を0から1へ
                duration: duration,
                ease: 'Linear',
                onComplete: () => resolve() // アニメーションが終わったらPromiseを解決する
            });
        });
    } else {
        // timeが0の場合は、即座に表示する
        chara.setAlpha(1);
    }
}
