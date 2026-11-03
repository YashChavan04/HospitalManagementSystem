Auth.requireLogin(["ADMIN", "RECEPTIONIST", "DOCTOR"]);
renderShell("appointments.html");

const role = Auth.getRole();
const canBook = ["ADMIN", "RECEPTIONIST"].includes(role);
const canDelete = ["ADMIN", "RECEPTIONIST"].includes(role);
const canUpdateStatus = ["ADMIN", "RECEPTIONIST", "DOCTOR"].includes(role);
const canPrescribe = ["ADMIN", "DOCTOR"].includes(role);

(function applyRoleGates() {
  document.querySelectorAll(".role-gated").forEach(el => {
    const allowed = (el.dataset.roles || "").split(",");
    el.style.display = allowed.includes(role) ? "inline-flex" : "none";
  });
})();

let appointments = [];
let patients = [];
let doctors = [];

const PRIORITY_RANK = { CRITICAL: 0, URGENT: 1, ROUTINE: 2 };

async function loadLookups() {
  try {
    [patients, doctors] = await Promise.all([PatientApi.getAll(), DoctorApi.getAll()]);
    const patientSelect = document.getElementById("apt-patient");
    const doctorSelect = document.getElementById("apt-doctor");
    patients.forEach(p => patientSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${escapeHtml(p.name)}</option>`));
    doctors.forEach(d => doctorSelect.insertAdjacentHTML("beforeend", `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.specialization)}</option>`));
  } catch (err) {
    handleApiError(err);
  }
}

async function loadAppointments() {
  try {
    const status = document.getElementById("filter-status").value || undefined;
    const date = document.getElementById("filter-date").value || undefined;

    let filters = { status, date };
    // A doctor account only ever sees their own appointments.
    if (role === "DOCTOR") {
      const doctorId = Auth.getDoctorId();
      if (doctorId) filters.doctorId = doctorId;
    }

    appointments = await AppointmentApi.getAll(filters);
    renderRows();
  } catch (err) {
    handleApiError(err);
  }
}

function renderRows() {
  const tbody = document.getElementById("appointment-rows");
  const emptyState = document.getElementById("empty-state");

  if (!appointments.length) {
    tbody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  // Critical cases first, then urgent, then routine; within the same
  // priority, earliest date/time first - this is the triage queue view.
  const sorted = [...appointments].sort((a, b) => {
    const rankDiff = (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2);
    if (rankDiff !== 0) return rankDiff;
    return (a.appointmentDate + a.appointmentTime).localeCompare(b.appointmentDate + b.appointmentTime);
  });

  tbody.innerHTML = sorted.map(a => `
    <tr class="${a.priority === "CRITICAL" ? "priority-critical-row" : ""}">
      <td>
        <div>${formatDate(a.appointmentDate)}</div>
        <div class="cell-mono">${formatTime(a.appointmentTime)}</div>
      </td>
      <td>${escapeHtml(a.patientName)}</td>
      <td>${escapeHtml(a.doctorName)}<div style="font-size:.78rem;color:var(--muted);">${escapeHtml(a.doctorSpecialization) || ""}</div></td>
      <td style="max-width:200px;">${escapeHtml(a.reason) || "—"}</td>
      <td>${priorityPill(a.priority)}</td>
      <td>${statusPill(a.status)}${a.hasPrescription ? '<div style="font-size:.72rem;color:var(--primary);margin-top:4px;">Rx on file</div>' : ""}</td>
      <td>
        <div class="row-actions">
          ${canPrescribe ? `<button class="btn btn-outline btn-sm" onclick="openPrescriptionModal(${a.id})">Rx</button>` : ""}
          ${canUpdateStatus ? `<button class="btn btn-outline btn-sm" onclick="openStatusModal(${a.id})">Update</button>` : ""}
          ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="deleteAppointment(${a.id})">Delete</button>` : ""}
        </div>
      </td>
    </tr>
  `).join("");
}

function openCreateModal() {
  document.getElementById("appointment-error").classList.remove("show");
  document.getElementById("appointment-form").reset();
  // default date = today
  document.getElementById("apt-date").value = new Date().toISOString().slice(0, 10);
  openModal("appointment-modal");
}

function openStatusModal(id) {
  const a = appointments.find(x => x.id === id);
  if (!a) return;
  document.getElementById("status-apt-id").value = a.id;
  document.getElementById("status-value").value = a.status;
  document.getElementById("status-notes").value = a.doctorNotes || "";
  openModal("status-modal");
}

async function deleteAppointment(id) {
  if (!confirm("Delete this appointment record?")) return;
  try {
    await AppointmentApi.remove(id);
    toast("Appointment deleted", "success");
    loadAppointments();
  } catch (err) {
    handleApiError(err);
  }
}

document.getElementById("appointment-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const banner = document.getElementById("appointment-error");
  banner.classList.remove("show");

  const payload = {
    patientId: Number(document.getElementById("apt-patient").value),
    doctorId: Number(document.getElementById("apt-doctor").value),
    appointmentDate: document.getElementById("apt-date").value,
    appointmentTime: document.getElementById("apt-time").value,
    reason: document.getElementById("apt-reason").value.trim(),
    priority: document.getElementById("apt-priority").value,
  };

  try {
    await AppointmentApi.create(payload);
    toast("Appointment booked", "success");
    closeModal("appointment-modal");
    loadAppointments();
  } catch (err) {
    // Surfaces the backend's double-booking conflict message (HTTP 409) inline.
    banner.textContent = err.message;
    banner.classList.add("show");
  }
});

document.getElementById("status-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("status-apt-id").value;
  const payload = {
    status: document.getElementById("status-value").value,
    doctorNotes: document.getElementById("status-notes").value.trim(),
  };
  try {
    await AppointmentApi.updateStatus(id, payload);
    toast("Appointment updated", "success");
    closeModal("status-modal");
    loadAppointments();
  } catch (err) {
    handleApiError(err);
  }
});

document.getElementById("filter-status").addEventListener("change", loadAppointments);
document.getElementById("filter-date").addEventListener("change", loadAppointments);

function clearFilters() {
  document.getElementById("filter-status").value = "";
  document.getElementById("filter-date").value = "";
  loadAppointments();
}

/* ---------------- Prescriptions ---------------- */

function medRowTemplate(item = {}) {
  return `
    <div class="med-row">
      <input type="text" class="rx-medicine" placeholder="Medicine name" value="${escapeHtml(item.medicineName) || ""}" required>
      <input type="text" class="rx-dosage" placeholder="Dosage (500mg)" value="${escapeHtml(item.dosage) || ""}">
      <input type="text" class="rx-frequency" placeholder="Frequency" value="${escapeHtml(item.frequency) || ""}">
      <input type="number" class="rx-duration" placeholder="Days" min="1" value="${item.durationDays ?? ""}">
      <button type="button" class="med-row-remove" onclick="this.closest('.med-row').remove()" title="Remove">&times;</button>
    </div>
  `;
}

function addMedRow(item) {
  document.getElementById("rx-med-rows").insertAdjacentHTML("beforeend", medRowTemplate(item));
}

async function openPrescriptionModal(appointmentId) {
  document.getElementById("rx-appointment-id").value = appointmentId;
  document.getElementById("rx-med-rows").innerHTML = "";
  document.getElementById("rx-instructions").value = "";

  try {
    const rx = await PrescriptionApi.getByAppointment(appointmentId);
    document.getElementById("rx-instructions").value = rx.generalInstructions || "";
    if (rx.items && rx.items.length) {
      rx.items.forEach(item => addMedRow(item));
    } else {
      addMedRow();
    }
  } catch {
    // No prescription yet for this appointment - start with one blank row.
    addMedRow();
  }

  openModal("prescription-modal");
}

document.getElementById("prescription-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const appointmentId = document.getElementById("rx-appointment-id").value;

  const items = Array.from(document.querySelectorAll("#rx-med-rows .med-row"))
    .map(row => ({
      medicineName: row.querySelector(".rx-medicine").value.trim(),
      dosage: row.querySelector(".rx-dosage").value.trim(),
      frequency: row.querySelector(".rx-frequency").value.trim(),
      durationDays: row.querySelector(".rx-duration").value ? Number(row.querySelector(".rx-duration").value) : null,
    }))
    .filter(item => item.medicineName);

  const payload = {
    generalInstructions: document.getElementById("rx-instructions").value.trim(),
    items,
  };

  try {
    await PrescriptionApi.save(appointmentId, payload);
    toast("Prescription saved", "success");
    closeModal("prescription-modal");
    loadAppointments();
  } catch (err) {
    handleApiError(err);
  }
});

(async () => {
  if (canBook) await loadLookups();
  await loadAppointments();
})();
