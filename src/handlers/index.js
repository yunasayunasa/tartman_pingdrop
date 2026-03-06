/*
 * ============================================================================
 * Odyssey Engine v3.0 - Tag Handler Registry
 * 
 * このファイルは、ゲーム内で使用される全てのシナリオタグと、
 * それを処理するハンドラ関数を結びつける中央登録所です。
 * ワイルドカード(*)によるエクスポートは`export default`と競合するため、
 * 全てのハンドラを個別にインポートし、単一のオブジェクトとしてエクスポートします。
 * ============================================================================
 */

// --- 表示・画像・キャラクター系 ---
import handleCharaShow from './scenario/chara_show.js';
import handleCharaHide from './scenario/chara_hide.js';
import handleCharaMod from './scenario/chara_mod.js';
import handleBg from './scenario/bg.js';
import handleImage from './scenario/image.js';
import handleFreeImage from './scenario/freeimage.js';

// --- アニメーション・演出系 ---
import handleMove from './scenario/move.js';
import handleWalk from './scenario/walk.js';
import handleShake from './scenario/shake.js';
import handleVibrate from './scenario/vibrate.js';
import handleFlip from './scenario/flip.js';
import handleCharaJump from './scenario/chara_jump.js';
import handleStopAnim from './scenario/stop_anim.js';
import handleFadeout from './scenario/fadeout.js';
import handleFadein from './scenario/fadein.js';
/*import handlePuppetMove from './scenario/puppet_move.js';
import handlePuppetIdleStart from './scenario/puppet_idle_start.js';
import handlePuppetIdleStop from './scenario/puppet_idle_stop.js';*/
import handleLiveBreathStart from './scenario/live_breath_start.js';
//mport handleLiveBreathStop from './scenario/live_breath_stop.js';
//import handleVideo from './scenario/video.js';
//import handleStopVideo from './scenario/stopvideo.js';
import vignette from './scenario/vignette.js';

// --- 音声系 ---
import handlePlaySe from './scenario/playse.js';
import handlePlayBgm from './scenario/playbgm.js';
import handleStopBgm from './scenario/stopbgm.js';
//import handleVoice from './scenario/voice.js';

// --- 変数・ロジック・デバッグ系 ---
import handleEval from './scenario/eval.js';
import handleIf from './scenario/if.js';
import handleElsif from './scenario/elsif.js';
import handleElse from './scenario/else.js';
import handleEndif from './scenario/endif.js';
import handleLog from './scenario/log.js';

// --- フロー制御・待機系 ---
import handleP from './scenario/p.js';
import handleS from './scenario/s.js';
import handleWait from './scenario/wait.js';
import handleDelay from './scenario/delay.js';

// --- UI・インタラクション系 ---
import handleCm from './scenario/cm.js';
import handleEr from './scenario/er.js';
import handleLink from './scenario/link.js';
import handleR from './scenario/r.js';
import handleButton from './scenario/button.js';
import handleHideWindow from './scenario/hidewindow.js';
import handleShowWindow from './scenario/showwindow.js';


// --- シーン・サブルーチン遷移系 ---
import handleJump from './scenario/jump.js';
import handleCall from './scenario/call.js';
import handleReturn from './scenario/return.js';

// ============================================================================
// ★★★ 唯一のエクスポートポイント ★★★
// 全てのハンドラをこの tagHandlers オブジェクトにまとめてエクスポートする
// ============================================================================
export const tagHandlers = {
    // 表示・画像・キャラクター系
    'chara_show': handleCharaShow,
    'chara_hide': handleCharaHide,
    'chara_mod': handleCharaMod,
    'bg': handleBg,
    'image': handleImage,
    'freeimage': handleFreeImage,

    // アニメーション・演出系
    'move': handleMove,
    'walk': handleWalk,
    'shake': handleShake,
    'vibrate': handleVibrate,
    'flip': handleFlip,
    'chara_jump': handleCharaJump,
    'stop_anim': handleStopAnim,
    'fadeout': handleFadeout,
    'fadein': handleFadein,
  /*  'puppet_move': handlePuppetMove,
    'puppet_idle_start': handlePuppetIdleStart,
    'puppet_idle_stop': handlePuppetIdleStop,*/
   'live_breath_start': handleLiveBreathStart,
    //'live_breath_stop': handleLiveBreathStop,
   // 'video': handleVideo,
    //'stopvideo': handleStopVideo,
    'vignette': vignette,

    // 音声系
    'playse': handlePlaySe,
    'playbgm': handlePlayBgm,
    'stopbgm': handleStopBgm,
  //  'voice': handleVoice,

    // 変数・ロジック・デバッグ系
    'eval': handleEval,
    'if': handleIf,
    'elsif': handleElsif,
    'else': handleElse,
    'endif': handleEndif,
    'log': handleLog,

    // フロー制御・待機系
    'p': handleP,
    's': handleS,
   'wait': handleWait,
    'delay': handleDelay,
    
    // UI・インタラクション系
    'cm': handleCm,
    'er': handleEr,
    'link': handleLink,
    'r': handleR,
    'button': handleButton,
     'hidewindow': handleHideWindow,
    'showwindow': handleShowWindow,
    
    // シーン・サブルーチン遷移系
    'jump': handleJump,
    'call': handleCall,
   'return': handleReturn,
};
