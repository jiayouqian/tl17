/* 畅玩版页面主逻辑：分页/返回栈、复制、手册长图预览、折叠、Hero 轮播、版本秒更新
   事件绑定全部走 addEventListener / 事件委托，页面内不再有内联事件属性（配合 CSP 无 unsafe-inline） */
(function () {
var __ver = 'v20261004113946';
function showPage(name, preserveScroll) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  var el = document.getElementById('page-' + name);
  if (el) el.classList.add('active');
  if (!preserveScroll) window.scrollTo(0, 0);
}
var __cwInit = true;   // 初始化阶段（IIFE switchPage('old')）不触发后退
var __cwPages = [];    // JS 页面层级栈：返回键逐级回退的唯一依据（历史栈只放占位记录）
function switchPage(name) {
  if (name === 'old') {
    if (__cwInit) {
      /* 初始化：盖章栈顶为占位记录 + 压一条占位，保证系统返回键始终有记录可弹 */
      try { history.replaceState({ cw: 1 }, ''); } catch (e) {}
      try { history.pushState({ cw: 1 }, ''); } catch (e) {}
      __cwPages = [];
      showPage('old');
    } else {
      /* 用户点页面内"返回首页"：直接切页并清空层级栈（明确意图，不走返回链、不吞栈） */
      __cwPages = [];
      (window.__cwOpenFolds = window.__cwOpenFolds || []).length = 0;
      showPage('old');
    }
    return;
  }
  __cwInit = false;
  __cwPages.push(curPageName());  /* 压入【来源页】（返回键切回的对象），非当前进入页 */
  showPage(name);
}
function curPageName() {
  var cur = document.querySelector('.page.active');
  return cur ? cur.id.replace('page-', '') : 'old';
}
/* 全站折叠返回栈：大区 + 二级折叠统一逐层返回（只收集当前可见页，避免跨页错收空按） */
function collectOpenFolds() {
  var list = [];
  var activePage = document.querySelector('.page.active');
  var scope = activePage || document;
  /* 只收集【用户交互展开】的折叠（__cwOpenFolds 栈），且必须在当前可见页内；
     默认展开的折叠（如充值推荐表）不入栈、不参与返回键，避免误收/空按/跨页错收 */
  var st = window.__cwOpenFolds || [];
  st.forEach(function (h) {
    if (!document.body.contains(h)) return;
    if (!scope.contains(h)) return;
    var open = h.classList.contains('sec-head') ? !h.classList.contains('folded') : h.classList.contains('open');
    if (open) list.push(h);
  });
  return list;
}
window.addEventListener('popstate', function (e) {
  if (e.state && e.state.fk) return;  /* 客服面板压的返回栈：只关面板(kefu.js 处理)，不动折叠/页面，防一次返回退两层 */
  /* 手册长图全屏预览：返回键先关预览，重占位不消费历史，防一次返回退两层 */
  var lbEl = document.getElementById('imgLightbox');
  if (lbEl && lbEl.style.display !== 'none') {
    lbClose();
    try { history.pushState({ cw: 1 }, ''); } catch (e2) {}
    return;
  }
  /* 优先：手机返回键逐层收起展开的折叠（大区/二级标题） */
  var openFolds = collectOpenFolds();
  if (openFolds.length) {
    var el = openFolds[openFolds.length - 1];
    /* 同步从展开栈移除，保持数组与真实展开一致 */
    var st = window.__cwOpenFolds || [];
    var si = st.indexOf(el); if (si >= 0) st.splice(si, 1);
    if (el.classList.contains('guide-sec')) {
      el.classList.add('folded');
      var b = document.getElementById(el.getAttribute('data-sec'));
      if (b) b.style.display = 'none';
      var m = el.querySelector('.more');
      if (m && m.dataset.t) m.textContent = '点击展开';
    } else {
      el.classList.remove('open');
      var body = el.nextElementSibling;
      if (body) body.classList.remove('open');
    }
    /* 重新占位：折叠层级不消费真实历史，下一次返回仍有记录可弹 */
    try { history.pushState({ cw: 1 }, ''); } catch (e) {}
    return;
  }
  var p = e.state && e.state.p;
  var curName = curPageName();
  if (__cwPages.length) {
    /* 切回上一页：JS 栈弹出，保留滚动位置，不跳顶 */
    var prev = __cwPages.pop();
    showPage(prev, true);
    /* 重新占位：下一次返回仍有记录可弹，UI 层级不消费真实历史 */
    try { history.pushState({ cw: 1 }, ''); } catch (e) {}
    return;
  }
  /* 无折叠、无上级页：不重占位，交给浏览器原生后退（退出文档/回上一站） */
  else if (curName !== 'old' && p === undefined) { showPage('old'); }
});
(function () { switchPage('old'); })();

/* 复制 */
function copyText(txt, btn) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(function () { flash(btn); }).catch(function () { legacyCopy(txt, btn); });
  } else { legacyCopy(txt, btn); }
}
function legacyCopy(txt, btn) {
  var ta = document.createElement('textarea');
  ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); flash(btn); } catch (e) {}
  document.body.removeChild(ta);
}
function flash(btn) {
  var old = btn.textContent; btn.textContent = '已复制';
  setTimeout(function () { btn.textContent = old; }, 1400);
}
/* 手册长图全屏预览（lightbox） */
function lbOpen(src) {
  var b = document.getElementById('imgLightbox'), i = document.getElementById('lbImg');
  if (!b || !i) return;
  i.src = src; b.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  try { history.pushState({ cw: 1 }, ''); } catch (e) {}  /* 占位：手机返回键先关预览，不进页面栈 */
}
function lbClose() {
  var b = document.getElementById('imgLightbox');
  if (!b) return;
  b.style.display = 'none';
  document.body.style.overflow = '';
}
function copyInvite(card) {
  var code = card.querySelector('.pass-code b');
  copyText(code ? code.textContent : 'PPAP', card.querySelector('.invite-hint'));
}

/* 内联事件属性的委托替代：data-nav 切页 / data-copy 复制 / data-lb 看长图 / data-lb-close 关预览 */
document.addEventListener('click', function (e) {
  var nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault();
    switchPage(nav.getAttribute('data-nav'));
    return;
  }
  var cp = e.target.closest('[data-copy]');
  if (cp) {
    e.preventDefault();
    copyText(cp.getAttribute('data-copy'), cp);
    return;
  }
  var lbc = e.target.closest('[data-lb-close]');
  if (lbc) { lbClose(); return; }
  var lbImg = e.target.closest('img[data-lb]');
  if (lbImg) { lbOpen(lbImg.src); return; }
  if (e.target.id === 'imgLightbox') { lbClose(); }
});

/* 折叠展开 */
document.addEventListener('DOMContentLoaded', function () {
  var heads = document.querySelectorAll('.fold-head, .pitem-head');
  heads.forEach(function (h) {
    h.addEventListener('click', function () {
      var body = h.nextElementSibling;
      var wasOpen = h.classList.contains('open');
      h.classList.toggle('open');
      if (body) body.classList.toggle('open');
      if (!wasOpen) {
        /* 折叠不入历史栈：返回键按 __cwOpenFolds 逐层收起，杜绝幽灵记录错位 */
        (window.__cwOpenFolds = window.__cwOpenFolds || []).push(h);
      } else {
        var st = window.__cwOpenFolds || [];
        var i = st.indexOf(h); if (i >= 0) st.splice(i, 1);
      }
    });
  });
  /* 攻略顶部 Tab 导航 */
  var tabs = document.querySelectorAll('#guide-tabs .guide-tab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var id = t.getAttribute('data-id');
      var el = document.getElementById(id);
      var head = document.querySelector('.sec-head[data-sec="' + id + '"]');
      if (el) {
        if (head && head.classList.contains('folded')) {
          head.classList.remove('folded');
          el.style.display = '';
        }
        setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 90);
      }
      tabs.forEach(function (x) { x.classList.remove('on'); });
      t.classList.add('on');
    });
  });
  /* 攻略大区折叠（sec-head 点击，联动手机返回键） */
  var secHeads = document.querySelectorAll('.sec-head.foldable');
  secHeads.forEach(function (h) {
    var more = h.querySelector('.more');
    if (more && !more.dataset.t) more.dataset.t = more.textContent;
    if (h.classList.contains('folded') && more) more.textContent = '点击展开';
    h.addEventListener('click', function () {
      var body = document.getElementById(h.getAttribute('data-sec'));
      if (!body) return;
      var folded = h.classList.toggle('folded');
      body.style.display = folded ? 'none' : '';
      if (more) more.textContent = folded ? '点击展开' : more.dataset.t;
      if (!folded) {
        /* 折叠不入历史栈：返回键按 __cwOpenFolds 逐层收起，杜绝幽灵记录错位 */
        (window.__cwOpenFolds = window.__cwOpenFolds || []).push(h);
      } else {
        var st = window.__cwOpenFolds || [];
        var i = st.indexOf(h); if (i >= 0) st.splice(i, 1);
      }
    });
  });
  /* 17 门派 chips 索引：直达 + 自动展开 */
  var chips = document.querySelectorAll('#menpai-chips .chip');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var el = document.getElementById(c.getAttribute('data-id'));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var head = el.querySelector('.pitem-head');
        if (head && !head.classList.contains('open')) head.click();
      }
    });
  });
});

/* ===== Hero 轮播 ===== */
(function () {
  var hero = document.getElementById('hero-old');
  if (!hero) return;
  /* 只设置--cta-h变量供CSS使用，hero高度由CSS的100dvh自动处理，避免JS重复设置导致跳动 */
  var ctaBar = document.querySelector('.cta-bar');
  try { document.documentElement.style.setProperty('--cta-h', (ctaBar ? ctaBar.offsetHeight : 66) + 'px'); } catch (e) {}
  var scroller = hero.querySelector('.hero-slides');
  var slides = scroller.querySelectorAll('.hero-slide');
  var dots = hero.querySelectorAll('.hero-dots .hd');
  var N = slides.length;
  var fc = slides[0].cloneNode(true);
  fc.classList.remove('on');
  scroller.appendChild(fc);
  var TOTAL = N + 1;
  var idx = 0, timer = null, idleTimer = null, interacting = false;
  function cur() { var w = scroller.clientWidth || 1; return Math.round(scroller.scrollLeft / w); }
  function syncDots(k) { for (var j = 0; j < dots.length; j++) dots[j].classList.toggle('on', j === k); }
  function startAuto() { stopAuto(); timer = setInterval(function () { go(idx + 1); }, 2000); }
  function stopAuto() { clearInterval(timer); timer = null; }
  function go(n) {
    idx = n % TOTAL;
    stopAuto();
    scroller.scrollLeft = idx * scroller.clientWidth;  /* 瞬移切页：避免 smooth 与 scroll-snap 拉扯，自动轮播不抖 */
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startAuto, 1200);  /* 动画间隙拉长：切完再自动，不抢手滑 */
  }
  dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
  scroller.addEventListener('pointerdown', function () { interacting = true; stopAuto(); clearTimeout(idleTimer); }, { passive: true });
  scroller.addEventListener('pointerup', function () { interacting = false; clearTimeout(idleTimer); idleTimer = setTimeout(startAuto, 1400); });
  scroller.addEventListener('pointercancel', function () { interacting = false; clearTimeout(idleTimer); idleTimer = setTimeout(startAuto, 1400); });
  scroller.addEventListener('wheel', function () { stopAuto(); clearTimeout(idleTimer); idleTimer = setTimeout(startAuto, 1400); }, { passive: true });
  scroller.addEventListener('scroll', function () {
    var w = scroller.clientWidth || 1;
    var i = cur();
    if (scroller.scrollLeft >= N * w - 2) {
      /* 到达克隆首图：无声跳回真实第一张，实现无缝循环 */
      idx = 0; syncDots(0);
      scroller.scrollLeft = 0;
      return;
    }
    if (i !== idx) { idx = i; syncDots(i); }
    if (!interacting) { clearTimeout(idleTimer); idleTimer = setTimeout(startAuto, 1400); }
  }, { passive: true });
  startAuto();
})();

/* ===== 秒更新 ===== */
function cwFoldList(pageEl){
  return pageEl ? pageEl.querySelectorAll('.fold-head,.pitem-head,.sec-head.foldable') : [];
}
function cwFoldIsOpen(f){
  if (f.classList.contains('sec-head')) return !f.classList.contains('folded');
  return f.classList.contains('open');
}
(function () {
  var v = __ver;
  function check() {
    fetch('version.json?_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.v) return;
        var inUrl = (location.search.match(/[?&]ver=([^&]+)/) || [])[1];
        /* 版本不一致且链接还没带该版本才跳：URL 已带同版本不再跳，杜绝发版忘改 __ver 时死循环 reload */
        if (d.v !== v && d.v !== inUrl) {
          /* 保存滚动位置 + 所在菜单 + 当前页展开的折叠索引，刷新后原位恢复 */
          try {
            var act = document.querySelector('.page.active');
            var folds = cwFoldList(act);
            var openIdx = [];
            folds.forEach(function (f, i) { if (cwFoldIsOpen(f)) openIdx.push(i); });
            sessionStorage.setItem('cw_pos', JSON.stringify({ y: window.scrollY, p: curPageName(), v: d.v, openIdx: openIdx, pages: window.__cwPages || [] }));
          } catch (e) {}
          var q = (location.search ? location.search + '&' : '?') + 'ver=' + d.v;
          location.replace(location.pathname + q);
        }
      })
      .catch(function () {});
  }
  setInterval(check, 60000);  /* 3s→60s：弱网不再高频请求 */
})();
/* 版本刷新后原位恢复：菜单 + 折叠展开态 + 滚动位置（深绑定返回体验） */
(function () {
  try {
    var saved = JSON.parse(sessionStorage.getItem('cw_pos') || 'null');
    if (saved && saved.v === __ver) {
      var p = saved.p;
      var el = document.getElementById('page-' + p);
      if (el) {
        document.querySelectorAll('.page').forEach(function (x) { x.classList.remove('active'); });
        el.classList.add('active');
        /* 重开刷新前展开的折叠（同时重建返回栈，返回键才能逐层收起） */
        var folds = cwFoldList(el);
        (saved.openIdx || []).forEach(function (i) {
          var f = folds[i]; if (!f) return;
          (window.__cwOpenFolds = window.__cwOpenFolds || []).push(f);
          if (f.classList.contains('sec-head')) {
            f.classList.remove('folded');
            var b = document.getElementById(f.getAttribute('data-sec')); if (b) b.style.display = '';
          } else {
            f.classList.add('open');
            var body = f.nextElementSibling; if (body) body.classList.add('open');
          }
        });
      }
      window.scrollTo(0, saved.y || 0);
      /* 重建页面层级栈（占位记录模式），返回键继续逐级可用 */
      window.__cwPages = saved.pages || [];
      try { history.replaceState({ cw: 1 }, ''); } catch (e) {}
      try { history.pushState({ cw: 1 }, ''); } catch (e) {}
      sessionStorage.removeItem('cw_pos');
    }
  } catch (e) {}
})();
})();
