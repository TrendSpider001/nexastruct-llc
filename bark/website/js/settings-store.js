(function () {
  const STORAGE_KEY = "sheetline_sheets";
  const CONFIG = (window.SHEETLINE_CONFIG && window.SHEETLINE_CONFIG.sheet) || {};

  function parseSheetUrl(input) {
    const text = String(input || "").trim();
    if (!text) throw new Error("Google Sheet link is required.");

    const idMatch = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (idMatch) {
      const sheetId = idMatch[1];
      const gidMatch = text.match(/[?#&]gid=([0-9]+)/);
      return {
        sheetId,
        gid: gidMatch ? gidMatch[1] : "0",
        url:
          "https://docs.google.com/spreadsheets/d/" +
          sheetId +
          "/edit#gid=" +
          (gidMatch ? gidMatch[1] : "0"),
      };
    }

    if (/^[a-zA-Z0-9-_]{20,}$/.test(text)) {
      return {
        sheetId: text,
        gid: "0",
        url: "https://docs.google.com/spreadsheets/d/" + text + "/edit#gid=0",
      };
    }

    throw new Error("Enter a valid Google Sheet link or spreadsheet ID.");
  }

  function defaultState() {
    const sheetId = CONFIG.id || "";
    const gid = String(CONFIG.gid != null ? CONFIG.gid : "0");
    if (!sheetId) {
      return { activeId: "", items: [] };
    }

    const item = {
      id: "sheet-default",
      name: "Primary sheet",
      sheetId,
      gid,
      url: "https://docs.google.com/spreadsheets/d/" + sheetId + "/edit#gid=" + gid,
    };

    return { activeId: item.id, items: [item] };
  }

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = defaultState();
        write(seeded);
        return seeded;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) {
        const seeded = defaultState();
        write(seeded);
        return seeded;
      }
      return {
        activeId: parsed.activeId || (parsed.items[0] && parsed.items[0].id) || "",
        items: parsed.items.map((item) => ({
          id: item.id || "sheet-" + Date.now(),
          name: String(item.name || "Untitled sheet").trim() || "Untitled sheet",
          sheetId: String(item.sheetId || "").trim(),
          gid: String(item.gid != null ? item.gid : "0"),
          url: String(item.url || "").trim(),
        })),
      };
    } catch {
      const seeded = defaultState();
      write(seeded);
      return seeded;
    }
  }

  function write(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function list() {
    return read().items.map((item) => ({ ...item }));
  }

  function getActive() {
    const state = read();
    const active =
      state.items.find((item) => item.id === state.activeId) || state.items[0] || null;
    return active ? { ...active } : null;
  }

  function getPageSize() {
    return Number(CONFIG.pageSize) || 20;
  }

  function getRefreshMs() {
    return Number(CONFIG.refreshMs) || 60000;
  }

  function getLocalCsv() {
    return CONFIG.localCsv || "data/sheet.csv";
  }

  function addSheet({ name, url }) {
    const parsed = parseSheetUrl(url);
    const state = read();
    const item = {
      id: "sheet-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: String(name || "").trim() || "Untitled sheet",
      sheetId: parsed.sheetId,
      gid: parsed.gid,
      url: parsed.url,
    };
    state.items.push(item);
    if (!state.activeId) state.activeId = item.id;
    write(state);
    return { ...item };
  }

  function updateSheet(id, { name, url }) {
    const state = read();
    const item = state.items.find((entry) => entry.id === id);
    if (!item) throw new Error("Sheet link not found.");

    if (url != null && String(url).trim()) {
      const parsed = parseSheetUrl(url);
      item.sheetId = parsed.sheetId;
      item.gid = parsed.gid;
      item.url = parsed.url;
    }
    if (name != null) {
      item.name = String(name).trim() || item.name;
    }

    write(state);
    return { ...item };
  }

  function removeSheet(id) {
    const state = read();
    if (!state.items.some((item) => item.id === id)) {
      throw new Error("Sheet link not found.");
    }

    state.items = state.items.filter((item) => item.id !== id);
    if (state.activeId === id) {
      state.activeId = state.items[0] ? state.items[0].id : "";
    }
    write(state);
  }

  function setActive(id) {
    const state = read();
    if (!state.items.some((item) => item.id === id)) {
      throw new Error("Sheet link not found.");
    }
    state.activeId = id;
    write(state);
    return getActive();
  }

  window.SheetlineSettings = {
    parseSheetUrl,
    list,
    getActive,
    getPageSize,
    getRefreshMs,
    getLocalCsv,
    addSheet,
    updateSheet,
    removeSheet,
    setActive,
  };
})();
