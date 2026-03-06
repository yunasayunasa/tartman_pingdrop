// src/handlers/events/index.js (最終FIX・完成版)

// すべてのハンドラを、'export default'されている前提でインポート
import time_stop from './time_stop.js';
import time_resume from './time_resume.js';
import tween from './tween.js';
import destroy from './destroy.js';
import set_visible from './set_visible.js';
import body_velocity from './body_velocity.js';
import anim_play from './anim_play.js'; 
import anim_stop from './anim_stop.js';
import anim_frame from './anim_frame.js';
import eval_expression from './eval.js';
import set_flip_x from './set_flip_x.js';
import reload_scene from './reload_scene.js';
import apply_force from './apply_force.js';
import play_sound from './play_sound.js';
import spawn_object from './spawn_object.js';
import interact_add from './interact_add.js';
import interact_remove from './interact_remove.js';
import transition_scene from './transition_scene.js';
import wait from './wait.js';
import camera_shake from './camera_shake.js';
import camera_fade from './camera_fade.js';
import camera_follow from './camera_follow.js';
import play_bgm from './play_bgm.js';
import stop_bgm from './stop_bgm.js';
import set_collision from './set_collision.js';
import set_data from './set_data.js';
import return_novel from './return_novel.js';
import stop_sound from './stop_sound.js';
import run_scenario from './run_scenario.js'; 
import set_ui_visible from './set_ui_visible.js';
import flash_effect from './flash_effect.js';
import vignette from './vignette.js';
import _if from './if.js';
import _else from './else.js';
import endif from './endif.js';
import fire_event from './fire_event.js';
import state_transition from './state_transition.js';
import distance_check from './distance_check.js';
import move_to_target from './move_to_target.js';
import timer_check from './timer_check.js';
import fire_scene_event from './fire_scene_event.js';
import toggle_hiding from './toggle_hiding.js';
import save_game from './save_game.js';
import load_game from './load_game.js';
import call_component_method from './call_component_method.js';
import close_menu from './close_menu.js'; 
import open_menu from './open_menu.js'; 
import run_scene from './run_scene.js'; 
import fire_game_flow_event from './fire_game_flow_event.js';
// ActionInterpreterが使う、イベントタグのカタログ
export const eventTagHandlers = {
    'time_stop': time_stop,
    'time_resume': time_resume,
    'tween': tween,
    'destroy': destroy,
    'set_visible': set_visible,
    'body_velocity': body_velocity,
    'anim_play': anim_play,
    'anim_stop': anim_stop,
    'anim_frame': anim_frame,
    'eval': eval_expression,
    'set_flip_x': set_flip_x,
    'reload_scene': reload_scene,
    'apply_force': apply_force,
    'play_sound': play_sound,
    'spawn_object': spawn_object,
    'interact_add': interact_add,
    'interact_remove': interact_remove,
    'transition_scene': transition_scene,
    'wait': wait,
    'camera_shake': camera_shake,
    'camera_fade': camera_fade,
    'camera_follow': camera_follow,
    'play_bgm': play_bgm,
    'stop_bgm': stop_bgm,
    'set_collision': set_collision,
    'set_data': set_data,
    'return_novel': return_novel,
    'stop_sound': stop_sound,
    'run_scenario': run_scenario, 
    'set_ui_visible': set_ui_visible,
    'flash_effect' : flash_effect,
    'vignette': vignette,
    'fire_event' : fire_event,
    'if': _if,
    'else': _else,
    'endif': endif,
    'state_transition': state_transition,
'distance_check': distance_check,
   'move_to_target': move_to_target,
   'timer_check': timer_check,
   'fire_scene_event':fire_scene_event,
'toggle_hiding':toggle_hiding,
'call_component_method': call_component_method,
'close_menu':close_menu,
'open_menu':open_menu,
'save_game':save_game,
'load_game':load_game,
'run_scene':run_scene,
 'fire_game_flow_event': fire_game_flow_event

};