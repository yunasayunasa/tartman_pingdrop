// src/components/index.js

// --- 1. 存在する全てのコンポーネントクラスをインポートします ---
import PlayerController from './PlayerController.js';
import Scrollable from './Scrollable.js';
import Interactor from './Interactor.js';
import FlashEffect from './FlashEffect.js';
import StateMachineComponent from './StateMachineComponent.js';
import NpcController from './NpcController.js';
import WanderComponent from './WanderComponent.js';
import AnimationController from './AnimationController.js';
import ChaseComponent from './ChaseComponent.js';
import ReturnHomeComponent from './ReturnHomeComponent.js';
import LightComponent from './LightComponent.js';
import VignetteComponent from './VignetteComponent.js';
import FogComponent from './FogComponent.js';
import DetectionAreaComponent from './DetectionAreaComponent.js';
import PatrolComponent from './PatrolComponent.js';
import TestimonyFlowComponent from './TestimonyFlowComponent.js';
import TrialSegmentManager from './TrialSegmentManager.js';
import InteractionMenuComponent from './InteractionMenuComponent.js';
import ProgressIndicatorComponent from './ProgressIndicatorComponent.js';



//UI系
import WatchVariableComponent from '../ui/WatchVariableComponent.js';
import BarDisplayComponent from '../ui/BarDisplayComponent.js';
import TextDisplayComponent from '../ui/TextDisplayComponent.js';
// (将来、新しいコンポーネントを追加したら、ここにもimport文を追加します)


// --- 2. インポートしたクラスを、キーと値が同じオブジェクトにまとめます ---
// これが、エンジン全体で共有される「コンポーネントの名簿」になります。
export const ComponentRegistry = {
    PlayerController,
    Scrollable,
    Interactor,
    FlashEffect,
    StateMachineComponent,
    NpcController,
    WanderComponent,
    AnimationController,
    ChaseComponent,
    ReturnHomeComponent,
    LightComponent,
    VignetteComponent,
    FogComponent,
    DetectionAreaComponent,
    PatrolComponent,
    TestimonyFlowComponent,
    TrialSegmentManager,
    InteractionMenuComponent,
    ProgressIndicatorComponent,


    //UI系
    WatchVariableComponent,
    BarDisplayComponent,
    TextDisplayComponent
    // (新しいコンポーネントを追加したら、ここにも名前を追加します)
};