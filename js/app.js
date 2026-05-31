// ─── DASHBOARD MAIN ───────────────────────────────────────────────────────

function refreshDashboard() {
  const appliances = getAppliances();
  const settings   = getSettings();
  const slabs      = TARIFFS[settings.state] || TARIFFS["Andhra Pradesh"];
  const history    = getHistory();

  const { total, breakdown } = calcTotalKwh(appliances);
  const withShares = calcShares(breakdown, total);
  const bill = calcBill(total, slabs);
  const dailyAvg = total / 30;

  // ── Stat cards
  document.getElementById("totalKwh").innerHTML =
    `${total.toFixed(1)} <span class="stat-unit">kWh</span>`;
  document.getElementById("totalBill").textContent = "₹" + bill.toFixed(0);
  document.getElementById("dailyAvg").innerHTML =
    `${dailyAvg.toFixed(2)} <span class="stat-unit">kWh</span>`;
  document.getElementById("applianceCount").textContent = appliances.length;

  // Month badge
  document.getElementById("currentMonthBadge").textContent =
    `${total.toFixed(1)} kWh — ${getCurrentMonthLabel()}`;

  // Bill note
  const anomaly = isAnomaly(history, total);
  document.getElementById("billNote").textContent =
    anomaly ? "⚠ Higher than usual!" : `${settings.state} EB tariff`;
  document.getElementById("kwhNote").textContent =
    appliances.length === 0 ? "Add appliances to calculate"
    : `${appliances.length} appliance${appliances.length > 1 ? "s" : ""} tracked`;

  // Top appliance
  if (appliances.length > 0) {
    const top = [...withShares].sort((a, b) => b.kwh - a.kwh)[0];
    document.getElementById("topAppliance").textContent =
      `Top: ${top.name} (${top.share}%)`;
  } else {
    document.getElementById("topAppliance").textContent = "None added yet";
  }

  // ── Table
  renderApplianceTable(withShares, total);

  // ── Charts
  renderPieChart(withShares);
  renderBarChart(history);
}

// ─── APPLIANCE TABLE ──────────────────────────────────────────────────────
function renderApplianceTable(withShares, total) {
  const tbody = document.getElementById("applianceTableBody");
  const emptyRow = document.getElementById("emptyRow");
  if (!tbody) return;

  // Remove old rows (keep emptyRow)
  Array.from(tbody.querySelectorAll("tr:not(#emptyRow)")).forEach(r => r.remove());

  if (withShares.length === 0) {
    if (emptyRow) emptyRow.style.display = "";
    return;
  }

  if (emptyRow) emptyRow.style.display = "none";

  withShares.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${a.name}</strong></td>
      <td>${a.watts}W</td>
      <td>${a.hours}h</td>
      <td>${a.qty}</td>
      <td class="kwh-cell">${a.kwh.toFixed(1)}</td>
      <td>
        <div class="share-bar">
          <div class="share-bar-fill" style="width:${Math.max(a.share, 2)}px"></div>
          <span class="share-text">${a.share}%</span>
        </div>
      </td>
      <td>
        <button class="btn-delete" onclick="removeAppliance(${a.id})" title="Remove">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────
function quickAddAppliance() {
  const name  = document.getElementById("appName").value.trim();
  const watts = parseFloat(document.getElementById("appWatts").value);
  const hours = parseFloat(document.getElementById("appHours").value);
  const qty   = parseInt(document.getElementById("appQty").value) || 1;
  const msg   = document.getElementById("quickAddMsg");

  // Validation
  if (!name) { showMsg(msg, "Please enter an appliance name.", true); return; }
  if (!watts || watts <= 0) { showMsg(msg, "Enter a valid wattage (e.g. 75).", true); return; }
  if (!hours || hours <= 0 || hours > 24) { showMsg(msg, "Hours must be between 0.1 and 24.", true); return; }

  addAppliance(name, watts, hours, qty);
  showMsg(msg, `✔ ${name} added successfully!`, false);

  // Clear form
  document.getElementById("appName").value  = "";
  document.getElementById("appWatts").value = "";
  document.getElementById("appHours").value = "";
  document.getElementById("appQty").value   = "1";

  refreshDashboard();
}

function removeAppliance(id) {
  deleteAppliance(id);
  refreshDashboard();
}

function clearAllAppliances() {
  if (confirm("Clear all appliances? This cannot be undone.")) {
    clearAppliances();
    refreshDashboard();
  }
}

function showMsg(el, text, isError) {
  el.textContent = text;
  el.className   = "form-message" + (isError ? " error" : "");
  setTimeout(() => { el.textContent = ""; }, 3000);
}

// ─── ENTER KEY on form ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  ["appName","appWatts","appHours","appQty"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("keydown", e => {
      if (e.key === "Enter") quickAddAppliance();
    });
  });
  refreshDashboard();
});
