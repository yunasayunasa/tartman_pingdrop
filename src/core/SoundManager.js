export default class SoundManager {
    constructor(game) {
        this.game = game;
        this.sound = game.sound;
        this.configManager = this.game.registry.get('configManager');
        if (!this.configManager) {
            console.error("SoundManager: ConfigManagerが見つかりません！");
        }
        
        this.currentBgm = null;
        this.currentBgmKey = null;

        this.configManager.on('change:bgmVolume', this.onBgmVolumeChange, this);
        this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);

        this.activeSe = new Map(); // 再生中の効果音（特にループするもの）を管理
    }

    // AudioContextを安全に再開
    resumeContext() {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => console.log("SoundManager: AudioContextが再開されました。"));
        }
    }
    
    // コンフィグ画面からの音量変更を即時反映
    onBgmVolumeChange(newVolume) {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            this.currentBgm.setVolume(newVolume);
        }
    }

    /**
     * BGMを再生する (フェード対応・Promise版)
     * @param {string} key - 再生するBGMのアセットキー
     * @param {number} [fadeinTime=0] - フェードイン時間(ms)
     * @returns {Promise<void>} フェードイン完了時に解決されるPromise
     */
    playBgm(key, fadeinTime = 0) {
        return new Promise(resolve => {
            this.resumeContext();

            // 同じ曲が既に再生中の場合は、何もしないで即座に完了
            if (this.currentBgm && this.currentBgmKey === key && this.currentBgm.isPlaying) {
                resolve();
                return;
            }

            // 既存のBGMがあれば、まずフェードアウトさせて止める
            this.stopBgm(fadeinTime); // 新しい曲のフェードイン時間と同じ時間でクロスフェード

            // 新しいBGMを再生
            const targetVolume = this.configManager.getValue('bgmVolume');
            const newBgm = this.sound.add(key, { loop: true, volume: 0 }); // 最初は音量0
            newBgm.play();

            this.currentBgm = newBgm;
            this.currentBgmKey = key;

            // フェードインTween
            this.game.scene.getScene('SystemScene').tweens.add({
                targets: newBgm,
                volume: targetVolume,
                duration: fadeinTime,
                ease: 'Linear',
                onComplete: () => {
                    resolve(); // フェードイン完了でPromiseを解決
                }
            });
        });
    }

     /**
     * ★★★ 音ゲーの心臓部（マスタークロック）★★★
     * 現在再生中のBGMの再生位置を、ミリ秒単位の数値で返す。
     * @returns {number | null} 再生中の場合はミリ秒、再生されていない場合はnullを返す。
     */
    getBgmCurrentTimeMs() {
        // currentBgmが存在し、かつ実際に再生中であることを確認
        if (this.currentBgm && this.currentBgm.isPlaying) {
            // seekは秒単位なので、1000を掛けてミリ秒に変換する
            return this.currentBgm.seek * 1000;
        }
        // BGMが再生されていない場合は、nullを返す
        return null;
    }

    /**
 * ★★★ 新規メソッド ★★★
 * BGMを再生する (撃ちっぱなし専用バージョン)
 * GameFlowManagerなど、完了を待つ必要がないシステムから呼び出す
 */
playBgmFireAndForget(key, fadeinTime = 0) {
    // playBgmの中身とほぼ同じだが、Promiseでラップしない
    this.resumeContext();
    if (this.currentBgm && this.currentBgmKey === key && this.currentBgm.isPlaying) return;
    this.stopBgm(fadeinTime);
    const targetVolume = this.configManager.getValue('bgmVolume');
    const newBgm = this.sound.add(key, { loop: true, volume: 0 });
    newBgm.play();
    this.currentBgm = newBgm;
    this.currentBgmKey = key;
    this.game.scene.getScene('SystemScene').tweens.add({
        targets: newBgm,
        volume: targetVolume,
        duration: fadeinTime,
        ease: 'Linear'
    });
}

    /**
     * BGMを停止する (フェード対応版)
     * @param {number} [fadeoutTime=0] - フェードアウト時間(ms)
     */
    stopBgm(fadeoutTime = 0) {
        if (this.currentBgm) {
            const bgmToStop = this.currentBgm; // クロージャで参照を保持
            
            if (fadeoutTime > 0) {
                // フェードアウト
                this.game.scene.getScene('SystemScene').tweens.add({
                    targets: bgmToStop,
                    volume: 0,
                    duration: fadeoutTime,
                    ease: 'Linear',
                    onComplete: () => {
                        bgmToStop.stop();
                        bgmToStop.destroy();
                    }
                });
            } else {
                // 即時停止
                bgmToStop.stop();
                bgmToStop.destroy();
            }

            this.currentBgm = null;
            this.currentBgmKey = null;
        }
    }

   // in src/core/SoundManager.js

     /**
     * 効果音を再生する (ループ対応・停止可能なバージョン)
     * @param {string} key - 再生するSEのアセットキー
     * @param {object} [config] - 追加の設定 (loop, volumeなど)
     * @returns {Promise<void>} ループしないSEの再生完了時に解決されるPromise
     */
    playSe(key, config = {}) {
        return new Promise(resolve => {
            this.resumeContext();
            
            // --- もし同じキーのループ音が既に鳴っていたら、一旦止めてから再生 ---
            if (config.loop && this.activeSe.has(key)) {
                this.stopSe(key);
            }
            
            const baseVolume = this.configManager.getValue('seVolume');
            const finalVolume = (config.volume !== undefined) ? baseVolume * config.volume : baseVolume;
            const finalConfig = { ...config, volume: finalVolume };

            const se = this.sound.add(key, finalConfig);
            se.play();
            
            // ▼▼▼【ここからが核心の修正です】▼▼▼
            // --------------------------------------------------------------------
            if (config.loop) {
                // --- ループする場合 ---
                // 停止できるように、Mapに参照を保存
                this.activeSe.set(key, se);
                // ループ音は「再生を開始した」時点で完了とみなし、即座にresolve
                resolve(); 
            } else {
                // --- ループしない場合（これまで通り） ---
                se.once('complete', (sound) => {
                    sound.destroy();
                    resolve();
                });
            }
            // --------------------------------------------------------------------
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        });
    }



    /**
     * ★★★ 新規メソッド ★★★
     * 指定されたキーの効果音を停止する
     * @param {string} key - 停止する効果音のアセットキー
     */
    stopSe(key) {
        if (this.activeSe.has(key)) {
            const sound = this.activeSe.get(key);
            sound.stop();
            sound.destroy(); // 停止したらオブジェクトを破棄
            this.activeSe.delete(key); // Mapから参照を削除
            // console.log(`[SoundManager] Stopped and removed looping SE: ${key}`);
        }
    }

    getCurrentBgmKey() {
        // isPlayingのチェックは、シーン遷移直後などに不安定になることがあるため、
        // プロパティの存在だけで判断する方が安定する
        return this.currentBgmKey;
    }
    
    // ゲーム終了時に呼ばれるクリーンアップ処理
    destroy() {
        if (this.configManager) {
            this.configManager.off('change:bgmVolume', this.onBgmVolumeChange, this);
        }
        this.stopBgm(); // 引数なし
        // console.log("SoundManager: 破棄されました。");
    }
}
