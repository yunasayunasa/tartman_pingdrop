// src/handlers/voice.js

/**
 * [voice] タグの処理
 * 指定されたテキストを合成音声で発話させる。
 * 発話中はシナリオの進行を停止する。
 * @param {ScenarioManager} manager
 * @param {Object} params - { text, lang, voice, rate, pitch }
 * @returns {Promise<void>}
 */
export async function handleVoice(manager, params) {
    // 共有されたブラウザの環境に依存するため、一度有効化されたか記録
    // シーンを跨いで状態を保持するため、manager.stateManager.sf に記録
    // ただし、毎回許可を求める設計にするなら不要
    if (manager.stateManager.sf.voiceSynthEnabled === undefined) {
        manager.stateManager.sf.voiceSynthEnabled = false;
    }

    return new Promise(resolve => {
        if (!('speechSynthesis' in window)) {
            console.warn('[voice] Web Speech API (SpeechSynthesis) はこのブラウザでサポートされていません。');
            resolve();
            return;
        }

        const text = params.text;
        if (!text) {
            console.warn('[voice] text属性は必須です。');
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        // (言語、話速、ピッチ、声の設定は変更なし)
        if (params.lang) { utterance.lang = params.lang; } else { utterance.lang = 'ja-JP'; }
        const rate = parseFloat(params.rate); if (!isNaN(rate) && rate >= 0.1 && rate <= 10.0) { utterance.rate = rate; } else { utterance.rate = 1.0; }
        const pitch = parseFloat(params.pitch); if (!isNaN(pitch) && pitch >= 0.0 && pitch <= 2.0) { utterance.pitch = pitch; } else { utterance.pitch = 1.0; }
        if (params.voice) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.name === params.voice && v.lang === utterance.lang);
            if (selectedVoice) { utterance.voice = selectedVoice; } else { console.warn(`[voice] 指定された声 (${params.voice}) が見つからないか、言語が一致しません。`); }
        }

        utterance.onend = () => {
            // console.log(`[voice] 発話完了: "${text}"`);
            resolve();
        };
        utterance.onerror = (event) => {
            console.error(`[voice] 発話エラー: "${text}"`, event);
            resolve();
        };

        // ★★★ 修正箇所: 発話ロジック ★★★
        if (manager.stateManager.sf.voiceSynthEnabled) {
            // 既に有効化済みなら、直接speakを試みる
            try {
                window.speechSynthesis.speak(utterance);
                // console.log(`[voice] (有効済み)発話開始: "${text}"`);
            } catch (e) {
                console.error(`[voice] (有効済み)発話開始失敗: "${text}"`, e);
                resolve();
            }
        } else {
            // 初回、またはブロックされている場合、ユーザーにクリックを促すボタンを表示
            // console.log(`[voice] 発話に許可が必要。ボタンを表示します: "${text}"`);
            const enableButton = manager.scene.add.text(
                manager.scene.scale.width / 2,
                manager.scene.scale.height / 2,
                "クリックして合成音声を開始",
                {
                    fontSize: '36px',
                    fill: '#fff',
                    backgroundColor: '#0055aa',
                    padding: { x: 30, y: 15 },
                    align: 'center'
                }
            )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(9999); // 最前面に

            enableButton.on('pointerdown', () => {
                // ★★★ ユーザーのクリックイベント内で直接speak()を呼び出す ★★★
                try {
                    window.speechSynthesis.speak(utterance);
                    manager.stateManager.sf.voiceSynthEnabled = true; // 許可された
                    // console.log(`[voice] (ボタンクリック)発話開始: "${text}"`);
                    enableButton.destroy(); // ボタンを削除
                } catch (e) {
                    console.error(`[voice] (ボタンクリック)発話開始失敗: "${text}"`, e);
                    // 失敗してもシナリオを進めるためにresolve
                    resolve(); 
                    enableButton.destroy();
                }
            });
            // ボタンが表示されている間はシナリオが進行しない
            // Promiseはボタンクリックイベント内でresolveされるまで解決されない
        }
    });
}