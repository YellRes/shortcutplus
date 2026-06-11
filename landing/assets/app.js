// Shared by both language pages: hero switcher mock + scroll reveal.
// No i18n here — each page is a separate static document.

// ---- Hero switcher mock: render grouped list + cycling highlight ----
(function () {
  var groups = [
    { proc: "Code.exe", tag: "VS", color: "linear-gradient(135deg,#22d3ee,#3b82f6)", items: ["index.vue — shortcutplus", "windows.ts — alt-tab"] },
    { proc: "Chrome.exe", tag: "Ch", color: "linear-gradient(135deg,#f472b6,#fb923c)", items: ["ShortcutPlus", "MDN — EnumWindows"] },
    { proc: "Terminal.exe", tag: ">_", color: "linear-gradient(135deg,#8b5cf6,#6366f1)", items: ["npm run dev"] }
  ];

  var list = document.getElementById("sw-list");
  var flat = [];
  if (list) {
    groups.forEach(function (g) {
      var label = document.createElement("div");
      label.className = "sw-group-label";
      label.textContent = g.proc;
      list.appendChild(label);
      g.items.forEach(function (title) {
        var el = document.createElement("div");
        el.className = "sw-item";
        el.innerHTML = '<span class="ico" style="background:' + g.color + '">' + g.tag + '</span><span class="ttl">' + title + "</span>";
        list.appendChild(el);
        flat.push({ el: el, title: title, proc: g.proc });
      });
    });

    var idx = 0;
    var procEl = document.getElementById("sw-proc");
    var labelEl = document.getElementById("sw-preview-label");
    function highlight(i) {
      flat.forEach(function (f, k) { f.el.classList.toggle("active", k === i); });
      if (procEl) procEl.textContent = flat[i].proc;
      if (labelEl) labelEl.textContent = flat[i].title;
    }
    highlight(0);

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      setInterval(function () {
        idx = (idx + 1) % flat.length;
        highlight(idx);
      }, 1800);
    }
  }
})();

// ---- Scroll reveal ----
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (e) { e.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(function (e) { io.observe(e); });
})();
