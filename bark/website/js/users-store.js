(function () {
  const STORAGE_KEY = "sheetline_users";
  const API_URL = "api/users.php";
  const CONFIG = window.SHEETLINE_CONFIG || {};

  let useApi = null; // null = unknown, true/false after probe
  let memoryUsers = null;

  function normalizeRole(role) {
    return role === "admin" ? "admin" : "user";
  }

  function seedUsers() {
    const defaults = CONFIG.users || [];
    return defaults
      .map((user, index) => ({
        id: "seed-" + index + "-" + String(user.username || "user").toLowerCase(),
        username: String(user.username || "").trim(),
        password: String(user.password || ""),
        role: normalizeRole(user.role || (index === 0 ? "admin" : "user")),
      }))
      .filter((user) => user.username);
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = seedUsers();
        writeLocal(seeded);
        return seeded;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        const seeded = seedUsers();
        writeLocal(seeded);
        return seeded;
      }
      return parsed.map((user) => ({
        id: user.id || "user-" + String(user.username || Math.random()),
        username: String(user.username || "").trim(),
        password: String(user.password || ""),
        role: normalizeRole(user.role),
      }));
    } catch {
      const seeded = seedUsers();
      writeLocal(seeded);
      return seeded;
    }
  }

  function writeLocal(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    memoryUsers = users.map((user) => ({ ...user }));
  }

  async function apiRequest(action, body) {
    const response = await fetch(API_URL + "?action=" + encodeURIComponent(action), {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data || data.ok === false) {
      const error = new Error(
        (data && data.error) || "Server request failed (" + response.status + ")"
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async function ensureApi() {
    if (useApi !== null) return useApi;

    try {
      const data = await apiRequest("list");
      useApi = true;
      memoryUsers = (data.users || []).map((user) => ({
        id: user.id,
        username: user.username,
        role: normalizeRole(user.role),
        password: "",
      }));

      // Seed server file once if empty
      if (!memoryUsers.length) {
        const seeded = await apiRequest("bootstrap", { users: seedUsers() });
        memoryUsers = (seeded.users || []).map((user) => ({
          id: user.id,
          username: user.username,
          role: normalizeRole(user.role),
          password: "",
        }));
      }

      return true;
    } catch {
      useApi = false;
      memoryUsers = readLocal();
      return false;
    }
  }

  function listSync() {
    if (memoryUsers) return memoryUsers.map((user) => ({ ...user }));
    return readLocal().map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      password: "",
    }));
  }

  async function list() {
    await ensureApi();
    if (useApi) {
      const data = await apiRequest("list");
      memoryUsers = (data.users || []).map((user) => ({
        id: user.id,
        username: user.username,
        role: normalizeRole(user.role),
        password: "",
      }));
      return listSync();
    }
    memoryUsers = readLocal();
    return listSync();
  }

  function findByUsername(username) {
    const key = String(username || "").trim().toLowerCase();
    return listSync().find((user) => user.username.toLowerCase() === key) || null;
  }

  async function createUser({ username, password, role }) {
    await ensureApi();
    const name = String(username || "").trim();
    const pass = String(password || "");
    const nextRole = normalizeRole(role);

    if (!name) throw new Error("Username is required.");
    if (name.length < 3) throw new Error("Username must be at least 3 characters.");
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
      throw new Error("Username can only use letters, numbers, . _ -");
    }
    if (!pass || pass.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    if (useApi) {
      const data = await apiRequest("create", {
        username: name,
        password: pass,
        role: nextRole,
      });
      await list();
      return data.user;
    }

    if (findByUsername(name)) {
      throw new Error("That username already exists.");
    }

    const users = readLocal();
    const user = {
      id: "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      username: name,
      password: pass,
      role: nextRole,
    };
    users.push(user);
    writeLocal(users);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  async function deleteUser(id, actorUsername) {
    await ensureApi();

    if (useApi) {
      await apiRequest("delete", {
        id,
        actorUsername: actorUsername || "",
      });
      await list();
      return;
    }

    const users = readLocal();
    const target = users.find((user) => user.id === id);
    if (!target) throw new Error("User not found.");
    if (target.username.toLowerCase() === String(actorUsername || "").toLowerCase()) {
      throw new Error("You cannot delete your own account.");
    }
    const admins = users.filter((user) => user.role === "admin").length;
    if (target.role === "admin" && admins <= 1) {
      throw new Error("At least one admin account is required.");
    }
    writeLocal(users.filter((user) => user.id !== id));
  }

  async function updateRole(id, role, actorUsername) {
    await ensureApi();
    const nextRole = normalizeRole(role);

    if (useApi) {
      const data = await apiRequest("updateRole", { id, role: nextRole });
      await list();
      if (
        window.SheetlineAuth &&
        String(actorUsername || "").toLowerCase() ===
          String(data.user.username || "").toLowerCase()
      ) {
        const session = window.SheetlineAuth.getSession();
        if (session) {
          window.SheetlineAuth.setSession(session.username, nextRole);
        }
      }
      return data.user;
    }

    const users = readLocal();
    const target = users.find((user) => user.id === id);
    if (!target) throw new Error("User not found.");
    if (target.role === nextRole) return { ...target, password: undefined };

    const admins = users.filter((user) => user.role === "admin").length;
    if (target.role === "admin" && nextRole !== "admin" && admins <= 1) {
      throw new Error("At least one admin account is required.");
    }

    target.role = nextRole;
    writeLocal(users);

    if (
      window.SheetlineAuth &&
      String(actorUsername || "").toLowerCase() === target.username.toLowerCase()
    ) {
      const session = window.SheetlineAuth.getSession();
      if (session) {
        window.SheetlineAuth.setSession(session.username, nextRole);
      }
    }

    return {
      id: target.id,
      username: target.username,
      role: target.role,
    };
  }

  async function validateLogin(username, password) {
    await ensureApi();

    if (useApi) {
      try {
        const data = await apiRequest("login", {
          username: String(username || "").trim(),
          password: String(password || ""),
        });
        return data.user;
      } catch (error) {
        if (error.status === 401) return null;
        throw error;
      }
    }

    const key = String(username || "").trim().toLowerCase();
    const user = readLocal().find((entry) => entry.username.toLowerCase() === key);
    if (!user) return null;
    if (user.password !== String(password || "")) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  function usingServer() {
    return useApi === true;
  }

  window.SheetlineUsers = {
    ready: ensureApi,
    list,
    listSync,
    createUser,
    deleteUser,
    updateRole,
    validateLogin,
    findByUsername,
    usingServer,
  };

  // Warm up API/local store early
  ensureApi().catch(() => {});
})();
