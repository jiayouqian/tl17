/* 反点击劫持：被第三方页面用 iframe 嵌入时，立即隐藏自身并尝试跳出顶层窗口 */
if (window.top !== window.self) {
  document.documentElement.style.display = 'none';
  try { window.top.location.href = window.self.location.href; } catch (e) {}
}
