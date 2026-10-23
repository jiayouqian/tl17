/* 首次访问把 version.json 的版本号写进 URL（replace，不入历史栈），供页面自身做版本比较 */
(function () {
  if (!location.search.match(/rv=([^&]+)/)) {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.v) { try { history.replaceState(null, '', '?rv=' + d.v); } catch (e) {} }
      })
      .catch(function () {});
  }
})();
