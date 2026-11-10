(function () {
  const body = document.getElementById("data-table-body");
  const metaEl = document.getElementById("data-meta");
  const pagerEl = document.getElementById("data-pagination");
  const statusEl = document.getElementById("data-status");
  const filterEl = document.getElementById("filter-project-type");
  const contentFilterEl = document.getElementById("filter-content");
  const sortEl = document.getElementById("sort-date");
  const refreshBtn = document.getElementById("refresh-data-btn");
  const pageSize =
    (window.SheetlineSettings && window.SheetlineSettings.getPageSize()) ||
    (window.SHEETLINE_CONFIG &&
      window.SHEETLINE_CONFIG.sheet &&
      window.SHEETLINE_CONFIG.sheet.pageSize) ||
    20;

  if (!body || !window.SheetlineData) return;

  let currentPage = 1;
  let projectFilter = "";
  let contentFilter = "all";
  let dateSort = "newest";
  let clockTimer = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMail(status) {
    const value = String(status || "").trim();
    if (!value) return "";
    if (value.toLowerCase() === "manual search need") return "";
    return value;
  }

  function getAttachments(row) {
    return Array.isArray(row.attachments) ? row.attachments : [];
  }

  function hasMail(row) {
    return Boolean(formatMail(row.status));
  }

  function hasAttachments(row) {
    return getAttachments(row).length > 0;
  }

  function matchesContentFilter(row) {
    if (contentFilter === "email") return hasMail(row);
    if (contentFilter === "attachments") return hasAttachments(row);
    return true;
  }

  function getContentFilteredRows() {
    return window.SheetlineData.getAll().filter(matchesContentFilter);
  }

  function fileNameFromUrl(url) {
    try {
      const path = new URL(url).pathname;
      const name = decodeURIComponent(path.split("/").pop() || "");
      return name || "attachment";
    } catch (_) {
      const parts = String(url).split("/");
      return parts[parts.length - 1] || "attachment";
    }
  }

  function copyIcon() {
    return `<svg class="copy-btn__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.7"></rect>
      <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>
    </svg>`;
  }

  function copiedIcon() {
    return `<svg class="copy-btn__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;
  }

  function copyButton(label, text, disabled) {
    if (disabled || !text) {
      return `<button type="button" class="copy-btn" disabled aria-label="Copy">${copyIcon()}</button>`;
    }
    return `<button type="button" class="copy-btn" data-copy="${escapeHtml(
      text
    )}" data-copy-label="${escapeHtml(label)}" aria-label="Copy">${copyIcon()}</button>`;
  }

  function sanitizeFolderName(value) {
    const cleaned = String(value || "")
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1f]+/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 80);
    return cleaned || "Attachments";
  }

  function folderNameForRow(row) {
    const name = String(row.name || "").trim();
    const date = String(row.date || "").trim();
    if (name && date) return sanitizeFolderName(date + "_" + name);
    if (name) return sanitizeFolderName(name);
    if (date) return sanitizeFolderName(date + "_Attachments");
    return "Attachments";
  }

  function uniqueFileName(name, used) {
    let candidate = name || "attachment";
    let index = 1;
    while (used.has(candidate.toLowerCase())) {
      const match = String(name || "attachment").match(/^(.*?)(\.[^.]+)?$/);
      const base = match && match[1] ? match[1] : "attachment";
      const ext = match && match[2] ? match[2] : "";
      candidate = base + "_" + index + ext;
      index += 1;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  }

  function downloadButton(urls, folderName) {
    if (!urls.length) return "";
    return `<button type="button" class="download-btn" data-download-urls="${escapeHtml(
      JSON.stringify(urls)
    )}" data-download-folder="${escapeHtml(folderName)}">Download</button>`;
  }

  function formatLiveTime(timeZone) {
    if (!window.SheetlineTimezone || !window.SheetlineTimezone.formatLocalTime) {
      return "—";
    }
    return window.SheetlineTimezone.formatLocalTime(timeZone);
  }

  function timeCell(row) {
    const zone = row.timeZone || "";
    if (!zone) return "—";
    return `<span class="live-local-time" data-tz="${escapeHtml(
      zone
    )}">${escapeHtml(formatLiveTime(zone))}</span>`;
  }

  function openUrlsButton(urls) {
    if (!urls.length) return "";
    return `<button type="button" class="open-url-btn" data-open-urls="${escapeHtml(
      JSON.stringify(urls)
    )}">Open</button>`;
  }

  function mailCell(row) {
    const mailValue = formatMail(row.status);
    if (!mailValue) return "";

    return `<span class="data-copy-cell__text">${escapeHtml(mailValue)}</span>
      ${copyButton("mail", mailValue, false)}`;
  }

  function thatsthemCell(row) {
    const urls = getThatsthemUrls(row);
    if (!urls.length) return "";
    return `<span class="data-thatsthem-actions">${openUrlsButton(urls)}</span>`;
  }

  function attachmentsCell(row) {
    const attachments = getAttachments(row);
    if (!attachments.length) return "";
    return `<span class="data-attach-actions">${downloadButton(
      attachments,
      folderNameForRow(row)
    )}</span>`;
  }

  function getThatsthemUrls(row) {
    return Array.isArray(row.thatsthemUrls) ? row.thatsthemUrls : [];
  }

  async function copyText(text, button) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }

      const original = button.innerHTML;
      button.innerHTML = copiedIcon();
      button.classList.add("is-copied");
      button.setAttribute("aria-label", "Copied");
      window.setTimeout(() => {
        button.innerHTML = original;
        button.classList.remove("is-copied");
        button.setAttribute("aria-label", "Copy");
      }, 1200);
    } catch (_) {
      button.classList.add("is-error");
      button.setAttribute("aria-label", "Copy failed");
      window.setTimeout(() => {
        button.classList.remove("is-error");
        button.setAttribute("aria-label", "Copy");
      }, 1200);
    }
  }

  async function fetchAttachmentBlob(url, fileName) {
    const proxyUrl =
      "api/download.php?url=" +
      encodeURIComponent(url) +
      "&filename=" +
      encodeURIComponent(fileName || "attachment");
    const response = await fetch(proxyUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Download failed");
    }
    return response.blob();
  }

  async function downloadAttachments(urls, folderName, button) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "…";

    try {
      if (!urls.length) throw new Error("No attachments");
      if (typeof JSZip === "undefined") {
        throw new Error("Zip library unavailable");
      }

      const folder = sanitizeFolderName(folderName);
      const zip = new JSZip();
      const directory = zip.folder(folder);
      if (!directory) throw new Error("Could not create folder");

      const usedNames = new Set();
      let saved = 0;

      for (let i = 0; i < urls.length; i += 1) {
        const url = urls[i];
        const fileName = uniqueFileName(fileNameFromUrl(url), usedNames);
        button.textContent = i + 1 + "/" + urls.length;
        const blob = await fetchAttachmentBlob(url, fileName);
        directory.file(fileName, blob);
        saved += 1;
      }

      if (!saved) throw new Error("No files downloaded");

      button.textContent = "Zip…";
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const objectUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = folder + ".zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      button.textContent = "Saved";
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1200);
    } catch (_) {
      button.textContent = "Failed";
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1400);
    }
  }

  function formatDate(row) {
    if (row.date) return row.date;
    if (row.timestamp) return String(row.timestamp).slice(0, 10);
    return "—";
  }

  function rowTime(row) {
    if (row.timestamp) {
      const time = Date.parse(row.timestamp);
      if (!Number.isNaN(time)) return time;
    }
    if (row.date) {
      const time = Date.parse(row.date + "T00:00:00");
      if (!Number.isNaN(time)) return time;
    }
    return 0;
  }

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.hidden = !message;
    statusEl.classList.toggle("is-error", Boolean(isError));
  }

  function getFilteredSortedRows() {
    let rows = getContentFilteredRows();

    if (projectFilter) {
      rows = rows.filter((row) => row.projectType === projectFilter);
    }

    rows = rows.slice().sort((a, b) => {
      const diff = rowTime(a) - rowTime(b);
      return dateSort === "oldest" ? diff : -diff;
    });

    return rows;
  }

  function fillProjectTypeOptions() {
    if (!filterEl) return;

    const selected = projectFilter;
    const types = Array.from(
      new Set(
        getContentFilteredRows()
          .map((row) => row.projectType)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    filterEl.innerHTML =
      '<option value="">All types</option>' +
      types
        .map(
          (type) =>
            `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`
        )
        .join("");

    if (selected && types.includes(selected)) {
      filterEl.value = selected;
    } else {
      projectFilter = "";
      filterEl.value = "";
    }
  }

  function renderPagination(total, totalPages) {
    if (!pagerEl) return;

    if (total === 0) {
      pagerEl.innerHTML = "";
      return;
    }

    const pages = [];
    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    pages.push(
      `<button type="button" class="pager__btn" data-page="prev" ${
        currentPage === 1 ? "disabled" : ""
      }>Prev</button>`
    );

    if (start > 1) {
      pages.push(
        `<button type="button" class="pager__btn" data-page="1">1</button>`
      );
      if (start > 2) pages.push(`<span class="pager__ellipsis">…</span>`);
    }

    for (let p = start; p <= end; p += 1) {
      pages.push(
        `<button type="button" class="pager__btn${
          p === currentPage ? " is-active" : ""
        }" data-page="${p}">${p}</button>`
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(`<span class="pager__ellipsis">…</span>`);
      }
      pages.push(
        `<button type="button" class="pager__btn" data-page="${totalPages}">${totalPages}</button>`
      );
    }

    pages.push(
      `<button type="button" class="pager__btn" data-page="next" ${
        currentPage === totalPages ? "disabled" : ""
      }>Next</button>`
    );

    pagerEl.innerHTML = pages.join("");
  }

  function updateLiveClocks() {
    body.querySelectorAll(".live-local-time[data-tz]").forEach((el) => {
      const zone = el.getAttribute("data-tz") || "";
      el.textContent = formatLiveTime(zone);
    });
  }

  function ensureClockTimer() {
    if (clockTimer) return;
    clockTimer = window.setInterval(updateLiveClocks, 1000);
  }

  function emptyStateMessage() {
    if (projectFilter) return "No records for this project type.";
    if (contentFilter === "email") return "No records with email found.";
    if (contentFilter === "attachments") return "No records with attachments found.";
    return "No records found.";
  }

  function render() {
    const rows = getFilteredSortedRows();
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = rows.slice(startIndex, startIndex + pageSize);

    if (metaEl) {
      if (!total) {
        metaEl.textContent = emptyStateMessage();
      } else {
        const from = startIndex + 1;
        const to = startIndex + pageRows.length;
        metaEl.textContent = `Showing ${from}–${to} of ${total}`;
      }
    }

    if (!total) {
      body.innerHTML =
        '<tr><td colspan="10">No data matches the current filters.</td></tr>';
      renderPagination(0, 1);
      return;
    }

    body.innerHTML = pageRows
      .map((row, index) => {
        const displayNo = startIndex + index + 1;
        const detailsValue = String(row.details || "").trim();
        return `
          <tr>
            <td>${escapeHtml(displayNo)}</td>
            <td>${escapeHtml(formatDate(row))}</td>
            <td>${escapeHtml(row.name) || "—"}</td>
            <td>${escapeHtml(row.projectType) || "—"}</td>
            <td>${escapeHtml(row.location) || "—"}</td>
            <td class="data-time-cell">${timeCell(row)}</td>
            <td class="data-copy-cell">${mailCell(row)}</td>
            <td class="data-thatsthem-cell">${thatsthemCell(row)}</td>
            <td class="data-copy-cell">${attachmentsCell(row)}</td>
            <td class="data-copy-cell">
              ${copyButton("details", detailsValue, !detailsValue)}
            </td>
          </tr>
        `;
      })
      .join("");

    renderPagination(total, totalPages);
    updateLiveClocks();
    ensureClockTimer();
  }

  body.addEventListener("click", (event) => {
    const openBtn = event.target.closest(".open-url-btn[data-open-urls]");
    if (openBtn && !openBtn.disabled) {
      let urls = [];
      try {
        const parsed = JSON.parse(openBtn.getAttribute("data-open-urls") || "[]");
        urls = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (_) {
        urls = [];
      }
      urls.forEach((url) => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
      return;
    }

    const copyBtn = event.target.closest(".copy-btn[data-copy]");
    if (copyBtn && !copyBtn.disabled) {
      copyText(copyBtn.getAttribute("data-copy") || "", copyBtn);
      return;
    }

    const downloadBtn = event.target.closest(
      ".download-btn[data-download-urls]"
    );
    if (downloadBtn && !downloadBtn.disabled) {
      let urls = [];
      try {
        const parsed = JSON.parse(
          downloadBtn.getAttribute("data-download-urls") || "[]"
        );
        urls = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (_) {
        urls = [];
      }

      downloadAttachments(
        urls,
        downloadBtn.getAttribute("data-download-folder") || "Attachments",
        downloadBtn
      );
    }
  });

  if (contentFilterEl) {
    contentFilterEl.addEventListener("change", () => {
      contentFilter = contentFilterEl.value || "all";
      currentPage = 1;
      fillProjectTypeOptions();
      render();
    });
  }

  if (filterEl) {
    filterEl.addEventListener("change", () => {
      projectFilter = filterEl.value;
      currentPage = 1;
      render();
    });
  }

  if (sortEl) {
    sortEl.addEventListener("change", () => {
      dateSort = sortEl.value === "oldest" ? "oldest" : "newest";
      currentPage = 1;
      render();
    });
  }

  if (pagerEl) {
    pagerEl.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-page]");
      if (!btn || btn.disabled) return;

      const total = getFilteredSortedRows().length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
      const target = btn.getAttribute("data-page");

      if (target === "prev") currentPage = Math.max(1, currentPage - 1);
      else if (target === "next") {
        currentPage = Math.min(totalPages, currentPage + 1);
      } else {
        currentPage = Number(target) || 1;
      }

      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function sourceLabel(source) {
    if (source === "google-proxy" || source === "google-gviz") {
      return "Google Sheet";
    }
    if (source === "local-csv") return "local CSV fallback";
    return "sheet";
  }

  function loadAndRender(force) {
    setStatus(force ? "Refreshing from Google Sheet…" : "Loading Google Sheet…");
    if (refreshBtn) refreshBtn.disabled = true;

    const request = force
      ? window.SheetlineData.reload()
      : window.SheetlineData.load();

    return request
      .then((list) => {
        const source = window.SheetlineData.getSource
          ? window.SheetlineData.getSource()
          : "";
        const fromLocal = source === "local-csv";
        const warning = window.SheetlineData.getLastError
          ? window.SheetlineData.getLastError()
          : "";
        setStatus(
          `Loaded ${list.length} rows from ${sourceLabel(source)}` +
            (fromLocal && warning ? ` (${warning})` : ""),
          fromLocal
        );
        fillProjectTypeOptions();
        render();
        window.setTimeout(() => setStatus(""), fromLocal ? 5000 : 2500);
      })
      .catch((error) => {
        setStatus(error.message || "Failed to load sheet data", true);
        fillProjectTypeOptions();
        render();
      })
      .finally(() => {
        if (refreshBtn) refreshBtn.disabled = false;
      });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadAndRender(true);
    });
  }

  loadAndRender(false);

  window.SheetlineData.onChange(() => {
    fillProjectTypeOptions();
    render();
  });
})();
