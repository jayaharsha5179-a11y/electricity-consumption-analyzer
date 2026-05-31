// ─── CHART INSTANCES ──────────────────────────────────────────────────────
let pieChartInstance = null;
let barChartInstance = null;

const CHART_COLORS = [
  "#f5c518", "#f97316", "#22c55e", "#3b82f6",
  "#a855f7", "#ef4444", "#06b6d4", "#ec4899",
  "#84cc16", "#f59e0b"
];

function getChartTheme() {
  const isLight = document.body.classList.contains("light");
  return {
    gridColor:  isLight ? "rgba(0,0,0,0.06)"  : "rgba(255,255,255,0.06)",
    textColor:  isLight ? "#6b6860"            : "#9c99a6",
    tooltipBg:  isLight ? "#ffffff"            : "#18181c",
    tooltipText:isLight ? "#1a1a1a"            : "#f0ede8"
  };
}

// ─── PIE CHART: Usage breakdown by appliance ─────────────────────────────
function renderPieChart(breakdown) {
  const ctx = document.getElementById("pieChart");
  const emptyEl = document.getElementById("pieEmpty");
  if (!ctx) return;

  const hasData = breakdown && breakdown.length > 0;
  if (emptyEl) emptyEl.classList.toggle("hidden", hasData);

  if (!hasData) {
    if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
    return;
  }

  const theme = getChartTheme();
  const labels = breakdown.map(a => a.name);
  const data   = breakdown.map(a => parseFloat(a.kwh.toFixed(2)));

  const config = {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderColor: document.body.classList.contains("light") ? "#f5f3ee" : "#0f0f11",
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: theme.textColor,
            font: { family: "'DM Sans', sans-serif", size: 11 },
            padding: 12,
            boxWidth: 12,
            boxHeight: 12
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipText,
          bodyColor: theme.textColor,
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} kWh`
          }
        }
      }
    }
  };

  if (pieChartInstance) {
    pieChartInstance.data.labels = labels;
    pieChartInstance.data.datasets[0].data = data;
    pieChartInstance.update();
  } else {
    pieChartInstance = new Chart(ctx, config);
  }
}

// ─── BAR CHART: Monthly trend ────────────────────────────────────────────
function renderBarChart(history) {
  const ctx = document.getElementById("barChart");
  const emptyEl = document.getElementById("barEmpty");
  if (!ctx) return;

  const hasData = history && history.length > 0;
  if (emptyEl) emptyEl.classList.toggle("hidden", hasData);

  if (!hasData) {
    if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
    return;
  }

  const theme = getChartTheme();
  const labels = history.map(h => h.month);
  const kwhs   = history.map(h => h.kwh);
  const maxKwh = Math.max(...kwhs);

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "kWh",
        data: kwhs,
        backgroundColor: kwhs.map(k =>
          k === maxKwh ? "#ef4444" : "#f5c518"
        ),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipText,
          bodyColor: theme.textColor,
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.raw} kWh`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { size: 11 } }
        },
        y: {
          grid: { color: theme.gridColor },
          ticks: {
            color: theme.textColor,
            font: { size: 11 },
            callback: v => v + " kWh"
          },
          beginAtZero: true
        }
      }
    }
  };

  if (barChartInstance) {
    barChartInstance.data.labels = labels;
    barChartInstance.data.datasets[0].data = kwhs;
    barChartInstance.data.datasets[0].backgroundColor = kwhs.map(k =>
      k === maxKwh ? "#ef4444" : "#f5c518"
    );
    barChartInstance.update();
  } else {
    barChartInstance = new Chart(ctx, config);
  }
}

// ─── LINE CHART: Trend with forecast (used on history page) ──────────────
function renderLineChart(canvasId, history, forecast) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const theme = getChartTheme();
  const labels = history.map(h => h.month);
  const actual = history.map(h => h.kwh);

  const datasets = [
    {
      label: "Actual kWh",
      data: actual,
      borderColor: "#f5c518",
      backgroundColor: "rgba(245,197,24,0.08)",
      borderWidth: 2,
      pointBackgroundColor: "#f5c518",
      pointRadius: 4,
      tension: 0.35,
      fill: true
    }
  ];

  if (forecast !== null) {
    const forecastData = [...actual.map(() => null), forecast];
    const forecastLabels = [...labels, "Next Month"];
    labels.push("Next →");
    datasets.push({
      label: "Forecast",
      data: [...actual.map((_, i) => i === actual.length - 1 ? actual[actual.length - 1] : null), forecast],
      borderColor: "#ef4444",
      borderDash: [5, 5],
      borderWidth: 2,
      pointBackgroundColor: "#ef4444",
      pointRadius: [0, 0, 0, 0, 0, 5],
      tension: 0.2,
      fill: false
    });
  }

  return new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: theme.textColor,
            font: { family: "'DM Sans', sans-serif", size: 12 }
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipText,
          bodyColor: theme.textColor,
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { size: 11 } }
        },
        y: {
          grid: { color: theme.gridColor },
          ticks: {
            color: theme.textColor,
            font: { size: 11 },
            callback: v => v + " kWh"
          },
          beginAtZero: true
        }
      }
    }
  });
}
