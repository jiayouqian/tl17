
  function showSection(section){
    var titles = {welfare:'福利礼包码', strategy:'游戏攻略', recharge:'充值套餐'};
    document.getElementById('section-title').innerText = titles[section] || '游戏攻略';
    var ds = document.querySelectorAll('#manual details[data-section]');
    for(var i=0;i<ds.length;i++){
      if(ds[i].getAttribute('data-section')===section){
        ds[i].style.display='block';
        ds[i].open = false;
      }else{
        ds[i].style.display='none';
        ds[i].open = false;
      }
    }
    var subDs = document.querySelectorAll('#manual .sub-details');
    for(var j=0;j<subDs.length;j++){ subDs[j].open = false; }
    var first = document.querySelector('#manual details[data-section="'+section+'"]');
    if(first){ first.open=false; }
    setTimeout(function(){
      var ds2 = document.querySelectorAll('#manual details[data-section="'+section+'"]');
      for(var i=0;i<ds2.length;i++){ ds2[i].open=false; }
      var subDs2 = document.querySelectorAll('#manual .sub-details');
      for(var k=0;k<subDs2.length;k++){ subDs2[k].open=false; }
    }, 100);
    window.scrollTo(0,0);
  }

  /* 通用Tab切换：统一处理幻化/打造/门派三类标签，消除重复代码 */
  function switchTab(prefix, tab, activeIndex){
    var contents = document.querySelectorAll('.'+prefix+'-content');
    for(var i=0;i<contents.length;i++){ contents[i].style.display='none'; }
    var target = document.getElementById(prefix+'-'+tab);
    if(target) target.style.display='block';
    var tabs = document.querySelectorAll('.'+prefix+'-tab');
    for(var i=0;i<tabs.length;i++){
      tabs[i].style.border='1px solid rgba(255,255,255,.15)';
      tabs[i].style.background='rgba(255,255,255,.03)';
      tabs[i].style.color='#aaa';
      tabs[i].style.boxShadow='none';
      var spans = tabs[i].querySelectorAll('span');
      for(var j=0;j<spans.length;j++){ spans[j].style.color='#888'; }
    }
    if(activeIndex >= 0 && tabs[activeIndex]){
      tabs[activeIndex].style.border='1px solid rgba(212,184,122,.4)';
      tabs[activeIndex].style.background='linear-gradient(180deg,rgba(212,184,122,.15),rgba(212,184,122,.05))';
      tabs[activeIndex].style.color='#d4b87a';
      var activeSpans = tabs[activeIndex].querySelectorAll('span');
      for(var k=0;k<activeSpans.length;k++){ activeSpans[k].style.color='#e8d5a8'; }
    }
  }
  function switchHuanhuaTab(tab){ switchTab('huanhua', tab, {pifeng:0, shenqi:1, wuhun:2}[tab]); }
  function switchDazaoTab(tab){ switchTab('dazao', tab, {core:0, pet:1, equip:2, advanced:3}[tab]); }
  function switchMenpaiTab(tab){ switchTab('menpai', tab, {ranged:0, melee:1, balanced:2}[tab]); }
  