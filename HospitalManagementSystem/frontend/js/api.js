/* =========================================================
   api.js — single place that talks to the Spring Boot backend.
   Every other page/script calls the functions in this file
   instead of using fetch() directly.
   ========================================================= */

const API_BASE_URL = "http://localhost:8080";

/**
 * Decodes a JWT's payload (no signature verification - the backend
 * already verifies signatures; this is purely so the frontend can read
 * the "exp" claim to know when to proactively log the user out).
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const Auth = {
  getToken() { return localStorage.getItem("hms_token"); },
  getUsername() { return localStorage.getItem("hms_username"); },
  getRole() { return localStorage.getItem("hms_role"); },
  getDoctorId() { return localStorage.getItem("hms_doctorId"); },

  setSession({ token, username, role, doctorId }) {
    localStorage.setItem("hms_token", token);
    localStorage.setItem("hms_username", username);
    localStorage.setItem("hms_role", role);
    if (doctorId !== null && doctorId !== undefined) {
      localStorage.setItem("hms_doctorId", doctorId);
    } else {
      localStorage.removeItem("hms_doctorId");
    }
  },

  clearSession() {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_username");
    localStorage.removeItem("hms_role");
    localStorage.removeItem("hms_doctorId");
  },

  isLoggedIn() { return !!this.getToken(); },

  /** Returns the token's expiry as a millisecond timestamp, or null if unknown. */
  getExpiryMillis() {
    const token = this.getToken();
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    return (payload && payload.exp) ? payload.exp * 1000 : null;
  },

  isExpired() {
    const exp = this.getExpiryMillis();
    return exp !== null && Date.now() >= exp;
  },

  /**
   * Call at the top of every protected page. Redirects to the
   * login page if there is no token (or it has already expired),
   * and enforces which roles are allowed to view the page at all.
   * Also starts a background watcher so an idle tab logs itself
   * out the moment the session expires, instead of only noticing
   * on the next API call.
   */
  requireLogin(allowedRoles) {
    if (!this.isLoggedIn()) {
      window.location.href = "index.html";
      return;
    }
    if (this.isExpired()) {
      this.logout("Your session expired. Please log in again.");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(this.getRole())) {
      window.location.href = "dashboard.html";
      return;
    }
    this._startSessionWatcher();
  },

  _startSessionWatcher() {
    if (this._watcherStarted) return;
    this._watcherStarted = true;
    setInterval(() => {
      if (this.isLoggedIn() && this.isExpired()) {
        this.logout("Your session expired. Please log in again.");
      }
    }, 15000); // check every 15s - frequent enough to feel immediate, cheap enough to ignore
  },

  /**
   * @param {string} [reason] - shown as a banner on the login page after redirect.
   */
  logout(reason) {
    this.clearSession();
    if (reason) sessionStorage.setItem("hms_logout_reason", reason);
    window.location.href = "index.html";
  }
};

/**
 * Generic authenticated fetch wrapper.
 * Automatically attaches the JWT, parses JSON, and throws a
 * readable Error (using the backend's ApiErrorResponse message)
 * on any non-2xx response.
 */
async function apiFetch(path, { method = "GET", body = null, query = null } = {}) {

  let url = API_BASE_URL + path;

  if (query) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    if (params.length) url += "?" + params.join("&");
  }

  const headers = { "Content-Type": "application/json" };
  const token = Auth.getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkErr) {
    throw new Error(
      "Could not reach the server at " + API_BASE_URL +
      ". Is the Spring Boot application running?"
    );
  }

  // 401 anywhere in the app -> session is dead, send back to login
  if (response.status === 401) {
    Auth.logout("Your session expired. Please log in again.");
    throw new Error("Session expired. Please log in again.");
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = (data && data.message) ? data.message : (text || response.statusText);
    throw new Error(message);
  }

  return data;
}

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return text; }
}

/* ---------------- Domain-specific API calls ---------------- */

const AuthApi = {
  login: (username, password) =>
    apiFetch("/auth/login", { method: "POST", body: { username, password } }),
  register: (payload) =>
    apiFetch("/auth/register", { method: "POST", body: payload }),
};

const DepartmentApi = {
  getAll: () => apiFetch("/api/departments"),
  getById: (id) => apiFetch(`/api/departments/${id}`),
  create: (payload) => apiFetch("/api/departments", { method: "POST", body: payload }),
  update: (id, payload) => apiFetch(`/api/departments/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/departments/${id}`, { method: "DELETE" }),
};

const DoctorApi = {
  getAll: (filters) => apiFetch("/api/doctors", { query: filters }),
  getById: (id) => apiFetch(`/api/doctors/${id}`),
  create: (payload) => apiFetch("/api/doctors", { method: "POST", body: payload }),
  update: (id, payload) => apiFetch(`/api/doctors/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/doctors/${id}`, { method: "DELETE" }),
};

const PatientApi = {
  getAll: (filters) => apiFetch("/api/patients", { query: filters }),
  getById: (id) => apiFetch(`/api/patients/${id}`),
  create: (payload) => apiFetch("/api/patients", { method: "POST", body: payload }),
  update: (id, payload) => apiFetch(`/api/patients/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/patients/${id}`, { method: "DELETE" }),
};

const AppointmentApi = {
  getAll: (filters) => apiFetch("/api/appointments", { query: filters }),
  getById: (id) => apiFetch(`/api/appointments/${id}`),
  create: (payload) => apiFetch("/api/appointments", { method: "POST", body: payload }),
  updateStatus: (id, payload) => apiFetch(`/api/appointments/${id}/status`, { method: "PUT", body: payload }),
  remove: (id) => apiFetch(`/api/appointments/${id}`, { method: "DELETE" }),
};

const DashboardApi = {
  getStats: () => apiFetch("/api/dashboard/stats"),
};

const PrescriptionApi = {
  getByAppointment: (appointmentId) => apiFetch(`/api/appointments/${appointmentId}/prescription`),
  save: (appointmentId, payload) =>
    apiFetch(`/api/appointments/${appointmentId}/prescription`, { method: "POST", body: payload }),
};

const MedicalHistoryApi = {
  getForPatient: (patientId) => apiFetch(`/api/patients/${patientId}/medical-history`),
};
