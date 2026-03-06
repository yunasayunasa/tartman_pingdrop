export default async function handleLiveBreathStart(manager, params) {
    const { name, speed = 4000, amount = 0.015 } = params;
    const scene = manager.scene;

    if (!name) { console.warn('[live_breath_start] name属性は必須です。'); return; }
    const chara = scene.characters[name];
    if (!chara) { console.warn(`[live_breath_start] キャラクター[${name}]が見つかりません。`); return; }

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★★★ これが全てを解決する、唯一の修正です ★★★
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

    // 1. 既存のTweenを確実に停止・破棄する
    // handleLiveBreathStopを直接呼び出すのではなく、ロジックをここに統合する
    const oldTween = chara.getData('liveBreathTween');
    if (oldTween) {
        // stop()ではなく、remove()でTweenManagerから完全に削除する
        oldTween.remove(); 
    }
    const oldBreathInfo = chara.getData('breathInfo');
    if (oldBreathInfo) {
        // 状態を完全に元に戻す
        chara.setScale(chara.scaleX, oldBreathInfo.originalScale);
        chara.setOrigin(0.5, oldBreathInfo.originalOriginY);
        chara.y -= oldBreathInfo.yOffset;
    }
    
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

    // --- 2. 新しいアニメーションを開始 ---
    const duration = Number(speed) / 2;
    const scaleAmount = 1 + Number(amount);
    
    const oldOriginY = chara.originY;
    const newOriginY = 0.7;
    chara.setOrigin(0.5, newOriginY);
    
    const yOffset = chara.displayHeight * (newOriginY - oldOriginY);
    chara.y += yOffset;

    chara.setData('breathInfo', {
        yOffset: yOffset,
        originalScale: chara.scaleY,
        originalOriginY: oldOriginY
    });

    const breathTween = scene.tweens.add({
        targets: chara,
        scaleY: chara.scaleY * scaleAmount,
        duration: duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    chara.setData('liveBreathTween', breathTween);
}