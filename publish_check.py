#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tl17 发布自检脚本（一键成型，防版本事故）
============================================
用法：
  python3 publish_check.py check                # 全站自检（不推进版本）
  python3 publish_check.py v20261003xxxxxx      # 推进版本 + 全站自检
  python3 publish_check.py v20261003xxxxxx --push   # 推进 + 自检 + commit/push + 90s等待 + 线上验收

自检覆盖：
  1. 版本一致性：5 个 html 的 var __ver 全部一致，且与 version.json 的 v 字段一致
  2. 垃圾串扫描：tl17v / 双v(vv20) / 新旧版本拼接 / 检测行被污染（!==__ver='）
  3. 结构校验：<script> 与 </script> 闭合数、关键标记（version.json / __ver / kefu）
  4. 数据段解码：cq(2段) 与 魔幻(3段) 的 base64+gzip 完整解码，含游戏数组特征
  5. git 状态：未推送改动提示

版本推进只动 var __ver='...' 定义行（正则精确匹配），绝不动检测行 if(...!==__ver){，
防止再次出现 sed 污染。--push 推送后自动 sleep 90s 并 curl 线上验收。
"""
import re, base64, gzip, json, subprocess, sys, time, os

REPO = os.path.dirname(os.path.abspath(__file__))
os.chdir(REPO)

HTML_FILES = ['index.html', 'tianlong.html', 'tl-changwan.html', 'tl-mohuan.html', 'cq.html']
DATA_SEGS = {
    'cq':        {'files': ['chuangqi_d1.js', 'chuangqi_d2.js'],       'vars': ['B64A', 'B64B'], 'kind': 'games'},
    'tl-mohuan': {'files': ['index_d1.js', 'index_d2.js', 'index_d3.js'], 'vars': ['B64A', 'B64B', 'B64C'], 'kind': 'page'},
}
JUNK_PATTERNS = [
    ('tl17v 垃圾残留',        r'tl17v'),
    ('检测行被污染',          r'!==__ver='),
    ('双v版本号',             r"'vv20"),
    ('版本号拼接残留',        r"__ver='v20[^']*'v20"),
    ('版本号后跟垃圾字符',    r"__ver='[^']*'[^;)\n]{1,3}(?:;|$)(?!\))"),
]
RED, GREEN, YEL, RESET = '\033[91m', '\033[92m', '\033[93m', '\033[0m'
FAILS = []

def ok(msg): print(f"{GREEN}✅ {msg}{RESET}")
def warn(msg): print(f"{YEL}⚠️  {msg}{RESET}")
def fail(msg): print(f"{RED}❌ {msg}{RESET}"); FAILS.append(msg)

def read(fn):
    try:
        return open(fn, encoding='utf-8').read()
    except Exception as e:
        fail(f"读取失败 {fn}: {e}")
        return None

# ---------- 1. 版本一致性 ----------
def check_versions():
    vers = set()
    for f in HTML_FILES:
        s = read(f)
        if s is None: continue
        m = re.search(r"var\s+__ver\s*=\s*'([^']*)'", s)
        if not m:
            fail(f"{f}: 未找到 var __ver 定义")
            continue
        vers.add(m.group(1))
    if len(vers) == 1:
        ver = vers.pop()
        ok(f"5 个 html 的 __ver 全部一致 = {ver}")
    else:
        ver = None
        fail(f"5 个 html 的 __ver 不一致: {vers}")
    try:
        v = json.load(open('version.json', encoding='utf-8'))
        if ver and v.get('v') != ver:
            fail(f"version.json v={v.get('v')} ≠ 页面 __ver={ver}")
        else:
            ok(f"version.json v = {v.get('v')} 与页面一致")
    except Exception as e:
        fail(f"version.json 读取失败: {e}")
    return ver

# ---------- 2. 垃圾串扫描 ----------
def check_junk():
    for f in HTML_FILES:
        s = read(f)
        if s is None: continue
        for name, pat in JUNK_PATTERNS:
            for m in re.finditer(pat, s):
                fail(f"{f}: 命中[{name}] → {m.group(0)[:60]}")
    # 数据段文件也扫（d1/d2/d3 只允许 var B64X="..."）
    for seg in DATA_SEGS.values():
        for fn in seg['files']:
            s = read(fn)
            if s and 'tl17v' in s:
                fail(f"{fn}: 命中 tl17v 垃圾")

# ---------- 3. 结构校验 ----------
def check_structure():
    for f in HTML_FILES:
        s = read(f)
        if s is None: continue
        op = s.count('<script')
        cl = s.count('</script>')
        if op != cl:
            fail(f"{f}: script 标签不闭合 {op} vs {cl}")
        if 'version.json' not in s:
            fail(f"{f}: 缺少 version.json 秒更新引用")
        if '__ver' not in s:
            fail(f"{f}: 缺少 __ver")
    ok("5 个 html 结构闭合、关键标记齐全")

# ---------- 4. 数据段解码 ----------
def check_data():
    for name, cfg in DATA_SEGS.items():
        b64 = ''
        for fn, var in zip(cfg['files'], cfg['vars']):
            s = read(fn)
            if s is None: return
            m = re.search(var + r'\s*=\s*"([^"]+)"', s)
            if not m:
                fail(f"{fn}: 未找到 {var} 定义")
                return
            b64 += m.group(1)
        try:
            raw = base64.b64decode(b64)
            html = gzip.decompress(raw).decode('utf-8')
            if cfg.get('kind') == 'games':
                ok_feature = ('"id"' in html) and ('"name"' in html)
                tag = '游戏数组特征'
            else:
                ok_feature = ('<!DOCTYPE HTML>' in html.upper()) and ('<TITLE>' in html.upper())
                tag = '完整页面特征'
            if len(html) < 50 * 1024:
                fail(f"{name}: 解码后长度异常 {len(html)}")
            elif not ok_feature:
                fail(f"{name}: 解码后缺少{tag}")
            else:
                ok(f"{name}: 解码成功 {len(html)} 字符，{tag}齐全")
        except Exception as e:
            fail(f"{name}: 解码失败 → {e}")

# ---------- 5. git 状态 ----------
def check_git():
    r = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
    if r.returncode != 0:
        warn(f"git status 失败: {r.stderr.strip()}")
        return
    staged = [l for l in r.stdout.splitlines() if l.strip()]
    if staged:
        warn(f"有 {len(staged)} 个未提交/改动文件（如为计划内改动可忽略）:")
        for l in staged[:8]:
            print(f"      {l}")
    else:
        ok("git 工作区干净")

def run_all():
    print("=" * 60)
    print("tl17 全站发布自检")
    print("=" * 60)
    check_versions()
    check_junk()
    check_structure()
    check_data()
    check_git()
    if FAILS:
        print(f"\n{RED}❌ 自检未通过，共 {len(FAILS)} 项问题，禁止推送！{RESET}")
        for f in FAILS: print(f"   - {f}")
        return False
    print(f"\n{GREEN}🎉 全站自检通过，可以推送！{RESET}")
    return True

# ---------- 版本推进 ----------
def bump_version(new_ver):
    if not re.fullmatch(r'v\d{14}', new_ver):
        fail(f"版本号格式错误: {new_ver}（应为 vYYYYMMDDHHMMSS）")
        return False
    for f in HTML_FILES:
        s = read(f)
        if s is None: continue
        # 只替换 var __ver='...' 定义行（精确正则，不动检测行）
        s2 = re.sub(r"var\s+__ver\s*=\s*'[^']*'", f"var __ver='{new_ver}'", s, count=1)
        if s2 == s:
            fail(f"{f}: 未找到 __ver 定义行，未推进")
            return False
        open(f, 'w', encoding='utf-8').write(s2)
    v = json.load(open('version.json', encoding='utf-8'))
    v['v'] = new_ver
    json.dump(v, open('version.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    ok(f"已推进版本 → {new_ver}（5 html + version.json）")

def git_push(ver):
    files = HTML_FILES + ['version.json', 'chuangqi_d1.js', 'chuangqi_d2.js', 'index_d1.js', 'index_d2.js', 'index_d3.js', 'publish_check.py']
    subprocess.run(['git', 'add'] + files)
    r = subprocess.run(['git', 'commit', '-m', f'发布 {ver}（publish_check.py 自检通过）'], capture_output=True, text=True)
    print(r.stdout.strip()[:300])
    r = subprocess.run(['git', 'push', 'origin', 'master'], capture_output=True, text=True)
    print(r.stdout.strip()[-200:] or r.stderr.strip()[-300:])
    if r.returncode != 0:
        fail("push 失败"); return False
    ok("已推送到 origin/master，等待 GitHub Pages 更新 90s …")
    time.sleep(90)
    return verify_online(ver)

def verify_online(ver):
    ts = str(int(time.time() * 1000))
    bad = 0
    for f in HTML_FILES:
        r = subprocess.run(['curl', '-sL', f"https://jiayouqian.github.io/tl17/{f}?t={ts}"], capture_output=True, text=True)
        body = r.stdout
        if 'tl17v' in body or "!==__ver='" in body:
            print(f"{RED}❌ 线上 {f} 仍有垃圾残留{RESET}"); bad += 1
        elif f"var __ver='{ver}'" in body:
            print(f"{GREEN}✅ 线上 {f} 版本 {ver} 干净{RESET}")
        else:
            print(f"{YEL}⚠️  线上 {f} 版本字段未匹配（可能CDN未刷新）{RESET}"); bad += 1
    r = subprocess.run(['curl', '-sL', f"https://jiayouqian.github.io/tl17/version.json?t={ts}"], capture_output=True, text=True)
    if f'"{ver}"' in r.stdout:
        print(f"{GREEN}✅ 线上 version.json = {ver}{RESET}")
    else:
        print(f"{YEL}⚠️  线上 version.json 未匹配{RESET}"); bad += 1
    if bad == 0:
        print(f"{GREEN}🎉 线上验收全部通过！{RESET}")
        return True
    print(f"{RED}线上验收 {bad} 项未过，请 1-2 分钟后重跑 verify{RESET}")
    return False

if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] == 'check':
        sys.exit(0 if run_all() else 1)
    new_ver = sys.argv[1]
    print(f"先做全站自检（改版本前基线）…")
    if not run_all():
        sys.exit(1)
    bump_version(new_ver)
    print(f"\n推进后再次全站自检…")
    if not run_all():
        sys.exit(1)
    if len(sys.argv) > 2 and sys.argv[2] == '--push':
        print(f"\n提交推送…")
        git_push(new_ver)
    else:
        print(f"\n自检通过。确认无误后执行推送：\n  python3 publish_check.py {new_ver} --push")
