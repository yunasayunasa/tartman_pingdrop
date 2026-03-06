export default class ScenarioManager {
    constructor(scene, messageWindow, stateManager, soundManager) {
        // --- 必須サービスの登録 ---
        this.scene = scene;
        this.messageWindow = messageWindow;
        this.stateManager = stateManager;
        this.soundManager = soundManager;

        // --- sceneから取得可能なプロパティ ---
        this.layers = scene.layer; // GameSceneの'layer'プロパティを参照
        this.characterDefs = scene.charaDefs || {};

        // --- 内部状態の初期化 ---
        this.configManager = scene.registry.get('configManager'); // configManagerはregistryから取得
        this.scenario = [];
        this.currentFile = null;
        this.currentLine = 0;
        this.isWaitingClick = false;
        this.isWaitingTag = false;
        this.isEnd = false;
        this.isStopped = false;
        this.mode = 'normal';
        this.autoTimer = null;
        this.tagHandlers = new Map();
        this.ifStack = [];
        this.callStack = [];
    }

    registerTag(tagName, handler) {
        this.tagHandlers.set(tagName, handler);
    }

   
 // ScenarioManager.js の next() と parse() を置き換える

       // --- 新しいゲームループの開始点 ---
    next() {
        // 待機フラグを解除して、ゲームループを開始する
        this.isWaitingClick = false;
        this.isWaitingChoice = false;
        this.isStopped = false;
        this.isEnd = false;
        // ループが既に動いている場合は、重複して実行しないようにする
        if (this.isLoopRunning) return;
        
        this.gameLoop();
    }
  // ★★★ 追加: ScenarioManagerを停止させるメソッド ★★★
    stop() {
        this.isStopped = true;
        this.isEnd = true; // gameLoopを抜けるようにする
        // console.log("ScenarioManager: 停止しました。");
        // もしタイマー（オートモードなど）があれば、ここでクリアする
        if (this.autoTimer) {
            this.autoTimer.remove();
            this.autoTimer = null;
        }
    }
    // --- 新しいメインループ ---
       async gameLoop() {
        this.isLoopRunning = true;
        // console.log(`[gameLoop] >> ループ開始 (Line: ${this.currentLine})`);

        while (!this.isEnd && !this.isWaitingClick && !this.isWaitingChoice && !this.isStopped) {
            
            if (this.currentLine >= this.scenario.length) {
                this.isEnd = true;
                this.messageWindow.setText('（シナリオ終了）', false);
                break;
            }

            const line = this.scenario[this.currentLine];
            const processingLine = this.currentLine; // ログ用に現在行を保持
            this.currentLine++;

            // console.log(`[gameLoop] -> Line ${processingLine} のパースを開始: "${line}"`);
            
            await this.parse(line);

            // console.log(`[gameLoop] <- Line ${processingLine} のパースが完了。`);
        }
        
        this.isLoopRunning = false;
        // console.log(`[gameLoop] << ループ停止。isEnd=${this.isEnd}, isWaitingClick=${this.isWaitingClick}, isWaitingChoice=${this.isWaitingChoice}, Line: ${this.currentLine}`);
    }
     // --- クリック処理 ---
    onClick() {
       
        
        if (this.isEnd) return;
        
        if (this.isWaitingChoice) return;

        if (this.messageWindow.isTyping) {
            this.messageWindow.skipTyping();
            return;
        }

        if (this.isWaitingClick) {
            this.messageWindow.hideNextArrow();
            this.next(); 
        }
    }


 // --- parseメソッドは、状態を変更するだけ ---
    // ScenarioManager.js の parse メソッド (最終版 Ver.2)

    

async parse(line) {
    const trimedLine = line.trim();

    // if文のスキップ処理 (変更なし)
    const ifState = this.ifStack.length > 0 ? this.ifStack[this.ifStack.length - 1] : null;
    if (ifState && ifState.skipping) {
        const { tagName } = this.parseTag(trimedLine);
        if (['if', 'elsif', 'else', 'endif'].includes(tagName)) {
            const handler = this.tagHandlers.get(tagName);
            if (handler) await handler(this, this.parseTag(trimedLine).params);
        }
        return;
    }

    // --- 通常実行 ---
    if (trimedLine.startsWith(';') || trimedLine.startsWith('*') || trimedLine.startsWith('@')) {
        // コメント、ラベル、アセットは無視
    } 
    else if (trimedLine.startsWith('[')) {
        // --- タグ行 ---
        const { tagName, params } = this.parseTag(trimedLine);
        const handler = this.tagHandlers.get(tagName);

        if (handler) {
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
            // ★★★ これが全てを解決する、唯一の修正です ★★★
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
            
            // 全てのパラメータの「値」に対して、変数展開を試みる
            for (const key in params) {
                if (typeof params[key] === 'string') {
                    // [eval]タグのexp属性の場合は、中身を展開しないようにするなどの配慮は不要。
                    // embedVariablesが`&`記号を探すので、"f.hoge=0"のような文字列は変更されない。
                    params[key] = this.embedVariables(params[key]);
                }
            }

            // 修正されたparamsでハンドラを実行
            await handler(this, params);

        } else {
            console.warn(`未定義のタグです: [${tagName}]`);
        }
    } 
    else if (trimedLine.length > 0) {
    // --- セリフまたは地の文 ---
         const expandedLine = this.embedVariables(trimedLine);
       let speakerName = null;
        let dialogue = expandedLine; // ★ 変数展開後のテキストを使う
        const speakerMatch = expandedLine.match(/^([a-zA-Z0-9_]+):/);
        
        if (speakerMatch) {
            speakerName = speakerMatch[1];
            dialogue = expandedLine.substring(speakerName.length + 1).trim();
        }
        
        this.stateManager.addHistory(speakerName, dialogue);
        this.highlightSpeaker(speakerName);
        const wrappedLine = this.manualWrap(dialogue);
        const useTyping = (this.mode !== 'skip');
        
        await this.messageWindow.setText(wrappedLine, useTyping, speakerName);
    } 
}
     // (constructor, next, parseなどの他の部分は、あなたの正常に動作しているコードのままでOKです)
// ★★★ loadScenarioメソッドだけを、以下のコードで完全に置き換えてください ★★★

    
     // (constructor, next, parseなどの他の部分は、あなたの正常に動作しているコードのままでOKです)
// ★★★ loadScenarioメソッドだけを、以下のコードで完全に置き換えてください ★★★

     /**
     * 指定されたシナリオをロードし、解析して実行準備を整える (最終版)
     * @param {string} scenarioKey - 'scene2.ks' のようなファイル名
     * @param {string|null} targetLabel - ジャンプ先のラベル (例: '*start')
     */
    async loadScenario(scenarioKey, targetLabel = null) {
        // console.log(`%c[loadScenario] START: ${scenarioKey}`, "color: yellow; font-weight: bold;");
        let rawText;
        const keyWithoutExt = scenarioKey.replace('.ks', '');

        // --- 1. テキストの取得 ---
        if (this.scene.cache.text.has(keyWithoutExt)) {
            rawText = this.scene.cache.text.get(keyWithoutExt);
        } else {
            // (動的ロードのロジックは変更なし)
            await new Promise(resolve => {
                this.scene.load.text(keyWithoutExt, `assets/${scenarioKey}`);
                this.scene.load.once('complete', resolve);
                this.scene.load.start();
            });
            rawText = this.scene.cache.text.get(keyWithoutExt);
        }

        if (!rawText) {
            console.error(`シナリオファイル [${scenarioKey}] が見つからないか、中身が空です。`);
            this.isEnd = true;
            return;
        }

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここが新しい解決策です ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        
        // --- 2. 取得したテキストを解析し、プロパティを更新 ---
        // (古い`load`メソッドの仕事を、ここに持ってくる)
        this.scenario = rawText.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
        this.currentFile = scenarioKey; // 呼び出し元のファイル名を保持
        this.currentLine = 0; // 行番号をリセット
        // console.log(`[loadScenario] シナリオを解析しました: ${this.currentFile} (${this.scenario.length}行)`);


        // --- 2. @asset宣言の解析 ---
        const assetsToLoad = [];
        const lines = rawText.split(/\r\n|\n|\r/);
        for (const line of lines) {
            const trimedLine = line.trim();
            if (trimedLine.startsWith('@asset')) {
                const parts = trimedLine.split(/\s+/).slice(1); // '@asset'は無視
                const params = {};
                parts.forEach(part => {
                    const [key, value] = part.split('=');
                    params[key] = value;
                });
                
                const { type, key, path } = params;
                if (!type || !key || !path) continue;

                if ((type === 'image' && !this.scene.textures.exists(key)) ||
                (type === 'audio' && !this.scene.cache.audio.has(key))) {
                assetsToLoad.push({ type, key, path });
            }
            }
            if (trimedLine.startsWith('*')) break;
        }

        // --- 3. 動的ロードの実行 ---
        if (assetsToLoad.length > 0) {
            // console.log("追加アセットの動的ロードが必要です:", assetsToLoad);
            
            await new Promise(resolve => {
                this.scene.scene.launch('LoadingScene', {
                    assets: assetsToLoad,
                    onComplete: resolve
                });
            });
            // console.log("追加アセットのロードが完了しました。");
        }

        // --- 4. ラベルへのジャンプ ---
        if (targetLabel) {
            this.jumpTo(targetLabel);
        }
        
        // console.log(`%c[loadScenario] END: ${scenarioKey}`, "color: yellow; font-weight: bold;");
    }
    jumpTo(target) {
        const labelName = target.substring(1);
        const targetLineIndex = this.scenario.findIndex(line => line.trim().startsWith('*') && line.trim().substring(1) === labelName);
        if (targetLineIndex !== -1) {
            this.currentLine = targetLineIndex;
        } else {
            console.error(`ジャンプ先のラベル[${target}]が見つかりませんでした。`);
        }
    }

    embedVariables(line) {
        // console.log(`.......... ScenarioManager.embedVariables 開始: "${line}"`);

        return line.replace(/&((f|sf)\.[a-zA-Z0-9_.-]+)/g, (match, exp) => {
             // console.log(`.............. embedVariables: 変数展開を試みます -> ${exp}`);
             
            // ★★★ 修正箇所: stateManager.eval -> stateManager.getValue ★★★
            const value = this.stateManager.getValue(exp); 

            if (value === undefined || value === null) {
                return `(undef: ${exp})`;
            }
            return value;
        });
    }

    parseTag(tagString) {
        const content = tagString.substring(1, tagString.length - 1).trim();
        const firstSpaceIndex = content.indexOf(' ');
        const tagName = firstSpaceIndex === -1 ? content : content.substring(0, firstSpaceIndex);
        const attributesString = firstSpaceIndex === -1 ? '' : content.substring(firstSpaceIndex + 1);
        const params = {};
        const regex = /(\w+)\s*=\s*("[^"]*"|'[^']*'|[^'"\s]+)/g;
        let match;
        while ((match = regex.exec(attributesString)) !== null) {
            const key = match[1];
            let value = match[2];
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            params[key] = value;
        }
        return { tagName, params };
    }
    
    manualWrap(text) {
        // ★★★ 1. 最初に[br]を改行コード(\n)にすべて置換する ★★★
        const textWithBr = text.replace(/\[br\]/g, '\n');

        let wrappedText = '';
        let currentLine = '';
        const textBoxWidth = this.messageWindow.textBoxWidth;
        const style = { fontFamily: this.messageWindow.textObject.style.fontFamily, fontSize: this.messageWindow.textObject.style.fontSize };

        // ★★★ 2. 置換後のテキストを、改行コードで一度分割する ★★★
        const lines = textWithBr.split('\n');

        // 3. 分割された各行に対して、自動折り返し処理を行う
        for (const singleLine of lines) {
            let lineBuffer = '';
            for (let i = 0; i < singleLine.length; i++) {
                const char = singleLine[i];
                const testLine = lineBuffer + char;
                const metrics = this.scene.add.text(0, 0, testLine, style).setVisible(false);
                
                if (metrics.width > textBoxWidth && lineBuffer.length > 0) {
                    wrappedText += lineBuffer + '\n';
                    lineBuffer = char;
                } else {
                    lineBuffer = testLine;
                }
                metrics.destroy();
            }
            wrappedText += lineBuffer + '\n'; // 各行の終わりにも改行を追加
        }
        
        // 最後に余分な改行が残ることがあるので、削除する
        return wrappedText.trimEnd();
    }

   highlightSpeaker(speakerName) {
        const bright = 0xffffff;
        const dark = 0x888888;
        for (const name in this.scene.characters) {
            const chara = this.scene.characters[name];
            if (chara && chara.active) {
                if (speakerName === null || speakerName === name) {
                    chara.setTint(bright);
                } else {
                    chara.setTint(dark);
                }
            }
        }
    }



    // ★★★ モードを切り替えるためのメソッド ★★★
       setMode(newMode) {
        if (this.mode === newMode && newMode !== 'skip') {
             // スキップモードでない時に同じボタンが押されたら、モードをノーマルに戻す
             this.mode = 'normal';
             if (this.autoTimer) this.autoTimer.remove();
             // console.log(`モード変更: ${newMode} -> normal`);
             return;
        }

        // console.log(`モード変更: ${this.mode} -> ${newMode}`);
        this.mode = newMode;

        if (this.autoTimer) this.autoTimer.remove();

        if (this.mode === 'skip') {
            // ★★★ スキップループを開始 ★★★
            this.skipLoop();
        } else if (this.mode === 'auto') {
            this.startAutoMode();
        }
    }

    // ★★★ スキップ専用のループメソッドを新設 ★★★
    skipLoop() {
        // スキップモードでない、または待機状態ならループを止める
        if (this.mode !== 'skip' || this.isWaitingChoice || this.isEnd) {
            // console.log("スキップを停止します。");
            this.setMode('normal'); // 通常モードに戻す
            return;
        }

        // isWaitingClickを強制的に解除し、次の行へ
        this.isWaitingClick = false;
        this.next();
        
        // ★★★ 非常に短い遅延で、自分自身をもう一度呼び出す ★★★
        // これにより、ブラウザをフリーズさせずに高速なループを実現する
        setTimeout(() => this.skipLoop(), 0);
    }
    // ★★★ オートモードのタイマーを開始するメソッド ★★★
    // ScenarioManager.js の startAutoMode メソッド
startAutoMode() {
    // isWaitingClick状態の時だけタイマーを開始
    if (this.mode === 'auto' && this.isWaitingClick) {
        const autoDelay = this.configManager.getValue('autoDelay') || 2000;
        this.autoTimer = this.scene.time.addEvent({
            delay: autoDelay,
            callback: () => {
                // プレイヤーがクリックしたのと同じ処理を呼び出す
                this.onClick(); 
            },
            callbackScope: this
        });
    }
}
  /**
     * 現在のシナリオの進行状況をオブジェクトとして返す
     * @returns {object}
     */
    getScenarioState() {
        return {
            fileName: this.currentFile,
            line: this.currentLine,
            ifStack: this.ifStack,
            callStack: this.callStack,
            isWaitingClick: this.isWaitingClick,
            isWaitingChoice: this.isWaitingChoice,
            // ...その他シナリオ進行に必要な情報...
        };
    }

    /**
     * 現在のレイヤー（背景・キャラクター）の状態をオブジェクトとして返す
     * @returns {object}
     */
    getLayerState() {
        const state = { characters: {}, background: null };
        // キャラクターの状態を保存
        for (const name in this.scene.characters) {
            const chara = this.scene.characters[name];
            if (chara && chara.visible) {
                state.characters[name] = { storage: chara.texture.key, x: chara.x, y: chara.y, alpha: chara.alpha /* ... */ };
            }
        }
        // 背景の状態を保存
        if (this.layers.background.list.length > 0) {
            state.layers.background = this.layers.background.list[0].texture.key;
        }
        return state;
    }

    // ★★★ スキップ時にUIを非表示にする（推奨） ★★★
    hideInterfaceForSkip() {
        this.layers.character.setAlpha(0);
        this.messageWindow.setAlpha(0);
    }
    showInterfaceForSkip() {
        this.layers.character.setAlpha(1);
        this.messageWindow.setAlpha(1);
    }
}