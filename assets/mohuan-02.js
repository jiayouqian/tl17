
function curMlPage(){ var on=document.querySelector('.page.on'); return on?on.id:'home'; }
function showMlPage(n){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById(n).classList.add('on');
  window.scrollTo(0,0);
}
/* 页签切换入栈，手机返回键逐级退回上一个页签（不直接退出文档） */
function go(n){
  var cur = curMlPage();
  if(n===cur || !document.getElementById(n)) return;
  showMlPage(n);
  /* 页签层级入 JS 栈（不 pushState，历史栈只放占位记录） */
  (window.__mlPages = window.__mlPages || []).push(cur);
}
function scrollToSec(i,e){
  e.preventDefault();
  var secs=document.querySelectorAll('#manual>details');
  if(secs[i]){secs[i].scrollIntoView({behavior:'smooth',block:'start'});secs[i].open=true;}
}
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
function sharePage(){
  if(navigator.share){
    navigator.share({title:'魔幻天龙正版0.01折',text:'上线领全套毕业福利，0氪也能玩！代理码MZSP',url:location.href}).then(function(){},function(){
      copyLink();
    });
  }else{
    copyLink();
  }
}
function copyLink(){
  var t=location.href;
  if(navigator.clipboard){navigator.clipboard.writeText(t);}
  else{
    var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity=0;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
  }
  showToast('链接已复制，去微信或QQ粘贴给好友');
}
function showToast(msg){
  var d=document.createElement('div');d.textContent=msg;
  d.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.85);color:#fff;padding:14px 24px;border-radius:10px;font-size:14px;z-index:9999;pointer-events:none;text-align:center;';
  document.body.appendChild(d);setTimeout(function(){d.remove()},2000);
}
