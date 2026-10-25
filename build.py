import os, re
ROOT = os.path.dirname(os.path.abspath(__file__))
order = ['sprites.js','world.js','engine.js','vec.js','cat.js','gl.js','paint.js','stage.js','r3.js','toon.js','gear.js','props.js','shopdeco.js','flowers2.js','art.js','data.js','actors.js','night.js','partner.js','nightplus.js','day.js','ui.js','bouquet.js','bqui.js','progress.js','garden.js','catskills.js','shopexp.js','events.js','gang.js','nightmarket.js','story.js','comic.js','cutegame.js','scene3d.js','main.js']
js = '\n'.join(open(os.path.join(ROOT,'src',f),encoding='utf-8').read() for f in order)
head = open(os.path.join(ROOT,'src','head.html'),encoding='utf-8').read()
page = head + "\n<script>\n(function () {\n'use strict';\n" + js + "\n})();\n</script>\n"
os.makedirs(os.path.join(ROOT,'dist'), exist_ok=True)
open(os.path.join(ROOT,'dist','touhuamiao.html'),'w',encoding='utf-8').write(page)
# 本機測試用：補上發布時才會加的外框
test = ('<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
        '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
        '</head><body>' + page + '</body></html>')
open(os.path.join(ROOT,'dist','test.html'),'w',encoding='utf-8').write(test)
open(os.path.join(ROOT,'dist','game.js'),'w',encoding='utf-8').write("(function () {\n'use strict';\n" + js + "\n})();\n")
print('built', len(page), 'bytes')
