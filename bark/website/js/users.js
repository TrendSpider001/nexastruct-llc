(function () {
  const body = document.getElementById("users-table-body");
  const form = document.getElementById("create-user-form");
  const formWrap = document.getElementById("users-admin-panel");
  const messageEl = document.getElementById("users-message");
  const readonlyEl = document.getElementById("users-readonly-note");
  const storageHint = document.getElementById("users-storage-hint");

  if (!body || !window.SheetlineUsers || !window.SheetlineAuth) return;

  const session = window.SheetlineAuth.getSession();
  if (!session) return;

  const isAdmin = window.SheetlineAuth.isAdmin(session);

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setMessage(text, isError) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.hidden = !text;
    messageEl.classList.toggle("is-error", Boolean(isError));
  }

  function updateStorageHint() {
    if (!storageHint) return;
    if (window.SheetlineUsers.usingServer()) {
      storageHint.textContent =
        "Accounts are saved on the server (Hostinger). New users can log in from any device.";
      storageHint.hidden = false;
      storageHint.classList.remove("is-error");
    } else {
      storageHint.textContent =
        "Server API not available — accounts are only saved in this browser. On Hostinger, upload api/users.php and make sure PHP can write to data/.";
      storageHint.hidden = false;
      storageHint.classList.add("is-error");
    }
  }

  async function render() {
    const users = await window.SheetlineUsers.list();

    if (!users.length) {
      body.innerHTML =
        '<tr><td colspan="4">No users configured yet.</td></tr>';
      return;
    }

    body.innerHTML = users
      .map((user, index) => {
        const roleCell = isAdmin
          ? `<select class="role-select" data-role-id="${escapeHtml(user.id)}" aria-label="Role for ${escapeHtml(user.username)}">
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
              <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
            </select>`
          : escapeHtml(user.role === "admin" ? "Admin" : "User");

        const actions = isAdmin
          ? `<button type="button" class="danger-btn" data-delete-id="${escapeHtml(
              user.id
            )}" data-delete-name="${escapeHtml(user.username)}" ${
              user.username.toLowerCase() === session.username.toLowerCase()
                ? "disabled"
                : ""
            }>Delete</button>`
          : "—";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${roleCell}</td>
            <td>${actions}</td>
          </tr>
        `;
      })
      .join("");
  }

  if (formWrap) formWrap.hidden = !isAdmin;
  if (readonlyEl) readonlyEl.hidden = isAdmin;

  if (form && isAdmin) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage("");

      const data = new FormData(form);
      const username = String(data.get("username") || "").trim();
      const password = String(data.get("password") || "");
      const role = String(data.get("role") || "user");
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        await window.SheetlineUsers.createUser({ username, password, role });
        form.reset();
        if (form.elements.role) form.elements.role.value = "user";
        setMessage(
          window.SheetlineUsers.usingServer()
            ? `Account "${username}" created on server. They can log in now.`
            : `Account "${username}" created in this browser only.`
        );
        await render();
        updateStorageHint();
      } catch (error) {
        setMessage(error.message || "Could not create account.", true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  body.addEventListener("change", async (event) => {
    const select = event.target.closest("[data-role-id]");
    if (!select || !isAdmin) return;

    setMessage("");
    try {
      await window.SheetlineUsers.updateRole(
        select.getAttribute("data-role-id"),
        select.value,
        session.username
      );
      setMessage("Role updated.");
      await render();
    } catch (error) {
      setMessage(error.message || "Could not update role.", true);
      await render();
    }
  });

  body.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-delete-id]");
    if (!btn || !isAdmin || btn.disabled) return;

    const name = btn.getAttribute("data-delete-name") || "this user";
    if (!window.confirm(`Delete account "${name}"?`)) return;

    setMessage("");
    try {
      await window.SheetlineUsers.deleteUser(
        btn.getAttribute("data-delete-id"),
        session.username
      );
      setMessage(`Account "${name}" deleted.`);
      await render();
    } catch (error) {
      setMessage(error.message || "Could not delete user.", true);
    }
  });

  window.SheetlineUsers
    .ready()
    .then(async () => {
      updateStorageHint();
      await render();
    })
    .catch(async () => {
      updateStorageHint();
      await render();
    });
})();
