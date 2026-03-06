// src/core/ConfigManager.js (最終版)

// ★★★ 1. 設定定義は、ファイルの上部で一度だけ行う ★★★
const configDefs = {
    // ★★★ 2. 音量スケールを 0-1 に統一し、デフォルト値を十分な大きさに ★★★
    bgmVolume: { type: 'slider', label: 'BGM 音量', min: 0, max: 1, step: 0.1, defaultValue: 0.8 },
    seVolume: { type: 'slider', label: 'SE 音量', min: 0, max: 1, step: 0.1, defaultValue: 0.9 },
    textSpeed: { type: 'slider', label: 'テキスト速度', min: 0, max: 100, step: 10, defaultValue: 50 },
    typeSound: {
        type: 'option',
        label: 'タイプ音',
        options: { 'se': '効果音', 'none': '無し' },
        defaultValue: 'se'
    }
};

const STORAGE_KEY = 'my_novel_engine_config';


// ★★★ 3. ConfigManagerクラスを定義する ★★★
export default class ConfigManager extends Phaser.Events.EventEmitter {
    constructor() {
        super(); 
        this.values = {};
        const savedValues = this.load();

        for (const key in configDefs) {
            this.values[key] = savedValues[key] !== undefined ? savedValues[key] : configDefs[key].defaultValue;
        }
        // console.log("ConfigManager 初期化完了:", this.values);
    }

    getValue(key) {
        return this.values[key];
    }

    setValue(key, value) {
        const oldValue = this.values[key];
        if (oldValue === value) return;

        this.values[key] = value;
        this.save();
        this.emit(`change:${key}`, value, oldValue);
    }
    
    save() {
        try {
            const jsonString = JSON.stringify(this.values);
            localStorage.setItem(STORAGE_KEY, jsonString);
        } catch (e) {
            console.error("設定の保存に失敗しました。", e);
        }
    }

    load() {
        try {
            const jsonString = localStorage.getItem(STORAGE_KEY);
            return jsonString ? JSON.parse(jsonString) : {};
        } catch (e) {
            console.error("設定の読み込みに失敗しました。", e);
            return {};
        }
    }

    getDefs() {
        return configDefs;
    }
}