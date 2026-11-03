/* =========================================================
   ui.js — shared chrome (sidebar) + small UI utilities used
   across every page: toasts, modal open/close, formatting.
   ========================================================= */

const NAV_ITEMS = [
  { href: "dashboard.html", label: "Dashboard", icon: iconGrid(), roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"] },
  { href: "patients.html", label: "Patients", icon: iconUser(), roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"] },
  { href: "doctors.html", label: "Doctors", icon: iconStethoscope(), roles: ["ADMIN", "RECEPTIONIST"] },
  { href: "departments.html", label: "Departments", icon: iconLayers(), roles: ["ADMIN"] },
  { href: "appointments.html", label: "Appointments", icon: iconCalendar(), roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"] },
];

function renderShell(activePage) {
  const role = Auth.getRole();
  const username = Auth.getUsername();

  const navHtml = NAV_ITEMS
    .filter(item => item.roles.includes(role))
    .map(item => `
      <a class="nav-tab ${item.href === activePage ? "active" : ""}" href="${item.href}">
        ${item.icon} ${item.label}
      </a>
    `).join("");

  const initials = (username || "?").slice(0, 2).toUpperCase();

  document.getElementById("sidebar-mount").innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        ${brandMark(22)}
        <div>
          <div class="brand-name">MediTrack</div>
          <div class="brand-sub">Hospital System</div>
        </div>
      </div>
      <nav>${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="user-avatar">${initials}</div>
          <div class="user-meta">
            <div class="user-name">${username || ""}</div>
            <div class="user-role">${role || ""}</div>
          </div>
        </div>
        <button class="logout-link" onclick="Auth.logout()">Log out</button>
      </div>
    </aside>
  `;
}

/* ---------------- Icons (small inline SVGs, no external deps) ---------------- */
function iconGrid() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.2" stroke="currentColor" stroke-width="1.4"/></svg>`;
}
function iconUser() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.6" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 14c.8-2.8 3-4.2 5.5-4.2s4.7 1.4 5.5 4.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
}
function iconStethoscope() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2v4a3 3 0 006 0V2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M7 9v1.5a4 4 0 004 4c1.8 0 3-1.2 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="14" cy="11.4" r="1.1" stroke="currentColor" stroke-width="1.2"/></svg>`;
}
function iconLayers() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5 14.5 5 8 8.5 1.5 5 8 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M1.5 8 8 11.5 14.5 8" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M1.5 11 8 14.5 14.5 11" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
}
function iconCalendar() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.8" width="13" height="11.2" rx="1.4" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 6.2h13M5 1.3v2.6M11 1.3v2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
}
function brandMark(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#C97A2B"/>
    <path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}
function pulseLineSvg(width, height, color) {
  return `<svg class="pulse-line" width="${width}" height="${height}" viewBox="0 0 400 60" fill="none">
    <path d="M0 30 H130 L150 8 L170 52 L190 30 H400" stroke="${color}" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

/* ---------------- Toasts ---------------- */
function ensureToastContainer() {
  let el = document.getElementById("toast-container");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast-container";
    document.body.appendChild(el);
  }
  return el;
}
function toast(message, type = "info") {
  const container = ensureToastContainer();
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ---------------- Modal ---------------- */
function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

/* ---------------- Formatting ---------------- */
function formatDate(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(isoTime) {
  if (!isoTime) return "—";
  const [h, m] = isoTime.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${m} ${suffix}`;
}
function statusPill(status) {
  const cls = status === "COMPLETED" ? "pill-completed"
            : status === "CANCELLED" ? "pill-cancelled"
            : "pill-scheduled";
  return `<span class="pill ${cls}">${status}</span>`;
}
function priorityPill(priority) {
  const p = priority || "ROUTINE";
  const cls = p === "CRITICAL" ? "pill-priority-critical"
            : p === "URGENT" ? "pill-priority-urgent"
            : "pill-priority-routine";
  return `<span class="pill ${cls}">${p}</span>`;
}
/** Chart.js palette matching the app's design tokens (kept in one place). */
const CHART_COLORS = {
  primary: "#2f6f62",
  primaryDark: "#1f4d43",
  amber: "#c97a2b",
  danger: "#b23a3a",
  success: "#3f7d5c",
  muted: "#a89f8b",
  palette: ["#2f6f62", "#c97a2b", "#b23a3a", "#6b9080", "#e0a458", "#8d5b4c"]
};
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function handleApiError(err) {
  console.error(err);
  toast(err.message || "Something went wrong", "error");
}
