// src/handlers/events/timer_check.js

/**
 * [timer_check]タグ ... (コメントはそのまま)
 */
export default async function timer_check(interpreter, params) {
    const source = interpreter.currentSource;
    const duration = parseFloat(params.duration);
    const timerId = `vsl_timer_${params.id || 'default'}`;
    const now = interpreter.scene.time.now;

    if (isNaN(duration)) {
        console.error("[timer_check] durationが不正です。");
        return 'output_finished';
    }

    let startTime = source.getData(timerId);

    if (!startTime) {
        startTime = now;
        source.setData(timerId, startTime);
    }

    const elapsedTime = now - startTime;

    if (elapsedTime >= duration) {
        source.setData(timerId, null);
        return 'output_finished';
    } else {
        return 'output_running';
    }
};

timer_check.define = {
    description: "指定した時間が経過したかどうかをチェックします。初回実行時にタイマーを開始します。",
    params: [
        { key: "duration", type: "number", label: "時間(ms)", defaultValue: 1000 },
        { key: "id", type: "string", label: "タイマーID", defaultValue: "default" }
    ],
    pins: {
        inputs: [{ name: "input", label: "" }],
        outputs: [
            { name: "output_running", label: "実行中" },
            { name: "output_finished", label: "完了" }
        ]
    }
};