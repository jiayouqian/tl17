/* ===== 全局悬浮客服（唯一组件，全站页面统一引用） ===== */
(function () {
  if (window.__fkInjected) { return; }
  window.__fkInjected = true;
  var css = [
    '.fk{position:fixed;right:14px;bottom:calc(48px + env(safe-area-inset-bottom,0px));z-index:9999;font-family:system-ui,sans-serif}',
    '.fk-btn{width:56px;height:56px;border-radius:50%;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;box-shadow:none;border:2px solid rgba(196,168,118,.8);user-select:none;touch-action:none;-webkit-touch-callout:none;transition:opacity .25s}',
    '.fk-btn:hover{opacity:.75}',
    '.fk-btn svg{width:24px;height:24px;fill:#c4a876;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}',
    '.fk-btn span{font-size:11px;font-weight:600;color:#b8a88a;letter-spacing:1px;text-shadow:0 1px 2px rgba(0,0,0,.5)}',
    '.fk-panel{display:none;position:absolute;right:0;bottom:70px;width:232px;background:#1e160d;border:1px solid rgba(232,182,76,.45);border-radius:14px;padding:14px;box-shadow:0 10px 32px rgba(0,0,0,.6)}',
    '.fk-panel.open{display:block}',
    '.fk-panel h4{margin:0 0 10px;color:#e8b64c;font-size:14px;font-weight:700;text-align:left}',
    '.fk-item{display:flex;align-items:center;justify-content:space-between;gap:6px;background:rgba(232,182,76,.08);border:1px solid rgba(232,182,76,.2);border-radius:10px;padding:9px 10px;margin-bottom:8px}',
    '.fk-item .lb{font-size:12px;color:#d8c8a8;white-space:nowrap}',
    '.fk-item .vl{font-size:13px;color:#f5d489;font-weight:600;white-space:nowrap}',
    '.fk-cp{font-size:11px;color:#1a120b;background:#e8b64c;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:600}',
    '.fk-x{position:absolute;top:6px;right:9px;color:#a08040;font-size:15px;cursor:pointer;background:none;border:none;line-height:1}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  var w = document.createElement('div');
  w.className = 'fk';
  w.id = 'fkWidget';
  w.innerHTML =
    '<div class="fk-btn" onclick="fkToggle(event)">' +
    '<svg viewBox="0 0 24 24"><path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/></svg>' +
    '<span>客服</span></div>' +
    '<div class="fk-panel" id="fkPanel">' +
    '<button class="fk-x" onclick="fkClose()" aria-label="关闭">×</button>' +
    '<h4>联系客服 · 进群领福利</h4>' +
    '<div class="fk-item"><span class="lb">玩家QQ群</span><span class="vl">680598747</span><button class="fk-cp" onclick="fkCopy(\'680598747\')">复制</button></div>' +
    '<div class="fk-item"><span class="lb">代理QQ</span><span class="vl">354261705</span><button class="fk-cp" onclick="fkCopy(\'354261705\')">复制</button></div>' +
    '<div class="fk-item"><span class="lb">微信</span><span class="vl">qun680598747</span><button class="fk-cp" onclick="fkCopy(\'qun680598747\')">复制</button></div>' +
    '</div>';
  document.body.appendChild(w);

  var __fkPushed = false;
  function fkSetOpen(p, open){
    if(!p) return;
    var was = p.classList.contains('open');
    p.classList.toggle('open', open);
    if(open && !was){
      if(!__fkPushed){ __fkPushed = true; try{ history.pushState({fk:1},''); }catch(e){} }
    } else if(!open && was){
      if(__fkPushed){ __fkPushed = false; try{ history.back(); }catch(e){} }
    }
  }
  window.fkToggle = function (e) {
    if (e && e.stopPropagation) { e.stopPropagation(); }
    var p = document.getElementById('fkPanel');
    if (p) { fkSetOpen(p, !p.classList.contains('open')); }
  };
  window.fkClose = function () {
    fkSetOpen(document.getElementById('fkPanel'), false);
  };
  /* 手机返回键：收起客服面板（浏览器已后退一格，这里只负责关面板） */
  window.addEventListener('popstate', function(){
    var p = document.getElementById('fkPanel');
    if (p && p.classList.contains('open')) { p.classList.remove('open'); }
    __fkPushed = false;
  });
  window.fkCopy = function (v) {
    var ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(v);
        ok = true;
      }
    } catch (e) {}
    if (!ok) {
      var t = document.createElement('textarea');
      t.value = v;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t);
    }
    
  };
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#fkWidget')) {
      fkSetOpen(document.getElementById('fkPanel'), false);
    }
  });

  /* ===== 可拖动悬浮（手指/鼠标拖动按钮，面板随动；位移超过阈值视为拖动，不触发点击） ===== */
  (function () {
    var btn = w.querySelector('.fk-btn');
    var drag = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = false, suppress = false;
    if (!btn) { return; }
    btn.addEventListener('pointerdown', function (e) {
      drag = true; moved = false; suppress = false;
      var r = w.getBoundingClientRect();
      ox = r.left; oy = r.top;
      sx = e.clientX; sy = e.clientY;
      e.preventDefault();
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) { return; }
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) { moved = true; }
      if (moved) {
        var nx = Math.min(Math.max(ox + dx, 0), window.innerWidth - 56);
        var ny = Math.min(Math.max(oy + dy, 0), window.innerHeight - 56);
        w.style.left = nx + 'px';
        w.style.top = ny + 'px';
        w.style.right = 'auto';
        w.style.bottom = 'auto';
      }
    });
    window.addEventListener('pointerup', function () {
      if (!drag) { return; }
      drag = false;
      if (moved) { suppress = true; moved = false; setTimeout(function () { suppress = false; }, 120); }
    });
    btn.addEventListener('click', function (e) {
      if (suppress) { e.stopPropagation(); e.preventDefault(); suppress = false; }
    }, true);
  })();
})();
