Auth.requireLogin();
renderShell("dashboard.html");

document.getElementById("greeting").textContent = `Welcome back, ${Auth.getUsername()}`;

// Safety polyfill: roundRect() is fairly new to the Canvas API (2022+).
// Falls back to a plain rectangle on older browsers instead of throwing.
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) {
    this.rect(x, y, w, h);
    return this;
  };
}

function pulseSvg() {
  return `<svg width="90" height="46" viewBox="0 0 90 46" fill="none">
    <path d="M0 23 H28 L34 6 L42 40 L48 23 H90" stroke="currentColor" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

function statCard(label, value) {
  return `
    <div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-pulse">${pulseSvg()}</div>
    </div>
  `;
}

/* =========================================================
   Lightweight canvas charts - no external library.
   Everything below draws directly onto a <canvas> using the
   native 2D API, so there's no CDN dependency to fail.
   ========================================================= */

/** Prepares a canvas for crisp drawing at a fixed CSS height, returns {ctx, w, h}. */
function prepareCanvas(canvasId, cssHeight = 220) {
  const canvas = document.getElementById(canvasId);
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.parentElement.clientWidth;

  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  return { ctx, w: cssWidth, h: cssHeight };
}

function showEmptyChart(canvasId, message) {
  const canvas = document.getElementById(canvasId);
  const titleEl = canvas.parentElement.querySelector(".chart-title");
  const title = titleEl ? titleEl.textContent : "";
  canvas.parentElement.innerHTML = `<div class="chart-title">${title}</div><div class="chart-empty">${message}</div>`;
}

function truncateLabel(label, maxChars) {
  return label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
}

/** Vertical bar chart. labels/values are parallel arrays. */
function drawBarChart(canvasId, labels, values, color) {
  const { ctx, w, h } = prepareCanvas(canvasId);
  const padding = { top: 16, right: 10, bottom: 34, left: 30 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxVal = Math.max(...values, 1);
  const barGap = 14;
  const barWidth = (chartW - barGap * (values.length - 1)) / values.length;

  ctx.strokeStyle = "#e2dccb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartH);
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.stroke();

  ctx.font = "11px Inter, sans-serif";
  ctx.fillStyle = "#746c5e";
  ctx.textAlign = "right";
  // Dedupe tick values: with a small max (e.g. 1 or 2), the midpoint can
  // round to the same number as the top tick, showing "1" twice.
  const tickValues = [...new Set([0, Math.round(maxVal * 0.5), maxVal])];
  tickValues.forEach(val => {
    const y = padding.top + chartH - (val / maxVal) * chartH;
    ctx.fillText(val, padding.left - 8, y + 3);
  });

  values.forEach((val, i) => {
    const barH = maxVal === 0 ? 0 : (val / maxVal) * chartH;
    const x = padding.left + i * (barWidth + barGap);
    const y = padding.top + chartH - barH;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, 4);
    ctx.fill();

    ctx.fillStyle = "#1c2b27";
    ctx.textAlign = "center";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(val, x + barWidth / 2, y - 6);

    ctx.fillStyle = "#746c5e";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(truncateLabel(labels[i], 10), x + barWidth / 2, padding.top + chartH + 16);
  });
}

/** Horizontal bar chart - better for longer labels like doctor names. */
function drawHorizontalBarChart(canvasId, labels, values, color) {
  const rowH = 34;
  const { ctx, w, h } = prepareCanvas(canvasId, Math.max(140, labels.length * rowH + 20));
  const padding = { top: 10, right: 40, bottom: 10, left: 110 };
  const chartW = w - padding.left - padding.right;
  const maxVal = Math.max(...values, 1);

  labels.forEach((label, i) => {
    const y = padding.top + i * rowH;
    const barW = maxVal === 0 ? 0 : (values[i] / maxVal) * chartW;

    ctx.fillStyle = "#1c2b27";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(truncateLabel(label, 16), padding.left - 10, y + 18);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(padding.left, y + 6, Math.max(barW, 2), 18, 4);
    ctx.fill();

    ctx.fillStyle = "#1c2b27";
    ctx.textAlign = "left";
    ctx.fillText(values[i], padding.left + barW + 8, y + 18);
  });
}

/** Line chart with filled area under the line. */
function drawLineChart(canvasId, labels, values, color) {
  const { ctx, w, h } = prepareCanvas(canvasId);
  const padding = { top: 16, right: 24, bottom: 30, left: 30 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxVal = Math.max(...values, 1);

  const points = values.map((val, i) => ({
    x: padding.left + (chartW * i) / (values.length - 1 || 1),
    y: padding.top + chartH - (val / maxVal) * chartH,
  }));

  ctx.strokeStyle = "#e2dccb";
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartH);
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.stroke();

  // Filled area
  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = color + "22";
  ctx.fill();

  // Line
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Points + x labels
  ctx.font = "10px Inter, sans-serif";
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // The first/last labels sit exactly at the canvas edge - centering
    // the text there clips half of it off-screen, so anchor those two
    // to the inside edge instead of centering.
    ctx.fillStyle = "#746c5e";
    ctx.textAlign = i === 0 ? "left" : i === points.length - 1 ? "right" : "center";
    ctx.fillText(labels[i], p.x, padding.top + chartH + 18);
  });
}

/** Donut chart with a simple legend underneath. */
function drawDonutChart(canvasId, labels, values, colors) {
  const legendH = Math.ceil(labels.length / 2) * 20 + 10;
  const { ctx, w, h } = prepareCanvas(canvasId, 180 + legendH);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = w / 2, cy = 95, outerR = 75, innerR = 42;

  let startAngle = -Math.PI / 2;
  values.forEach((val, i) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    startAngle += sliceAngle;
  });

  // Cut out the middle to make it a donut
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Legend
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "left";
  const cols = 2;
  const colWidth = w / cols;
  labels.forEach((label, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * colWidth + 10;
    const y = 195 + row * 20;

    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, y - 9, 10, 10);
    ctx.fillStyle = "#1c2b27";
    ctx.fillText(`${label} (${values[i]})`, x + 16, y);
  });
}

async function loadDashboard() {
  try {
    const stats = await DashboardApi.getStats();

    document.getElementById("stat-grid").innerHTML =
      statCard("Total patients", stats.totalPatients) +
      statCard("Total doctors", stats.totalDoctors) +
      statCard("Departments", stats.totalDepartments) +
      statCard("Appointments today", stats.appointmentsToday);

    const order = ["SCHEDULED", "COMPLETED", "CANCELLED"];
    const breakdown = document.getElementById("status-breakdown");
    breakdown.innerHTML = order.map(status => {
      const count = stats.appointmentsByStatus[status] ?? 0;
      return `
        <div>
          <div style="margin-bottom:6px;">${statusPill(status)}</div>
          <div style="font-family:var(--font-display); font-size:1.6rem; font-weight:600; color:var(--primary-dark);">${count}</div>
        </div>
      `;
    }).join("");

    // 7-day trend
    const trendEntries = Object.entries(stats.appointmentsLast7Days);
    if (trendEntries.length) {
      const labels = trendEntries.map(([d]) => {
        const date = new Date(d + "T00:00:00");
        return date.toLocaleDateString(undefined, { weekday: "short" });
      });
      drawLineChart("chart-trend", labels, trendEntries.map(([, v]) => v), CHART_COLORS.primary);
    } else {
      showEmptyChart("chart-trend", "No appointment data yet.");
    }

    // Top doctors
    if (stats.topDoctors.length) {
      drawHorizontalBarChart("chart-doctors", stats.topDoctors.map(d => d.name), stats.topDoctors.map(d => d.count), CHART_COLORS.primary);
    } else {
      showEmptyChart("chart-doctors", "No appointments booked yet.");
    }

    // Department load
    const deptEntries = Object.entries(stats.appointmentsByDepartment);
    if (deptEntries.length) {
      drawBarChart("chart-departments", deptEntries.map(([n]) => n), deptEntries.map(([, v]) => v), CHART_COLORS.amber);
    } else {
      showEmptyChart("chart-departments", "No department data yet.");
    }

    // Gender split
    const genderEntries = Object.entries(stats.patientsByGender);
    if (genderEntries.length) {
      drawDonutChart("chart-gender", genderEntries.map(([g]) => g), genderEntries.map(([, v]) => v), CHART_COLORS.palette);
    } else {
      showEmptyChart("chart-gender", "No patients registered yet.");
    }

    // Peak hours
    const hourEntries = Object.entries(stats.peakHours);
    if (hourEntries.length) {
      drawBarChart("chart-hours", hourEntries.map(([hr]) => formatTime(hr + ":00")), hourEntries.map(([, v]) => v), CHART_COLORS.primaryDark);
    } else {
      showEmptyChart("chart-hours", "No appointment times recorded yet.");
    }

  } catch (err) {
    handleApiError(err);
  }
}

loadDashboard();

// Redraw on resize so bar/line widths stay correct (canvas doesn't auto-scale like SVG/CSS).
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(loadDashboard, 300);
});
