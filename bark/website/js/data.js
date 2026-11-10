(function () {
  function getSheetConfig() {
    if (window.SheetlineSettings) {
      const active = window.SheetlineSettings.getActive();
      return {
        sheetId: active ? active.sheetId : "",
        gid: active ? active.gid : "0",
        localCsv: window.SheetlineSettings.getLocalCsv(),
        refreshMs: window.SheetlineSettings.getRefreshMs(),
        pageSize: window.SheetlineSettings.getPageSize(),
      };
    }

    const CONFIG = (window.SHEETLINE_CONFIG && window.SHEETLINE_CONFIG.sheet) || {};
    return {
      sheetId: CONFIG.id || "",
      gid: String(CONFIG.gid != null ? CONFIG.gid : "0"),
      localCsv: CONFIG.localCsv || "data/sheet.csv",
      refreshMs: CONFIG.refreshMs || 60000,
      pageSize: CONFIG.pageSize || 20,
    };
  }

  const REFRESH_MS = getSheetConfig().refreshMs;

  let rows = [];
  let loaded = false;
  let loading = null;
  let lastFingerprint = "";
  let lastSource = "";
  let lastError = "";
  const listeners = new Set();

  function formatDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function parseTimestamp(value) {
    if (!value) return { date: "", iso: "" };
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
      const raw = String(value).slice(0, 10);
      return { date: /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "", iso: String(value) };
    }
    return { date: formatDateKey(d), iso: d.toISOString() };
  }

  function cellValue(cell) {
    if (!cell) return "";
    if (cell.v instanceof Date) return cell.v;
    if (cell.v != null && cell.v !== "") return cell.v;
    return cell.f != null ? cell.f : "";
  }

  function normalizeHeader(label) {
    return String(label || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function parseUrls(value) {
    return String(value || "")
      .split("|")
      .map((part) => part.trim())
      .filter((part) => /^https?:\/\//i.test(part));
  }

  function parseAttachments(value) {
    return parseUrls(value);
  }

  function assignUnnamedColumn(raw, value) {
    const text = String(value || "").trim();
    if (!text) return;
    if (/thatsthem\.com/i.test(text) || /^https?:\/\//i.test(text)) {
      raw.thatsthem_url = raw.thatsthem_url
        ? raw.thatsthem_url + " | " + text
        : text;
    }
  }

  function isMailValue(value) {
    const text = String(value || "").trim();
    if (!text) return false;
    if (text.toLowerCase() === "manual search need") return false;
    return true;
  }

  function mapRow(raw, index) {
    const stamp = parseTimestamp(
      raw.timestamp || raw.time_stamp || raw.TimeStamp
    );
    const name = String(raw.bark_client || raw.name || "").trim();
    const projectType = String(raw.bark_title || raw.project_type || "").trim();
    const location = String(raw.bark_location || raw.location || "").trim();
    const state = String(raw.bark_state || raw.state || "").trim();
    const mail = String(raw.bark_email || raw.mail || raw.email || "").trim();
    const details = String(raw.bark_details || raw.details || "").trim();
    const status = String(raw.status || raw.Status || "").trim();
    const attachments = parseAttachments(
      raw.bark_attachments || raw.attachments || ""
    );
    const thatsthemUrls = parseUrls(
      raw.thatsthem_url || raw.search_url || raw.thatsthem || raw.m || ""
    );
    const timeZone = window.SheetlineTimezone
      ? window.SheetlineTimezone.resolveTimeZone(
          raw.timezone || raw.timezone_gmt || "",
          location,
          state
        )
      : "";
    const timezone = timeZone
      ? window.SheetlineTimezone.offsetLabel
        ? window.SheetlineTimezone.offsetLabel(timeZone)
        : timeZone
      : "—";

    return {
      no: index + 1,
      name,
      projectType,
      location,
      timezone: timezone || "—",
      timeZone: timeZone || "",
      mail,
      details,
      attachments,
      thatsthemUrls,
      date: stamp.date,
      timestamp: stamp.iso,
      status,
      source: String(raw.source || "").trim(),
      hasMail: isMailValue(status),
    };
  }

  function hasRowData(raw) {
    return Boolean(
      raw.bark_client ||
        raw.bark_title ||
        raw.bark_email ||
        raw.timestamp ||
        raw.time_stamp ||
        raw.TimeStamp
    );
  }

  function parseGviz(response) {
    if (!response || response.status === "error" || !response.table) {
      const message =
        response &&
        response.errors &&
        response.errors[0] &&
        response.errors[0].detailed_message
          ? response.errors[0].detailed_message
          : "Invalid Google Sheet response";
      throw new Error(message);
    }

    const cols = (response.table.cols || []).map((col) => {
      const label = col.label != null ? String(col.label).trim() : "";
      return label ? normalizeHeader(label) : "";
    });

    return (response.table.rows || [])
      .map((row) => {
        const cells = row.c || [];
        const raw = {};
        cols.forEach((key, i) => {
          const value = cellValue(cells[i]);
          if (!key) {
            assignUnnamedColumn(raw, value);
            return;
          }
          raw[key] = value;
        });
        return raw;
      })
      .filter(hasRowData)
      .map((raw, index) => mapRow(raw, index));
  }

  function parseCsv(text) {
    const records = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        records.push(row);
        row = [];
        field = "";
      } else if (char !== "\r") {
        field += char;
      }
    }

    if (field.length || row.length) {
      row.push(field);
      records.push(row);
    }

    if (!records.length) return [];

    const headers = records[0].map(normalizeHeader);
    return records
      .slice(1)
      .filter((cells) => cells.some((value) => String(value || "").trim()))
      .map((cells) => {
        const raw = {};
        headers.forEach((key, i) => {
          const value = cells[i] != null ? cells[i] : "";
          if (!key) {
            assignUnnamedColumn(raw, value);
            return;
          }
          raw[key] = value;
        });
        return raw;
      })
      .filter(hasRowData)
      .map((raw, index) => mapRow(raw, index));
  }

  function fingerprintFor(list) {
    return list
      .map(
        (row) =>
          `${row.timestamp}|${row.name}|${row.projectType}|${row.mail}|${row.status}|${row.details.length}|${(row.attachments || []).join(",")}|${(row.thatsthemUrls || []).join(",")}`
      )
      .join("||");
  }

  function setRows(nextRows, source) {
    const fingerprint = fingerprintFor(nextRows);
    rows = nextRows;
    loaded = true;
    lastSource = source || lastSource || "unknown";
    lastError = "";

    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      listeners.forEach((fn) => {
        try {
          fn(rows);
        } catch (_) {
          /* ignore listener errors */
        }
      });
    }

    return rows;
  }

  async function loadCsvText(url, label) {
    const response = await fetch(url, { cache: "no-store", mode: "cors" });
    if (!response.ok) {
      throw new Error(label + " failed (" + response.status + ")");
    }
    const text = await response.text();
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error(label + " returned empty data");
    }
    if (trimmed.charAt(0) === "{") {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && parsed.ok === false) {
          throw new Error(parsed.error || label + " failed");
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          // CSV/text that happens to start with "{" — keep going.
        } else {
          throw error;
        }
      }
    }
    if (/^<!DOCTYPE/i.test(trimmed) || /^<html/i.test(trimmed)) {
      throw new Error(
        "Google Sheet is not publicly viewable. Share it as Anyone with the link can view."
      );
    }
    return text;
  }

  async function loadFromProxy(sheetId, gid) {
    const url =
      "api/sheet.php?sheetId=" +
      encodeURIComponent(sheetId) +
      "&gid=" +
      encodeURIComponent(gid || "0") +
      "&_=" +
      Date.now();
    const text = await loadCsvText(url, "Sheet proxy");
    return parseCsv(text);
  }

  function loadFromGviz(sheetId, gid) {
    return new Promise((resolve, reject) => {
      if (!sheetId) {
        reject(new Error("No active Google Sheet link. Add one in Settings."));
        return;
      }

      const callbackName = "__sheetlineGviz_" + Date.now();
      const script = document.createElement("script");
      let settled = false;

      function cleanup() {
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = (response) => {
        if (settled) return;
        settled = true;
        cleanup();
        try {
          resolve(parseGviz(response));
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("Failed to load Google Sheet"));
      };

      // Encode the full tqx value so ";" is not treated as a query separator.
      script.src =
        "https://docs.google.com/spreadsheets/d/" +
        encodeURIComponent(sheetId) +
        "/gviz/tq?tqx=" +
        encodeURIComponent("out:json;responseHandler:" + callbackName) +
        "&gid=" +
        encodeURIComponent(gid || "0") +
        "&headers=1&_=" +
        Date.now();

      document.head.appendChild(script);

      window.setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("Google Sheet request timed out"));
      }, 20000);
    });
  }

  async function loadFromLocalCsv(localCsv) {
    const url =
      localCsv + (localCsv.indexOf("?") === -1 ? "?" : "&") + "_=" + Date.now();
    const text = await loadCsvText(url, "Local CSV");
    return parseCsv(text);
  }

  async function load(force) {
    if (loading) return loading;
    if (loaded && !force) return rows;

    loading = (async () => {
      const config = getSheetConfig();
      if (!config.sheetId) {
        return setRows([], "none");
      }

      const errors = [];

      try {
        const remote = await loadFromProxy(config.sheetId, config.gid);
        return setRows(remote, "google-proxy");
      } catch (error) {
        errors.push(error);
        console.warn("Sheetline: proxy fetch failed", error);
      }

      try {
        const remote = await loadFromGviz(config.sheetId, config.gid);
        return setRows(remote, "google-gviz");
      } catch (error) {
        errors.push(error);
        console.warn("Sheetline: Google gviz fetch failed", error);
      }

      try {
        const local = await loadFromLocalCsv(config.localCsv);
        lastError = errors[0] ? errors[0].message : "";
        return setRows(local, "local-csv");
      } catch (localError) {
        lastError = (errors[0] || localError).message;
        throw errors[0] || localError;
      }
    })().finally(() => {
      loading = null;
    });

    return loading;
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  const api = {
    load,
    reload() {
      return load(true);
    },
    onChange,
    isLoaded() {
      return loaded;
    },
    getSource() {
      return lastSource;
    },
    getLastError() {
      return lastError;
    },
    getAll() {
      return rows.slice();
    },
    formatDateKey,
    getTodayKey() {
      return formatDateKey(new Date());
    },
    getTodayCount() {
      const key = this.getTodayKey();
      return rows.filter((row) => row.date === key).length;
    },
    getMailCount() {
      return rows.filter((row) => row.hasMail).length;
    },
    getTodayMailCount() {
      const key = this.getTodayKey();
      return rows.filter((row) => row.date === key && row.hasMail).length;
    },
    getTotalCount() {
      return rows.length;
    },
    getUsers() {
      if (window.SheetlineUsers && window.SheetlineUsers.listSync) {
        return window.SheetlineUsers.listSync();
      }
      return (window.SHEETLINE_CONFIG && window.SHEETLINE_CONFIG.users) || [];
    },
    getUserCount() {
      return this.getUsers().length;
    },
    getCountsByDate(days) {
      const span = Math.max(1, Number(days) || 10);
      const totals = new Map();
      const mailCounts = new Map();
      const attachmentCounts = new Map();
      const labels = [];

      for (let i = span - 1; i >= 0; i -= 1) {
        const day = new Date();
        day.setHours(12, 0, 0, 0);
        day.setDate(day.getDate() - i);
        const key = formatDateKey(day);
        labels.push(key);
        totals.set(key, 0);
        mailCounts.set(key, 0);
        attachmentCounts.set(key, 0);
      }

      rows.forEach((row) => {
        if (!totals.has(row.date)) return;
        totals.set(row.date, totals.get(row.date) + 1);
        if (row.hasMail) {
          mailCounts.set(row.date, mailCounts.get(row.date) + 1);
        }
        if ((row.attachments || []).length > 0) {
          attachmentCounts.set(row.date, attachmentCounts.get(row.date) + 1);
        }
      });

      const values = labels.map((key) => totals.get(key) || 0);
      const mailValues = labels.map((key) => mailCounts.get(key) || 0);
      const attachmentValues = labels.map((key) => attachmentCounts.get(key) || 0);
      return {
        labels,
        values,
        mailValues,
        attachmentValues,
        fingerprint: labels
          .map(
            (label, i) =>
              label +
              ":" +
              values[i] +
              ":" +
              mailValues[i] +
              ":" +
              attachmentValues[i]
          )
          .join("|"),
      };
    },
  };

  window.SheetlineData = api;

  // Keep data fresh in the background
  load(true).catch((error) => {
    console.error("Sheetline: initial data load failed", error);
  });

  window.setInterval(() => {
    load(true).catch(() => {});
  }, REFRESH_MS);
})();
