// src/main.js (直接クラス渡し形式での最終修正 - ステップ1-1)

import PreloadScene from './scenes/PreloadScene.js';
import SystemScene from './scenes/SystemScene.js';
import UIScene from './scenes/UIScene.js';
import GameScene from './scenes/GameScene.js';
import { uiRegistry as rawUiRegistry, sceneUiVisibility } from './ui/index.js'; // ★元データを別名でインポート
import { eventTagHandlers } from './handlers/events/index.js';
import SaveLoadScene from './scenes/SaveLoadScene.js';
import ConfigScene from './scenes/ConfigScene.js';
import BacklogScene from './scenes/BacklogScene.js';
import ActionScene from './scenes/ActionScene.js';
import BattleScene from './scenes/BattleScene.js';
import OverlayScene from './scenes/OverlayScene.js';
import NovelOverlayScene from './scenes/NovelOverlayScene.js';
import EditorPlugin from './plugins/EditorPlugin.js';
import JumpScene from './scenes/JumpScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import TrialScene from './scenes/TrialScene.js'; // ★ 追加
// ★★★ 新設：uiRegistryを自動処理する非同期関数 ★★★
// pathから動的にモジュールをimportするため、asyncにする
async function processUiRegistry(registry) {
    const processed = JSON.parse(JSON.stringify(registry));

    for (const key in processed) {
        const definition = processed[key];

        if (definition.path) {
            try {
                const module = await import(definition.path);
                const UiClass = module.default;

                // ★★★ ここからが修正の核心 ★★★
                // 読み込んだクラスを`component`プロパティとして格納する
                definition.component = UiClass;
                // 不要になったpathは削除しても良い（任意）
                // delete definition.path; 

                if (UiClass && UiClass.dependencies) {
                    definition.watch = UiClass.dependencies;
                    // console.log(`[UI Registry] Processed '${key}'. Auto-configured 'watch'.`);
                }
            } catch (e) {
                console.error(`Failed to process UI definition for '${key}'`, e);
            }
        }
    }
    return processed;
}


const config = {
    type: Phaser.AUTO,
    input: {
        topOnly: false
    },
    scale: {
        mode: Phaser.Scale.FIT,
        // ★★★ 変更点1: 親要素のIDを変更 ★★★
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    // ★★★ 修正箇所: シーン設定を直接クラスを渡す形式に維持 ★★★
    scene: [
        PreloadScene,
        SystemScene,
        //  UIScene,       
        //  GameScene,   
        TitleScene,      // ★ 追加
        GameOverScene,   // ★ 追加
        SaveLoadScene,
        ConfigScene,
        BacklogScene,
        ActionScene,
        BattleScene,
        JumpScene,
        OverlayScene,
        NovelOverlayScene,
        TrialScene
    ],
    input: {
        activePointers: 3 // 同時に3つのタッチを認識できるようにする
    },
    // ★★★ 変更点2: EditorPluginをグローバルプラグインとして登録 ★★★
    plugins: {
        global: [
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
            // ★★★ start: true に戻し、Phaserに起動を完全に任せる ★★★
            { key: 'EditorPlugin', plugin: EditorPlugin, start: true }
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        ]
    },
    /* physics: {
         default: 'arcade',
         arcade: {
             gravity: { y: 800 }, // 標準の重力
             debug: true // 開発中はtrueにして当たり判定を可視化
         }
     }*/
    physics: {
        default: 'matter', // ★ デフォルトを 'matter' に変更
        matter: {
            gravity: {
                y: 1 // Matter.jsの重力はスケールが違う。1が標準的
            }

        }
    }
};

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug')) {
        document.body.classList.add('debug-mode');
    }
    // ★ステップ1: 必要なデータを先に非同期で準備する
    const processedUiRegistry = await processUiRegistry(rawUiRegistry);
    // ★★★ 1. 処理後のuiRegistryの中身をコンソールに出力 ★★★
    // console.log("%c[main.js] Final processed uiRegistry:", "color: limegreen; font-weight: bold;", processedUiRegistry);

    // Phaser Gameインスタンスを生成
    const game = new Phaser.Game(config);


    /*  game.input.on('pointerdown', (pointer) => {
      console.log('====================================================');
      console.log(`%c[GLOBAL DEBUG] Pointer Down Event at (${pointer.x}, ${pointer.y})`, "color: magenta; font-size: 1.2em;");
      
      // 現在アクティブな全てのシーンを取得
      const activeScenes = game.scene.getScenes(true);
  
      console.log(`%c[GLOBAL DEBUG] Active Scenes (${activeScenes.length}):`, "color: magenta;");
      activeScenes.forEach(scene => {
          console.log(`  - Key: ${scene.scene.key}, Status: ${game.scene.getStatus(scene)}`);
      });
  
      // どのGameObjectがクリックされたかを特定する
      // game.input.hitTest() を使って、クリック位置にあるインタラクティブなオブジェクトのリストを取得
      const hitTestResults = game.input.hitTest(pointer, activeScenes, game.cameras.main);
  
      if (hitTestResults.length > 0) {
          console.log(`%c[GLOBAL DEBUG] Hit Test Results (${hitTestResults.length}):`, "color: magenta;");
          hitTestResults.forEach((obj, index) => {
              console.log(`  [${index}] GameObject Name: ${obj.name}, Scene: ${obj.scene.scene.key}, Depth: ${obj.depth}`);
          });
      } else {
          console.log("%c[GLOBAL DEBUG] No interactive objects found at this position.", "color: magenta;");
      }
      console.log('====================================================');
  });*/

    // ★ステップ2: ゲームインスタンスができた直後に、準備したデータを登録する
    // これにより、どのシーンが起動するよりも先にデータが利用可能になることが保証される
    game.registry.set('uiRegistry', processedUiRegistry);
    game.registry.set('sceneUiVisibility', sceneUiVisibility);
    game.registry.set('eventTagHandlers', eventTagHandlers);


};
