/**
 * [button] タグ - クリック可能画像の配置と待機
 * 
 * クリック可能な画像ボタンを配置し、プレイヤーがクリックするまでシナリオを停止します。
 * 
 * @param {ScenarioManager} manager - ScenarioManagerのインスタンス
 * @param {object} params - { graphic, x, y, target }
 */
export default async function handleButton(manager, params) {
    const { graphic, target } = params;
    const scene = manager.scene;

    if (!graphic || !target) {
        console.warn('[button] graphic属性とtarget属性は必須です。');
        return;
    }

    const x = Number(params.x) || scene.scale.width / 2;
    const y = Number(params.y) || scene.scale.height / 2;

    const buttonImage = scene.add.image(x, y, graphic)
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5)
        .setDepth(40); // 選択肢(30)よりさらに手前に

    // ボタンがクリックされるまで、awaitで待機する
    await new Promise(resolve => {
        buttonImage.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            resolve(); // クリックされたらPromiseを解決
        });
    });

    // --- クリック後の処理 ---
    buttonImage.destroy();
    
    // シナリオを指定のラベルにジャンプさせる
    manager.jumpTo(target);
}