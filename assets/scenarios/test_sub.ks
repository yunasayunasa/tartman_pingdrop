; === サブルーチンテスト用シナリオ ===
; [call]で呼ばれ、[return]で戻ります。
*start
kaito:「サブルーチンに突入しました！ここでセーブ＆ロードを試してください。」
[eval exp="f.sub_progress = 'entered_sub'"]
[log exp="f.sub_progress"]
[p]
yuna:「変数を変更します。戻った後に確認してください。」
[eval exp="f.sub_result = 'complete'"]
[log exp="f.sub_result"]
[p]
kaito:「[return]で戻ります。この直前でセーブ＆ロードしても大丈夫かな？」
[return]