// 亮/暗主题切换；在页面渲染前同步执行，避免闪烁
(function () {
  var root = document.documentElement;

  function apply(value) {
    root.dataset.theme = value;
    try { localStorage.setItem("book-theme", value); } catch (e) {}
  }

  try {
    var saved = localStorage.getItem("book-theme");
    if (saved) root.dataset.theme = saved;
  } catch (e) {}

  // 站点默认主题（hugo.toml 的 BookTheme）由渲染时写入，这里只负责亮/暗切换
  addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var current = root.dataset.theme;
      apply(current === "dark" ? "light" : "dark");
    });
  });
})();
