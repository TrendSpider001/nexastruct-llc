(function () {
  const CONFIG = window.SHEETLINE_CONFIG || { sessionHours: 12 };
  const SESSION_KEY = "sheetline_session";

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || !session.expiresAt || Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      if (window.SheetlineUsers) {
        const user = window.SheetlineUsers.findByUsername(session.username);
        if (user) {
          session.role = user.role;
        }
      }

      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function setSession(username, role) {
    const hours = CONFIG.sessionHours || 12;
    const session = {
      username,
      role: role === "admin" ? "admin" : "user",
      expiresAt: Date.now() + hours * 60 * 60 * 1000,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isAdmin(session) {
    const current = session || getSession();
    return Boolean(current && current.role === "admin");
  }

  window.SheetlineAuth = {
    getSession,
    setSession,
    clearSession,
    isAdmin,
  };

  const form = document.getElementById("login-form");
  if (!form) return;

  async function boot() {
    if (window.SheetlineUsers && window.SheetlineUsers.ready) {
      try {
        await window.SheetlineUsers.ready();
      } catch (_) {
        /* local fallback */
      }
    }

    if (getSession()) {
      window.location.replace("dashboard.html");
    }
  }

  boot();

  const errorEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");
  const toggleBtn = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      const showing = passwordInput.type === "text";
      passwordInput.type = showing ? "password" : "text";
      toggleBtn.textContent = showing ? "Show" : "Hide";
      toggleBtn.setAttribute(
        "aria-label",
        showing ? "Show password" : "Hide password"
      );
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = String(new FormData(form).get("username") || "").trim();
    const password = String(new FormData(form).get("password") || "");

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    if (!username || !password) {
      if (errorEl) {
        errorEl.textContent = "Enter both username and password.";
        errorEl.hidden = false;
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      if (window.SheetlineUsers && window.SheetlineUsers.ready) {
        await window.SheetlineUsers.ready();
      }

      const user = window.SheetlineUsers
        ? await window.SheetlineUsers.validateLogin(username, password)
        : null;

      if (!user) {
        if (errorEl) {
          errorEl.textContent = "Incorrect username or password.";
          errorEl.hidden = false;
        }
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      setSession(user.username, user.role);
      window.location.href = "dashboard.html";
    } catch (error) {
      if (errorEl) {
        errorEl.textContent =
          error.message || "Login failed. Please try again.";
        errorEl.hidden = false;
      }
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
