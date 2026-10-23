
var v='v20261023220000';
(function(){
  var m=location.search.match(/ver=([^&]+)/);
  if(m && m[1]!==v){
    location.replace('?ver='+v);
    return;
  }
  try{
    var b64=B64A+B64B+B64C;
    var raw=atob(b64);
    var arr=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);
    var html=pako.inflate(arr,{to:'string'});
    /* document.open() 会清空壳层 <head>，CSP 必须随解码内容一起写回，否则运行时完全失效 */
    var csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://tlbb.hfynxx.top; frame-ancestors 'none'; form-action 'self'; base-uri 'self';";
    html=html.replace(/<head([^>]*)>/i,'<head$1><meta http-equiv="Content-Security-Policy" content="'+csp+'"><meta name="referrer" content="strict-origin-when-cross-origin">');
    document.open();document.write(html);document.close();
    setTimeout(function(){var l=document.getElementById('loader');if(l)l.remove();},0);
    if(location.search.indexOf('ver=')<0){
      history.replaceState(null,'','?ver='+v);
    }
  }catch(e){
    document.body.innerHTML='<div style="padding:40px;text-align:center;color:#c9a84c;">加载失败，请刷新重试</div>';
  }
})();
