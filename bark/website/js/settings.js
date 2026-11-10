(function () {
  const form = document.getElementById("sheet-form");
  const formTitle = document.getElementById("sheet-form-title");
  const submitBtn = document.getElementById("sheet-form-submit");
  const cancelBtn = document.getElementById("sheet-form-cancel");
  const editIdInput = document.getElementById("sheet-edit-id");
  const listEl = document.getElementById("sheet-list");
  const messageEl = document.getElementById("settings-message");
  const adminPanel = document.getElementById("settings-admin-panel");
  const readonlyNote = document.getElementById("settings-readonly-note");

  if (!window.SheetlineSettings || !window.SheetlineAuth) return;

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

  function resetForm() {
    if (!form) return;
    form.reset();
    if (editIdInput) editIdInput.value = "";
    if (formTitle) formTitle.textContent = "Add Google Sheet link";
    if (submitBtn) submitBtn.textContent = "Add sheet";
    if (cancelBtn) cancelBtn.hidden = true;
  }

  function startEdit(item) {
    if (!form || !isAdmin) return;
    if (editIdInput) editIdInput.value = item.id;
    if (form.elements.name) form.elements.name.value = item.name;
    if (form.elements.url) form.elements.url.value = item.url;
    if (formTitle) formTitle.textContent = "Modify Google Sheet link";
    if (submitBtn) submitBtn.textContent = "Save changes";
    if (cancelBtn) cancelBtn.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function reloadData() {
    if (window.SheetlineData && window.SheetlineData.reload) {
      try {
        await window.SheetlineData.reload();
      } catch (_) {
        /* data page/dashboard will show errors on next visit */
      }
    }
  }

  function render() {
    if (!listEl) return;
    const items = window.SheetlineSettings.list();
    const active = window.SheetlineSettings.getActive();
    const activeId = active ? active.id : "";

    if (!items.length) {
      listEl.innerHTML =
        '<div class="sheet-empty">No Google Sheet links saved yet.</div>';
      return;
    }

    listEl.innerHTML = items
      .map((item) => {
        const isActive = item.id === activeId;
        const actions = isAdmin
          ? `
            <div class="sheet-card__actions">
              <button type="button" class="btn-secondary" data-activate="${escapeHtml(
                item.id
              )}" ${isActive ? "disabled" : ""}>
                ${isActive ? "Active" : "Use this"}
              </button>
              <button type="button" class="copy-btn" data-edit="${escapeHtml(
                item.id
              )}">Edit</button>
              <button type="button" class="danger-btn" data-remove="${escapeHtml(
                item.id
              )}">Remove</button>
            </div>
          `
          : `
            <div class="sheet-card__actions">
              <span class="sheet-card__badge">${
                isActive ? "Active" : "Saved"
              }</span>
            </div>
          `;

        return `
          <article class="sheet-card${isActive ? " is-active" : ""}">
            <div class="sheet-card__body">
              <h3 class="sheet-card__name">${escapeHtml(item.name)}</h3>
              <p class="sheet-card__url">${escapeHtml(item.url)}</p>
              <p class="sheet-card__meta">ID: ${escapeHtml(
                item.sheetId
              )} · gid: ${escapeHtml(item.gid)}</p>
            </div>
            ${actions}
          </article>
        `;
      })
      .join("");
  }

  if (adminPanel) adminPanel.hidden = !isAdmin;
  if (readonlyNote) readonlyNote.hidden = isAdmin;

  if (form && isAdmin) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage("");

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const url = String(data.get("url") || "").trim();
      const editId = editIdInput ? editIdInput.value : "";

      try {
        if (editId) {
          window.SheetlineSettings.updateSheet(editId, { name, url });
          setMessage("Sheet link updated.");
        } else {
          const created = window.SheetlineSettings.addSheet({ name, url });
          if (!window.SheetlineSettings.getActive()) {
            window.SheetlineSettings.setActive(created.id);
          }
          setMessage("Sheet link added.");
        }
        resetForm();
        render();
        await reloadData();
      } catch (error) {
        setMessage(error.message || "Could not save sheet link.", true);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      resetForm();
      setMessage("");
    });
  }

  if (listEl) {
    listEl.addEventListener("click", async (event) => {
      const activateBtn = event.target.closest("[data-activate]");
      const editBtn = event.target.closest("[data-edit]");
      const removeBtn = event.target.closest("[data-remove]");

      if (activateBtn && isAdmin && !activateBtn.disabled) {
        setMessage("");
        try {
          window.SheetlineSettings.setActive(
            activateBtn.getAttribute("data-activate")
          );
          setMessage("Active Google Sheet updated. Reloading data…");
          render();
          await reloadData();
          setMessage("Active Google Sheet updated.");
        } catch (error) {
          setMessage(error.message || "Could not activate sheet.", true);
        }
        return;
      }

      if (editBtn && isAdmin) {
        const id = editBtn.getAttribute("data-edit");
        const item = window.SheetlineSettings.list().find((entry) => entry.id === id);
        if (item) startEdit(item);
        return;
      }

      if (removeBtn && isAdmin) {
        const id = removeBtn.getAttribute("data-remove");
        const item = window.SheetlineSettings.list().find((entry) => entry.id === id);
        if (!item) return;
        if (!window.confirm(`Remove sheet link "${item.name}"?`)) return;

        setMessage("");
        try {
          window.SheetlineSettings.removeSheet(id);
          setMessage("Sheet link removed.");
          resetForm();
          render();
          await reloadData();
        } catch (error) {
          setMessage(error.message || "Could not remove sheet.", true);
        }
      }
    });
  }

  resetForm();
  render();
})();
