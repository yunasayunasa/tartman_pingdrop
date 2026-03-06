

export default class HpBar extends Phaser.GameObjects.Container {
    // ★★★ 1. 依存関係を静的に自己申告する ★★★
    // プレイヤー用と敵用の両方の変数を監視対象として宣言しておく
    static dependencies = ['player_hp', 'player_max_hp', 'enemy_hp', 'enemy_max_hp'];

    /**
     * @param {Phaser.Scene} scene
     * @param {object} config - UISceneから渡される設定オブジェクト
     */
    constructor(scene, config) {
        // ★★★ 2. コンストラクタの引数をconfigオブジェクトから受け取るように変更 ★★★
        super(scene, 0, 0); // 位置はUISceneが設定
this.watchVariable = config.watchVariable; // 'player_hp'
    this.maxVariable = config.maxVariable;   // 'player_max_hp'
    this.setData('watchVariable', this.watchVariable);
    this.setData('maxVariable', this.maxVariable);
        // configオブジェクトから値を取り出す
        const width = config.width || 200;
        const height = config.height || 25;
        this.type = config.type || 'player'; // 'player' or 'enemy'

        this.barWidth = width;
        this.barHeight = height;

        // ★★★ HPバーの背景 (変更なし) ★★★
        this.background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0, 0.5);
        this.add(this.background);

        // ★★★ HPバー本体 (変更なし) ★★★
        const barColor = (this.type === 'player') ? 0x00ff00 : 0xff0000;
        this.bar = scene.add.rectangle(0, 0, width, height, barColor)
            .setOrigin(0, 0.5);
        this.add(this.bar);

        // ★★★ HP数値テキスト (変更なし) ★★★
        this.hpText = scene.add.text(width / 2, 0, '100/100', {
            fontSize: (height * 0.8) + 'px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.add(this.hpText);
   
        // ★★★ 3. StateManagerの直接購読を削除 ★★★
        // this.stateManager = config.stateManager;
        // this.stateManager.on('f-variable-changed', this.onFVariableChanged, this);
        
        // ★★★ 4. シーンへの直接追加とdepth設定を削除 ★★★
        // これらはUISceneのregisterUiElementが責任を持つ
        // scene.add.existing(this);
        // this.setDepth(100);

        // ★★★ 5. 初期HP設定を削除 ★★★
        // 初期値は最初のupdateValue呼び出しで設定される
        // this.setHp(this.maxHp, this.maxHp);
    }

    // ★★★ 6. 規約に沿った更新メソッド `updateValue` を実装 ★★★
    /**
     * StateManagerの状態オブジェクトを受け取り、HPバーの表示を更新する
     * @param {object} state - StateManager.f オブジェクト
     */
    updateValue(state) {
        // 自分のタイプ（'player' or 'enemy'）に応じた変数をstateから取得
        const currentHpKey = `${this.type}_hp`;
        const maxHpKey = `${this.type}_max_hp`;
        
        const currentHp = state[currentHpKey] || 100; // 未定義の場合は初期値100
        const maxHp = state[maxHpKey] || 100;     // 未定義の場合は初期値100

        // setHpメソッドを呼び出して、実際の表示更新を行う
        this.setHp(currentHp, maxHp);
    }

    /**
     * HPバーの表示を具体的に更新する内部メソッド (ロジックは流用)
     * @param {number} currentHp - 新しい現在HP
     * @param {number} maxHp - 新しい最大HP
     */
    setHp(currentHp, maxHp) {
        const clampedHp = Phaser.Math.Clamp(currentHp, 0, maxHp);

        // バーの幅を計算
        const barScale = (maxHp > 0) ? (clampedHp / maxHp) : 0;
        const targetWidth = this.barWidth * barScale;

        // HPテキストを更新
        this.hpText.setText(`${clampedHp}/${maxHp}`);

        // 既存のTweenを停止
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this.bar);
        }
        
        // なめらかにHPが変化するアニメーション
        this.scene.tweens.add({
            targets: this.bar,
            width: targetWidth,
            duration: 200,
            ease: 'Linear'
        });
    }

    // ★★★ 7. `destroy`メソッドを削除 ★★★
    // StateManagerを直接購読しないので、リスナー解除も不要
    // destroy(fromScene) { ... }
}