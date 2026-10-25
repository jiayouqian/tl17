
(function(){
  // 每次打开强制回源加载最新数据（cache:'no-store' 绕过浏览器缓存，时间戳参数绕过 CDN 缓存）→ 秒更新
  function fetchText(u){ return fetch(u, {cache:'no-store'}).then(function(r){ return r.text(); }); }
  function extractVar(txt, name){
    var m = txt.match(new RegExp('var\\s+' + name + '\\s*=\\s*"([^"]+)"'));
    if(!m){ throw new Error('数据段缺失: '+name); }
    return m[1];
  }
  function fail(e){
    document.getElementById('ld').textContent = '加载失败，请刷新重试';
    console.error(e);
  }
  var ts = Date.now();
  Promise.all([
    fetchText('chuangqi_d1.js?ts='+ts),
    fetchText('chuangqi_d2.js?ts='+ts)
  ]).then(function(rs){
    var B64 = extractVar(rs[0], 'B64A') + extractVar(rs[1], 'B64B');
    var bin = atob(B64);
    var u8 = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++){ u8[i]=bin.charCodeAt(i); }
    var ds = new DecompressionStream('gzip');
    var stream = new Blob([u8]).stream().pipeThrough(ds);
    return new Response(stream).text();
  }).then(function(txt){
    /* document.open() 会清空壳层 <head>，CSP 必须随解码内容一起写回，否则运行时完全失效 */
    var csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://yqcdn.fuhua95.com https://oss.cyjxcfkjgame.com https://cyjxcfkjgame2.oss-cn-hangzhou.aliyuncs.com https://file.648wl.com https://dysdk.72yx.com https://media.doubao.com; connect-src 'self' https://tlbb.hfynxx.top; frame-ancestors 'none'; form-action 'self'; base-uri 'self';";
    txt=txt.replace(/<head([^>]*)>/i,'<head$1><meta http-equiv="Content-Security-Policy" content="'+csp+'"><meta name="referrer" content="strict-origin-when-cross-origin">');
    document.open();
    document.write(txt);
    document.close();
  }).catch(fail);
})();


(function(){
  /* 首载盖章：把当前版本写入 URL ?ver= 一次（replace，不入栈）。
     真实页据此得到 curVer，首访不触发自刷白屏；后续秒更新一律由真实页 URL ver 比较法负责，
     壳层不再做轮询，避免与真实页双重检测、也避免发版忘改 __ver 时每 3 秒死循环 reload。 */
  var __ver='v20261025180000';
  if(!location.search.match(/[?&]ver=/)){
    /* 保留 location.hash：#/game/xxx 深链直达详情页，否则 replaceState 会丢 hash */
    try{ history.replaceState(null,'', location.pathname + '?ver=' + __ver + location.hash); }catch(e){}
  }
})();
