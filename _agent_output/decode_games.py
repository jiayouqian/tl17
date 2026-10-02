#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""解码 chuangqi_d1.js + chuangqi_d2.js -> gzip -> HTML -> GAMES 数组 -> games.json"""
import base64, gzip, re, json, sys, os

REPO = '/home/user/Doubao/chats/38444600724347906/tl17-repo'
OUT = os.path.join(REPO, '_agent_output')

d1 = open(os.path.join(REPO, 'chuangqi_d1.js'), encoding='utf-8').read()
d2 = open(os.path.join(REPO, 'chuangqi_d2.js'), encoding='utf-8').read()

m1 = re.search(r'B64A\s*=\s*"([^"]*)"', d1)
m2 = re.search(r'B64B\s*=\s*"([^"]*)"', d2)
if not m1 or not m2:
    print('FAIL: B64A/B64B not found'); sys.exit(1)

b64 = m1.group(1) + m2.group(1)
print('B64A len:', len(m1.group(1)), '| B64B len:', len(m2.group(1)), '| total:', len(b64))

raw = base64.b64decode(b64)
html = gzip.decompress(raw).decode('utf-8', errors='replace')
html_path = os.path.join(OUT, 'chuangqi_decoded.html')
open(html_path, 'w', encoding='utf-8').write(html)
print('HTML len:', len(html), '->', html_path)

# 提取 GAMES 数组
m = re.search(r'GAMES\s*=\s*(\[.*?\])\s*;?\s*</script>', html, re.S)
if not m:
    m = re.search(r'GAMES\s*=\s*(\[.*?\]);', html, re.S)
if not m:
    print('FAIL: GAMES array not found'); sys.exit(1)

raw_arr = m.group(1)
try:
    games = json.loads(raw_arr)
except Exception as e:
    # 可能是单引号/注释，尝试清理
    print('JSON parse fail:', e)
    sys.exit(1)

print('GAMES count:', len(games))
print('=' * 60)
print(f"{'id':<14}{'name':<12}{'imgs':<5}{'hero'}")
for g in games:
    imgs = []
    for s in g.get('sections', []):
        imgs.extend(s.get('imgs', []))
    hero = g.get('hero', '')
    hero_tail = hero[-60:] if len(hero) > 60 else hero
    print(f"{g.get('id','?'):<14}{g.get('name','?'):<12}{len(imgs):<5} | {hero_tail}")

# 输出完整 games.json
games_json = []
for g in games:
    games_json.append({
        'id': g.get('id'), 'name': g.get('name'), 'slogan': g.get('slogan'),
        'badge': g.get('badge'), 'category': g.get('category'),
        'thumb': g.get('thumb'), 'hero': g.get('hero'),
        'codes': g.get('codes'), 'benefits': g.get('benefits'),
        'regLink': g.get('regLink'), 'payLink': g.get('payLink'),
        'agentCode': g.get('agentCode'),
        'sections': g.get('sections', []),
        'imgs': [im for s in g.get('sections', []) for im in s.get('imgs', [])],
    })
json_path = os.path.join(OUT, 'games.json')
open(json_path, 'w', encoding='utf-8').write(json.dumps(games_json, ensure_ascii=False, indent=1))
print('=' * 60)
print('games.json written:', json_path)
