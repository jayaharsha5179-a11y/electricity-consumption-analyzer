// ─── CORE CALCULATOR ──────────────────────────────────────────────────────
// All energy math lives here. Pure functions — no DOM, no side effects.

/**
 * Calculate monthly kWh for a single appliance.
 * Formula: (Watts × Hours/day × 30 days × Quantity) / 1000
 */
function calcApplianceKwh(watts, hoursPerDay, qty, days = 30) {
  return (watts * hoursPerDay * days * qty) / 1000;
}

/**
 * Calculate monthly kWh for ALL appliances.
 * Returns total and a breakdown array.
 */
function calcTotalKwh(appliances) {
  let total = 0;
  const breakdown = appliances.map(a => {
    const kwh = calcApplianceKwh(a.watts, a.hours, a.qty);
    total += kwh;
    return { ...a, kwh };
  });
  return { total, breakdown };
}

/**
 * Calculate electricity bill using slab-based tariff.
 * Slabs are applied progressively (like income tax brackets).
 *
 * Example for 250 units with AP tariff:
 *   First  50 units × 1.45 = ₹72.50
 *   Next   50 units × 2.60 = ₹130.00   (51–100)
 *   Next  100 units × 3.76 = ₹376.00   (101–200)
 *   Next   50 units × 5.00 = ₹250.00   (201–250)
 *   Total = ₹828.50
 */
function calcBill(units, slabs) {
  let bill = 0;
  let remaining = units;
  let prev = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabSize = slab.upto === Infinity ? remaining : slab.upto - prev;
    const consumed = Math.min(remaining, slabSize);
    bill += consumed * slab.rate;
    remaining -= consumed;
    prev = slab.upto === Infinity ? prev : slab.upto;
  }

  return bill;
}

/**
 * Get slab breakdown for display on billing page.
 * Returns array of { label, units, rate, cost }.
 */
function getSlabBreakdown(units, slabs) {
  const rows = [];
  let remaining = units;
  let prev = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabSize = slab.upto === Infinity ? remaining : slab.upto - prev;
    const consumed = Math.min(remaining, slabSize);
    const cost = consumed * slab.rate;
    const label = slab.upto === Infinity
      ? `Above ${prev} units`
      : `${prev + 1} – ${slab.upto} units`;

    rows.push({
      label,
      units: consumed,
      rate: slab.rate,
      cost
    });

    remaining -= consumed;
    prev = slab.upto === Infinity ? prev : slab.upto;
  }

  return rows;
}

/**
 * Simple linear forecast: predict next month's kWh.
 * Uses the last N months of history and fits a trend line.
 * Returns predicted value (or null if not enough data).
 */
function forecastNextMonth(history) {
  const data = history.slice(-6); // use up to last 6 months
  if (data.length < 2) return null;

  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  data.forEach((d, i) => {
    sumX  += i;
    sumY  += d.kwh;
    sumXY += i * d.kwh;
    sumX2 += i * i;
  });

  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const predicted = slope * n + intercept;

  return Math.max(0, Math.round(predicted * 100) / 100);
}

/**
 * Detect anomaly: returns true if current month is >20% above 3-month average.
 */
function isAnomaly(history, currentKwh) {
  const recent = history.slice(-3);
  if (recent.length < 2) return false;
  const avg = recent.reduce((s, h) => s + h.kwh, 0) / recent.length;
  return currentKwh > avg * 1.20;
}

/**
 * Calculate % share of each appliance in total.
 */
function calcShares(breakdown, total) {
  return breakdown.map(a => ({
    ...a,
    share: total > 0 ? Math.round((a.kwh / total) * 100) : 0
  }));
}

/**
 * Generate rule-based saving tips based on appliances and their shares.
 */
function generateTips(breakdown, total) {
  const tips = [];

  breakdown.forEach(a => {
    const share = total > 0 ? (a.kwh / total) * 100 : 0;

    if (share > 30) {
      tips.push({
        icon: "⚠",
        level: "high",
        text: `${a.name} uses ${share.toFixed(0)}% of your electricity. Consider reducing its daily usage.`
      });
    }

    if (a.hours > 18) {
      tips.push({
        icon: "⏰",
        level: "medium",
        text: `${a.name} runs ${a.hours} hours/day. Use a timer or smart plug to optimize usage.`
      });
    }

    const nameLower = a.name.toLowerCase();
    if (nameLower.includes("ac") || nameLower.includes("air condition")) {
      const savings = calcApplianceKwh(a.watts, 2, a.qty);
      const slabs = TARIFFS[getSettings().state];
      const billSavings = slabs ? calcBill(savings, slabs) : savings * 5;
      tips.push({
        icon: "❄",
        level: "medium",
        text: `Reducing AC usage by 2 hours/day could save ~${savings.toFixed(1)} kWh/month (~₹${billSavings.toFixed(0)}).`
      });
    }

    if (nameLower.includes("geyser") || nameLower.includes("water heater")) {
      tips.push({
        icon: "🚿",
        level: "medium",
        text: `Your ${a.name} is a major energy consumer. A solar water heater can reduce this to near zero.`
      });
    }

    if (nameLower.includes("bulb") || nameLower.includes("tube") || nameLower.includes("light")) {
      if (a.watts > 20) {
        tips.push({
          icon: "💡",
          level: "low",
          text: `Replace ${a.name} with LED equivalents. LEDs use 5–9W vs ${a.watts}W and last 10x longer.`
        });
      }
    }
  });

  // General tips if no specific ones triggered
  if (tips.length === 0) {
    tips.push({ icon: "✔", level: "low", text: "Your usage looks balanced! Keep monitoring monthly trends." });
    tips.push({ icon: "🌿", level: "low", text: "Consider using appliances during off-peak hours (10 PM – 6 AM) if your tariff varies by time." });
  }

  tips.push({ icon: "📅", level: "low", text: "Save your monthly reading before the billing date to track trends accurately." });

  return tips;
}
