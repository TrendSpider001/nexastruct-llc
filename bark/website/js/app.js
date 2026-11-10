(function () {
  async function start() {
    if (window.SheetlineUsers && window.SheetlineUsers.ready) {
      try {
        await window.SheetlineUsers.ready();
      } catch (_) {
        /* local fallback */
      }
    }

    const session = window.SheetlineAuth && window.SheetlineAuth.getSession();

    if (!session) {
      window.location.replace("index.html");
      return;
    }

    // Refresh role from server/local store
    const liveUser =
      window.SheetlineUsers &&
      window.SheetlineUsers.findByUsername(session.username);

    if (window.SheetlineUsers.usingServer() && !liveUser) {
      window.SheetlineAuth.clearSession();
      window.location.replace("index.html");
      return;
    }

    if (liveUser && liveUser.role) {
      window.SheetlineAuth.setSession(session.username, liveUser.role);
      session.role = liveUser.role;
    }

    const userEls = document.querySelectorAll("[data-session-user]");
    userEls.forEach((el) => {
      el.textContent = session.username;
    });

    document.querySelectorAll("[data-logout]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        window.SheetlineAuth.clearSession();
        window.location.href = "index.html";
      });
    });

    const shell = document.querySelector(".app-shell");
    const toggle = document.getElementById("sidebar-toggle");
    const overlay = document.getElementById("sidebar-overlay");

    function closeSidebar() {
      if (shell) shell.classList.remove("app-shell--sidebar-open");
    }

    if (toggle && shell) {
      toggle.addEventListener("click", () => {
        shell.classList.toggle("app-shell--sidebar-open");
      });
    }

    if (overlay) {
      overlay.addEventListener("click", closeSidebar);
    }

    const page = document.body.dataset.page;
    if (page) {
      document.querySelectorAll("[data-nav]").forEach((link) => {
        if (link.getAttribute("data-nav") === page) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "page");
        }
      });
    }
  }

  start();
})();
