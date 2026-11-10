// Change these credentials before publishing.
window.SHEETLINE_CONFIG = {
  siteName: "Sheetline",
  users: [
    {
      username: "admin",
      password: "sheetline2026",
      role: "admin",
    },
    {
      username: "viewer",
      password: "viewer2026",
      role: "user",
    },
  ],
  sessionHours: 12,
  sheet: {
    id: "1HBzA_sXfoafqfKv60W-Ha80kqaGcBe7AEDAdyGWNY54",
    gid: "0",
    // Local fallback if Google is unreachable
    localCsv: "data/sheet.csv",
    refreshMs: 60000,
    pageSize: 20,
  },
};
