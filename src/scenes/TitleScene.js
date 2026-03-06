// src/scenes/TitleScene.js (最終FIX・完成版)

import BaseGameScene from './BaseGameScene.js';

export default class TitleScene extends BaseGameScene {
    constructor() {
        // ★ 1. コンストラクタは、キーを渡すだけ
        super({ key: 'TitleScene' });
    }

    create() {
        // ★ 2. createメソッドは、親のcreateを呼び出し、
        //    initSceneWithDataを呼び出すだけ。
        //    ジョイスティックも、物理エンジンも、カメラの境界設定も、
        //    TitleSceneには不要。
        super.create(); 
        this.initSceneWithData();
    }

    onSetupComplete() {
        // ★ 3. onSetupCompleteで、このシーン独自の処理を行う
        //    (例：BGMの再生)
        console.log('[TitleScene] Data-driven setup complete. Playing title music.');
        const soundManager = this.registry.get('soundManager');
        if (soundManager) {
            soundManager.playBgm('title_music_key'); // ★ あなたのタイトルBGMのキーに書き換えてください
        }
    }

    // ★ JumpSceneからコピーした、他の全てのメソッド
    // (dumpJoyStickState, onSceneResume, addObjectFromEditor, 
    //  setupPlayerAndCamera, update, setupJoystick, 
    //  attachJumpButtonListener, addJoystickFromEditor, shutdown)
    // は、TitleSceneには不要なので、全て削除します。
}