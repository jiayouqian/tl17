
(function(){
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var ctaBar = document.querySelector('.cta-bar');
  /* 只设置--cta-h变量，hero高度由CSS的100dvh自动适配，避免JS与CSS冲突导致手机滑动跳动 */
  function setCtaH() {
    try { document.documentElement.style.setProperty('--cta-h', (ctaBar ? ctaBar.offsetHeight : 66) + 'px'); } catch (e) {}
  }
  setCtaH();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(setCtaH); }
  var c=document.querySelector('.caro');if(!c)return;
  var sl=c.querySelectorAll('.sld'),dt=document.querySelectorAll('.dot'),i=0,t=null;
  var N=sl.length;
  var fc=sl[0].cloneNode(true);fc.classList.remove('on');c.appendChild(fc);
  var TOTAL=N+1;
  function cur(){var w=c.clientWidth||1;return Math.round(c.scrollLeft/w);}
  function syncDots(k){for(var j=0;j<dt.length;j++)dt[j].classList.toggle('on',j===k);}
  function goSlide(n){if(!sl.length)return;i=n%TOTAL;c.scrollLeft=i*c.clientWidth;syncDots(i>=N?0:i);}
  c.addEventListener('scroll',function(){
    var w=c.clientWidth||1;
    var k=cur();
    if(c.scrollLeft>=N*w-2){i=0;syncDots(0);c.scrollLeft=0;return;}
    if(k!==i){i=k;syncDots(k);}
  },{passive:true});
  /* 右滑回环：第一张往右滑跳转到最后一张 */
  var startX=0;
  c.addEventListener('touchstart',function(e){startX=e.touches[0].clientX;},{passive:true});
  c.addEventListener('touchend',function(e){
    var endX=e.changedTouches[0].clientX;
    if(endX-startX>50 && i===0){goSlide(N-1);}
  });
  if(dt.length){dt.forEach(function(d,k){d.addEventListener('click',function(){goSlide(k);});});}
  t=setInterval(function(){goSlide(i+1);},1500);
})();



/* ===== 返回键深联动（折叠+页签统一 undo 栈） + 秒更新 + 位置/折叠态恢复 ===== */
(function(){
  var ds = Array.prototype.slice.call(document.querySelectorAll('details'));
  var curVer = (location.search.match(/[?&]ver=([^&]+)/) || [])[1] || (typeof v !== 'undefined' ? v : '');
  var mlFoldOpen = [];

  /* 占位记录：只维护一条，popstate弹后立即重推，历史栈长度稳定不膨胀 */
  function pushPlaceholder(){
    try { history.pushState({ml:1}, ''); } catch(e){}
  }
  if (!history.state || history.state.ml !== 0) {
    try { history.replaceState({ml:0}, ''); } catch(e){}
  }
  pushPlaceholder();

  /* details事件委托：1个监听器代替73个，自动支持动态新增的details */
  document.addEventListener('toggle', function(e){
    var d = e.target;
    if (d.tagName !== 'DETAILS') return;
    if (d.open) {
      if (mlFoldOpen.indexOf(d) < 0) mlFoldOpen.push(d);
    } else {
      var i = mlFoldOpen.indexOf(d); if (i >= 0) mlFoldOpen.splice(i, 1);
    }
  }, true);

  /* popstate：收折叠(逐层)→回页签(JS栈)→退出；处理后重推占位保持栈稳定 */
  window.addEventListener('popstate', function(e){
    if (e.state && e.state.fk) return;
    while (mlFoldOpen.length) {
      var last = mlFoldOpen[mlFoldOpen.length - 1];
      if (last && last.open) {
        last.removeAttribute('open'); mlFoldOpen.pop();
        pushPlaceholder();
        return;
      }
      mlFoldOpen.pop();
    }
    var pages = window.__mlPages || [];
    if (pages.length) {
      var prev = pages.pop();
      showMlPage(prev);
      pushPlaceholder();
      return;
    }
    /* 无折叠、无上级页签：不重占位，交给浏览器原生后退 */
  });

  /* 状态快照：滚动 + 页签 + 展开的折叠 + hash */
  function snapState(){
    var openIds = [];
    ds.forEach(function(d,i){ if(d.open) openIds.push(i); });
    return { y: window.scrollY, page: curMlPage(), open: openIds, hash: location.hash, pages: window.__mlPages || [] };
  }
  function restoreState(sv){
    if(!sv) return;
    ds.forEach(function(d){ d.removeAttribute('open'); });
    mlFoldOpen = [];
    (sv.open||[]).forEach(function(i){ if(ds[i]) { ds[i].open = true; mlFoldOpen.push(ds[i]); } });
    var pg = sv.page && document.getElementById(sv.page) ? sv.page : 'home';
    showMlPage(pg);
    window.scrollTo(0, sv.y || 0);
    window.__mlPages = sv.pages || [];
  }

  /* 秒更新：URL ver 比较法 */
  function check(){
    fetch('version.json?_=' + Date.now(), {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.v && d.v !== curVer) {
          try { sessionStorage.setItem('ml_pos', JSON.stringify(snapState())); } catch(e){}
          location.replace(location.pathname + '?ver=' + d.v);
        }
      }).catch(function(){});
  }
  setInterval(check, 300000);
  setTimeout(check, 60000);

  /* 版本刷新后原位恢复（只执行一次） */
  var restored = false;
  function doRestore(){
    if (restored) return;
    restored = true;
    try {
      var sv = JSON.parse(sessionStorage.getItem('ml_pos') || 'null');
      if (sv) { restoreState(sv); sessionStorage.removeItem('ml_pos'); }
    } catch(e){}
  }
  window.addEventListener('load', doRestore);
})();

/* 内联事件属性委托（严格 CSP 下 inline handler 会被拦截） */
document.addEventListener('click', function (e) {
  var t = e.target;
  if (!t || !t.closest) return;
  var el;
  if ((el = t.closest('[data-share]'))) {
    e.preventDefault();
    if (typeof sharePage === 'function') sharePage();
    return;
  }
  if ((el = t.closest('[data-go]'))) {
    e.preventDefault();
    if (typeof go === 'function') go(el.getAttribute('data-go'));
    var sec = el.getAttribute('data-section');
    if (sec) setTimeout(function () { if (typeof showSection === 'function') showSection(sec); }, 300);
    return;
  }
  if ((el = t.closest('[data-tab]'))) {
    e.preventDefault();
    var v = el.getAttribute('data-tab').split(':');
    var grp = v[0], key = v[1];
    if (grp === 'dazao') switchDazaoTab(key);
    else if (grp === 'menpai') switchMenpaiTab(key);
    else if (grp === 'huanhua') switchHuanhuaTab(key);
    return;
  }
  if ((el = t.closest('[data-copy]'))) {
    e.preventDefault();
    copyText(el.getAttribute('data-copy'), el);
  }
});
