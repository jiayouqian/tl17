
/* ===== 返回列表恢复位置 + 秒更新 + 位置恢复（全系统丝滑） ===== */
(function(){
  window.__cqUndo = [];           // 可逆动作栈：{kind:'cat'} 或 {kind:'sec'}
  var listY = 0;
  /* 进详情前记录列表真实滚动位置（卡片点击瞬间，hash 尚未变化，router 还没滚顶） */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a.row-card');
    if(a){ listY = window.scrollY; }
  }, true);
  /* 返回列表：恢复列表位置（不再被 router 先滚顶污染） */
  window.addEventListener('hashchange', function(){
    if (!/^#\/game\//.test(location.hash)) {
      window.scrollTo(0, listY || 0);
    }
  });
  /* 分类浮层 / 详情分区折叠：popstate 逐层收起（展开时在 3805/3818 处 push 入栈） */
  window.addEventListener('popstate', function(){
    var st = window.__cqUndo;
    if(!st.length) return;
    var act = st.pop();
    if(act.kind==='cat'){
      if(typeof foldOpen!=='undefined' && foldOpen){
        foldOpen=false;
        var cf=document.getElementById('catFold'); if(cf) cf.classList.remove('open');
        var cb=document.getElementById('catFoldBtn'); if(cb) cb.setAttribute('aria-expanded','false');
      }
    } else if(act.kind==='sec'){
      var col=document.querySelectorAll('.sec-coll.open');
      if(col.length) col[col.length-1].classList.remove('open');
    }
  });

  var curVer = (location.search.match(/[?&]ver=([^&]+)/) || [])[1] || '';
  function snapState(){
    return { y: window.scrollY, hash: location.hash||'#/list', cat: (typeof filterCat!=='undefined'?filterCat:'全部') };
  }
  function check(){
    fetch('cq_version.json?_=' + Date.now(), {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.v && d.v !== curVer) {
          try { sessionStorage.setItem('cq_pos', JSON.stringify(snapState())); } catch(e){}
          var q = (location.search ? location.search + '&' : '?') + 'ver=' + d.v;
          location.replace(location.pathname + q);
        }
      }).catch(function(){});
  }
  setInterval(check, 3000);
  setTimeout(check, 1200);
  /* 版本刷新后原位恢复：分类 + 滚动位置 + 详情视图 */
  try {
    var sv = JSON.parse(sessionStorage.getItem('cq_pos') || 'null');
    if (sv) {
      if(typeof filterCat!=='undefined' && sv.cat){ filterCat = sv.cat; }
      window.scrollTo(0, sv.y || 0);
      if(typeof renderList==='function') renderList();
      if(sv.hash && /^#\/game\//.test(sv.hash) && location.hash!==sv.hash){
        location.hash = sv.hash;     // 保留正在看的详情（router 显示详情）
      }
      sessionStorage.removeItem('cq_pos');
    }
  } catch(e){}
})();
