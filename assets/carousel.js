/* 门户轮播：按需加载（只请求当前帧与下一帧）+ 指示点 + 点击进入 + 可选触摸滑动
   非首帧图片在 HTML 中以 data-src 声明，由本脚本在需要时赋给 src，首屏不再拉全部轮播图 */
(function () {
  function initCarousel(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('.dot'));
    if (!slides.length) return;
    var i = 0, timer = null;

    function ensure(k) {
      var s = slides[((k % slides.length) + slides.length) % slides.length];
      if (!s) return;
      var ims = s.querySelectorAll('img[data-src]');
      for (var n = 0; n < ims.length; n++) {
        ims[n].src = ims[n].getAttribute('data-src');
        ims[n].removeAttribute('data-src');
      }
    }

    function go(n) {
      slides[i].classList.remove('on');
      if (dots[i]) dots[i].classList.remove('on');
      i = (n + slides.length) % slides.length;
      ensure(i);          /* 当前帧 */
      ensure(i + 1);      /* 下一帧：提前 2 秒预取，切换时不空白 */
      slides[i].classList.add('on');
      if (dots[i]) dots[i].classList.add('on');
    }
    function next() { go(i + 1); }
    function start() { clearInterval(timer); timer = setInterval(next, 2000); }

    ensure(i);
    ensure(i + 1);

    /* 等全部轮播图就绪后再开始自动切换，避免切换瞬间出现黑屏空帧 */
    var imgs = Array.prototype.slice.call(root.querySelectorAll('.slide img'));
    var pending = imgs.length, started = false;
    function boot() {
      if (started) return;
      started = true;
      start();
    }
    function one() { if (--pending <= 0) boot(); }
    imgs.forEach(function (im) {
      if (im.complete && im.naturalWidth) { one(); return; }
      im.addEventListener('load', one);
      im.addEventListener('error', one);
    });
    setTimeout(boot, 2500);

    dots.forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        go(parseInt(this.dataset.i, 10)); start();
      });
    });
    root.addEventListener('click', function (e) {
      if (e.target.closest('.dot')) return;
      if (justMoved) { justMoved = false; return; }
      window.location.href = root.dataset.href;
    });

    /* 触摸左右滑动切换（仅在声明 data-swipe 的轮播启用） */
    if (root.hasAttribute('data-swipe')) {
      var touchStartX = 0, touchStartY = 0, touchMoved = false, justMoved = false;
      root.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false; justMoved = false;
      }, { passive: true });
      root.addEventListener('touchmove', function (e) {
        var dx = e.touches[0].clientX - touchStartX;
        var dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) touchMoved = true;
      }, { passive: true });
      root.addEventListener('touchend', function (e) {
        if (!touchMoved) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) {
          justMoved = true;
          if (dx < 0) { go(i + 1); } else { go(i - 1); }
          start();
          setTimeout(function () { justMoved = false; }, 300);
        }
      }, { passive: true });
    }

    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', start);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.carousel'), initCarousel);
})();
