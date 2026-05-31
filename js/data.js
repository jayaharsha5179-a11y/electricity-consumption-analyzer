// ─── TARIFF SLABS ───────────────────────────────────────────────────────────
// Indian state EB tariff rates (₹ per unit = kWh)
// Structure: array of { upto: units, rate: ₹/kWh }
// "upto" means "for units consumed UP TO this value in the slab"
// Last slab applies to everything above the previous threshold

const TARIFFS = {
  "Andhra Pradesh": [
    { upto: 50,   rate: 1.45 },
    { upto: 100,  rate: 2.60 },
    { upto: 200,  rate: 3.76 },
    { upto: 300,  rate: 5.00 },
    { upto: 400,  rate: 6.00 },
    { upto: Infinity, rate: 7.00 }
  ],
  "Telangana": [
    { upto: 50,   rate: 1.45 },
    { upto: 100,  rate: 2.60 },
    { upto: 200,  rate: 3.76 },
    { upto: 300,  rate: 5.00 },
    { upto: Infinity, rate: 7.50 }
  ],
  "Tamil Nadu": [
    { upto: 100,  rate: 0.00 },
    { upto: 200,  rate: 1.50 },
    { upto: 500,  rate: 3.50 },
    { upto: Infinity, rate: 4.60 }
  ],
  "Karnataka": [
    { upto: 30,   rate: 3.15 },
    { upto: 100,  rate: 5.55 },
    { upto: 200,  rate: 6.45 },
    { upto: Infinity, rate: 7.20 }
  ],
  "Maharashtra": [
    { upto: 100,  rate: 3.46 },
    { upto: 300,  rate: 6.51 },
    { upto: 500,  rate: 9.07 },
    { upto: Infinity, rate: 10.92 }
  ],
  "Delhi": [
    { upto: 200,  rate: 3.00 },
    { upto: 400,  rate: 4.50 },
    { upto: 800,  rate: 6.50 },
    { upto: 1200, rate: 7.00 },
    { upto: Infinity, rate: 8.00 }
  ],
  "Gujarat": [
    { upto: 50,   rate: 2.05 },
    { upto: 150,  rate: 3.80 },
    { upto: 300,  rate: 5.45 },
    { upto: Infinity, rate: 6.50 }
  ],
  "West Bengal": [
    { upto: 75,   rate: 5.48 },
    { upto: 150,  rate: 6.28 },
    { upto: 250,  rate: 6.57 },
    { upto: Infinity, rate: 7.28 }
  ]
};

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────
const KEYS = {
  APPLIANCES: "eca_appliances",
  HISTORY:    "eca_history",
  SETTINGS:   "eca_settings",
  THEME:      "eca_theme"
};

// ─── APPLIANCE HELPERS ────────────────────────────────────────────────────
function getAppliances() {
  const raw = localStorage.getItem(KEYS.APPLIANCES);
  return raw ? JSON.parse(raw) : [];
}

function saveAppliances(list) {
  localStorage.setItem(KEYS.APPLIANCES, JSON.stringify(list));
}

function addAppliance(name, watts, hours, qty) {
  const list = getAppliances();
  list.push({
    id:    Date.now(),
    name:  name.trim(),
    watts: parseFloat(watts),
    hours: parseFloat(hours),
    qty:   parseInt(qty)
  });
  saveAppliances(list);
}

function deleteAppliance(id) {
  const list = getAppliances().filter(a => a.id !== id);
  saveAppliances(list);
}

function clearAppliances() {
  saveAppliances([]);
}

// ─── HISTORY HELPERS ──────────────────────────────────────────────────────
function getHistory() {
  const raw = localStorage.getItem(KEYS.HISTORY);
  return raw ? JSON.parse(raw) : [];
}

function saveMonthToHistory(monthLabel, kwh, bill) {
  const history = getHistory();
  const existing = history.findIndex(h => h.month === monthLabel);
  const entry = { month: monthLabel, kwh: parseFloat(kwh.toFixed(2)), bill: parseFloat(bill.toFixed(2)) };
  if (existing !== -1) {
    history[existing] = entry;
  } else {
    history.push(entry);
  }
  // Keep only last 12 months
  if (history.length > 12) history.shift();
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

// ─── SETTINGS HELPERS ─────────────────────────────────────────────────────
function getSettings() {
  const raw = localStorage.getItem(KEYS.SETTINGS);
  return raw ? JSON.parse(raw) : { state: "Andhra Pradesh", budget: 0 };
}

function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ─── THEME ────────────────────────────────────────────────────────────────
function toggleTheme() {
  const isDark = !document.body.classList.contains("light");
  document.body.classList.toggle("light", isDark);
  localStorage.setItem(KEYS.THEME, isDark ? "light" : "dark");
}

function applyTheme() {
  const saved = localStorage.getItem(KEYS.THEME);
  if (saved === "light") document.body.classList.add("light");
}

// ─── MOBILE MENU ──────────────────────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById("mobileNav").classList.toggle("open");
}

// ─── CURRENT MONTH LABEL ──────────────────────────────────────────────────
function getCurrentMonthLabel() {
  const now = new Date();
  return now.toLocaleString("default", { month: "short", year: "numeric" });
}

// Apply theme immediately on load
applyTheme();
