(function () {
  const DAY_SPAN = 10;
  const UI_REFRESH_MS = 5000;

  const allEl = document.getElementById("stat-all");
  const todayEl = document.getElementById("stat-today");
  const usersEl = document.getElementById("stat-users");
  const liveEl = document.getElementById("chart-live");
  const canvas = document.getElementById("items-by-date-chart");

  if (!window.SheetlineData || !canvas || typeof Chart === "undefined") return;

  let chart = null;
  let chartLabels = [];

  function formatAxisLabel(dateKey) {
    const parts = dateKey.split("-");
    if (parts.length !== 3) return dateKey;
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[month - 1]} ${day}`;
  }

  function chartColors() {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    return {
      total: {
        bar: dark ? "#3F83F8" : "#1A56DB",
        barHover: dark ? "#76A9FA" : "#1C64F2",
      },
      mail: {
        bar: dark ? "#34D399" : "#059669",
        barHover: dark ? "#6EE7B7" : "#10B981",
      },
      attachments: {
        bar: dark ? "#FBBF24" : "#D97706",
        barHover: dark ? "#FCD34D" : "#F59E0B",
      },
      tick: dark ? "rgba(156, 163, 175, 0.9)" : "rgba(107, 114, 128, 0.95)",
      grid: dark ? "rgba(55, 65, 81, 0.9)" : "rgba(229, 231, 235, 0.95)",
      legend: dark ? "rgba(209, 213, 219, 0.95)" : "rgba(55, 65, 81, 0.95)",
    };
  }

  function datasetStyle(colors, key) {
    const palette = colors[key];
    return {
      backgroundColor: palette.bar,
      hoverBackgroundColor: palette.barHover,
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 42,
    };
  }

  function updateStats() {
    const total = window.SheetlineData.getTotalCount();
    const totalMail = window.SheetlineData.getMailCount
      ? window.SheetlineData.getMailCount()
      : 0;
    const today = window.SheetlineData.getTodayCount();
    const todayMail = window.SheetlineData.getTodayMailCount
      ? window.SheetlineData.getTodayMailCount()
      : 0;

    if (allEl) allEl.textContent = total + " / " + totalMail;
    if (todayEl) todayEl.textContent = today + " / " + todayMail;
    if (usersEl) usersEl.textContent = String(window.SheetlineData.getUserCount());
  }

  function applyThemeToChart() {
    if (!chart) return;
    const colors = chartColors();
    chart.data.datasets.forEach((dataset, index) => {
      const key = ["total", "mail", "attachments"][index];
      const palette = colors[key];
      dataset.backgroundColor = palette.bar;
      dataset.hoverBackgroundColor = palette.barHover;
    });
    chart.options.scales.x.ticks.color = colors.tick;
    chart.options.scales.y.ticks.color = colors.tick;
    chart.options.scales.y.grid.color = colors.grid;
    chart.options.plugins.legend.labels.color = colors.legend;
    chart.update("none");
  }

  function buildChart() {
    const series = window.SheetlineData.getCountsByDate(DAY_SPAN);
    chartLabels = series.labels;
    const colors = chartColors();

    chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: series.labels.map(formatAxisLabel),
        datasets: [
          {
            label: "Total items",
            data: series.values,
            ...datasetStyle(colors, "total"),
          },
          {
            label: "With email",
            data: series.mailValues,
            ...datasetStyle(colors, "mail"),
          },
          {
            label: "With attachments",
            data: series.attachmentValues,
            ...datasetStyle(colors, "attachments"),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 450 },
        layout: { padding: { right: 8, top: 4 } },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              color: colors.legend,
              boxWidth: 12,
              boxHeight: 12,
              padding: 16,
              font: { family: "Inter, sans-serif", size: 12, weight: "500" },
            },
          },
          tooltip: {
            callbacks: {
              title(items) {
                const index = items[0] && items[0].dataIndex;
                return chartLabels[index] || "";
              },
              label(item) {
                const value = item.parsed.y || 0;
                return `${item.dataset.label}: ${value}`;
              },
            },
          },
        },
        scales: {
          x: {
            offset: true,
            grid: { display: false },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              color: colors.tick,
              font: { family: "Inter, sans-serif", size: 11, weight: "600" },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: colors.tick,
              font: { family: "Inter, sans-serif", size: 12 },
            },
            grid: { color: colors.grid },
          },
        },
      },
    });
  }

  function refreshChart() {
    if (!chart) return;

    const series = window.SheetlineData.getCountsByDate(DAY_SPAN);
    chartLabels = series.labels;
    chart.data.labels = series.labels.map(formatAxisLabel);
    chart.data.datasets[0].data = series.values;
    chart.data.datasets[1].data = series.mailValues;
    chart.data.datasets[2].data = series.attachmentValues;
    chart.update("none");

    if (liveEl) {
      liveEl.classList.remove("is-pulse");
      void liveEl.offsetWidth;
      liveEl.classList.add("is-pulse");
    }
  }

  function refreshAll() {
    updateStats();
    refreshChart();
  }

  function init() {
    updateStats();
    buildChart();
    window.setInterval(refreshAll, UI_REFRESH_MS);
    window.SheetlineData.onChange(refreshAll);

    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.setTimeout(applyThemeToChart, 0);
      });
    });

    const refreshBtn = document.getElementById("refresh-data-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        refreshBtn.disabled = true;
        try {
          await window.SheetlineData.reload();
          refreshAll();
        } catch (_) {
          refreshAll();
        } finally {
          refreshBtn.disabled = false;
        }
      });
    }
  }

  window.SheetlineData
    .load()
    .then(init)
    .catch(() => {
      init();
    });

  window.SheetlineDashboard = {
    refresh: refreshAll,
  };
})();
