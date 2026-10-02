import re, os
WD = "/home/user/Doubao/chats/38444600724347906/tl17-repo/_agent_output/pick_work"
for f in ['nuhuo20','muying','moyingkd']:
    html = open(os.path.join(WD, f+'.html'), encoding='utf-8').read()
    body = re.sub(r'<style.*?</style>', '', html, flags=re.S)
    slides = re.findall(r'carousel-slide[^>]*>(.*?)</div>', body, re.S)
    imgs = re.findall(r'https?://file\.648wl\.com/[^"\' )]+\.(?:png|jpg|jpeg|webp)', body)
    print('===', f)
    print('  rendered carousel slides:', len([s for s in slides if s.strip()]))
    print('  file.648wl imgs in body:', sorted(set(imgs)))
    gi = re.search(r'游戏介绍(.*?)(?:页脚|footer|底部下载)', body, re.S)
    print('  game-intro section len:', len(gi.group(1).strip()) if gi else 'n/a')
    print()
