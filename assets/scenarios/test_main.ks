; === Odyssey Engine 完成記念シナリオ：演算世界とチョコレイトRE:BIRTH 予告編 ===

; --- 1. オープニングと登場 ---
[playbgm storage="cafe" time=1000] 
[bg storage="umi" time=1500]      
[wait time=1500]
[chara_show name="roger" pos="right" x=1600 visible=false] 
[chara_show name="yuna" pos="left" y=1200 visible=false] 
[move name="yuna" y=450 alpha=1 time=1000 nowait="true"] 


[move name="roger" x=1000 alpha=1 time=1000] 

[wait time=1000]
[stop_anim name="roger"] 
yuna:「次回のゲームコーナーの更新予告なんだよ！」

roger:「次回はなんと！あのゲームコーナー[br]最初の作品、「演算世界とチョコレイト」が、ばばーんとリメイク！」
[wait time=500] 

[image storage="enzan2" layer="cg" time=500] 
[wait time=500]

[chara_jump name="yuna" nowait="true"] 
yuna:「ゲームブックの楽しさをそのままノベルゲームとして完全再現！」

roger:「君は全ルート制覇出来るかな？」

yuna:「追加ルートもあるんだよ！楽しみなんだよ！」
[chara_jump name="yuna" loop="true"] 
[chara_jump name="roger" loop="true"] 



[freeimage layer="cg" time=500] 
[image storage="enzan" layer="cg" time=500] 
[wait time=500] ; 画像の切り替わりアニメーションを待つ

「演算世界とチョコレイトRE:BIRTH」は、8月1日更新予定！お楽しみに！
[wait time=1500]

[stop_anim name="yuna"] 
[stop_anim name="roger"] 
[wait time=500] 

roger:「ところで、この動画とはまた違うエンジンだね？」

yuna:「RE:BIRTHを作ったエンジンは使いにくかったから自作したんだよ！」
[vibrate time=1000 power=0.01] 
[shake name="roger" time=1000 nowait="true"]

roger:「ええ！作った！？」 

yuna:「ばいばーいなんだよ！」
[fadeout time=500] 
[chara_hide name="yuna" time=500] 
[chara_hide name="roger" time=500]
[stopbgm time=500] 
[wait time=500] 



[s]