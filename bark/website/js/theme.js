(function () {
  const KEY = "sheetline_theme";

  function getPreferred() {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
    return "light";
  }

  function apply(theme) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem(KEY, next);

    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      const isDark = next === "dark";
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
      if (!btn.hasAttribute("data-icon-toggle")) {
        btn.textContent = isDark ? "Light mode" : "Dark mode";
      }
    });
  }

  apply(getPreferred());

  window.SheetlineTheme = {
    get() {
      return document.documentElement.getAttribute("data-theme") || "light";
    },
    set: apply,
    toggle() {
      apply(this.get() === "dark" ? "light" : "dark");
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    apply(window.SheetlineTheme.get());
  });

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-theme-toggle]");
    if (!btn) return;
    event.preventDefault();
    window.SheetlineTheme.toggle();
  });
})();
