Auth.requireLogin(["ADMIN", "RECEPTIONIST", "DOCTOR"]);
renderShell("patients.html");

(function applyRoleGates() {
  const role = Auth.getRole();
  document.querySelectorAll(".role-gated").forEach(el => {
    const allowed = (el.dataset.roles || "").split(",");
    el.style.display = allowed.includes(role) ? "inline-flex" : "none";
  });
})();

const canWrite = ["ADMIN", "RECEPTIONIST"].includes(Auth.getRole());
const canDelete = Auth.getRole() === "ADMIN";

let patients = [];

async function loadPatients() {
  try {
    const name = document.getElementById("filter-name").value || undefined;
    patients = await PatientApi.getAll({ name });
    renderRows();
  } catch (err) {
    handleApiError(err);
  }
}

function renderRows() {
  const tbody = document.getElementById("patient-rows");
  const emptyState = document.getElementById("empty-state");

  if (!patients.length) {
    tbody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  tbody.innerHTML = patients.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${p.age ?? "—"} ${p.gender ? "· " + escapeHtml(p.gender) : ""}</td>
      <td>${p.bloodGroup ? `<span class="pill pill-role">${escapeHtml(p.bloodGroup)}</span>` : "—"}</td>
      <td class="cell-mono">${escapeHtml(p.phone) || escapeHtml(p.email) || "—"}</td>
      <td>${escapeHtml(p.address) || "—"}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" onclick="openHistoryModal(${p.id}, '${escapeHtml(p.name).replace(/'/g, "\\'")}')">History</button>
          ${canWrite ? `<button class="btn btn-outline btn-sm" onclick="openEditModal(${p.id})">Edit</button>` : ""}
          ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="deletePatient(${p.id})">Delete</button>` : ""}
        </div>
      </td>
    </tr>
  `).join("");
}

function openCreateModal() {
  document.getElementById("modal-title").textContent = "New patient";
  document.getElementById("patient-form").reset();
  document.getElementById("pat-id").value = "";
  openModal("patient-modal");
}

function openEditModal(id) {
  const p = patients.find(x => x.id === id);
  if (!p) return;
  document.getElementById("modal-title").textContent = "Edit patient";
  document.getElementById("pat-id").value = p.id;
  document.getElementById("pat-name").value = p.name;
  document.getElementById("pat-age").value = p.age ?? "";
  document.getElementById("pat-gender").value = p.gender || "MALE";
  document.getElementById("pat-phone").value = p.phone || "";
  document.getElementById("pat-bloodgroup").value = p.bloodGroup || "";
  document.getElementById("pat-email").value = p.email || "";
  document.getElementById("pat-address").value = p.address || "";
  openModal("patient-modal");
}

async function deletePatient(id) {
  if (!confirm("Delete this patient? Their appointment history will also be removed.")) return;
  try {
    await PatientApi.remove(id);
    toast("Patient deleted", "success");
    loadPatients();
  } catch (err) {
    handleApiError(err);
  }
}

document.getElementById("patient-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("pat-id").value;
  const payload = {
    name: document.getElementById("pat-name").value.trim(),
    age: Number(document.getElementById("pat-age").value),
    gender: document.getElementById("pat-gender").value,
    phone: document.getElementById("pat-phone").value.trim(),
    bloodGroup: document.getElementById("pat-bloodgroup").value.trim(),
    email: document.getElementById("pat-email").value.trim(),
    address: document.getElementById("pat-address").value.trim(),
  };

  try {
    if (id) {
      await PatientApi.update(id, payload);
      toast("Patient updated", "success");
    } else {
      await PatientApi.create(payload);
      toast("Patient registered", "success");
    }
    closeModal("patient-modal");
    loadPatients();
  } catch (err) {
    handleApiError(err);
  }
});

let debounceTimer;
document.getElementById("filter-name").addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadPatients, 350);
});

loadPatients();

/* ---------------- Medical history timeline ---------------- */

async function openHistoryModal(patientId, patientName) {
  document.getElementById("history-title").textContent = `Medical history — ${patientName}`;
  const content = document.getElementById("history-content");
  content.innerHTML = `<p style="color:var(--muted);">Loading…</p>`;
  openModal("history-modal");

  try {
    const entries = await MedicalHistoryApi.getForPatient(patientId);

    if (!entries.length) {
      content.innerHTML = `<div class="empty-state" style="padding:20px 0;"><h3>No visits yet</h3><p>This patient has no appointment history.</p></div>`;
      return;
    }

    content.innerHTML = `<div class="timeline">${entries.map(timelineEntryHtml).join("")}</div>`;
  } catch (err) {
    content.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

function timelineEntryHtml(entry) {
  const dotClass = entry.status === "COMPLETED" ? "completed" : entry.status === "CANCELLED" ? "cancelled" : "";

  const items = entry.prescriptionItems || [];
  const rxHtml = items.length ? `
    <div class="rx-list">
      ${items.map(i => `
        <div class="rx-item">
          <span class="rx-name">${escapeHtml(i.medicineName)}</span>
          <span class="rx-meta">${escapeHtml(i.dosage) || ""} ${i.frequency ? "· " + escapeHtml(i.frequency) : ""} ${i.durationDays ? "· " + i.durationDays + "d" : ""}</span>
        </div>
      `).join("")}
      ${entry.prescriptionInstructions ? `<p style="margin-top:6px;font-size:.82rem;">${escapeHtml(entry.prescriptionInstructions)}</p>` : ""}
    </div>
  ` : "";

  return `
    <div class="timeline-entry">
      <div class="timeline-dot ${dotClass}"></div>
      <div class="timeline-header">
        <strong>${escapeHtml(entry.doctorName)}</strong>
        <span class="timeline-date">${formatDate(entry.appointmentDate)} · ${formatTime(entry.appointmentTime)}</span>
      </div>
      <div class="timeline-card">
        <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:4px;">
          <span style="font-size:.8rem; color:var(--muted);">${escapeHtml(entry.doctorSpecialization) || ""}</span>
          ${statusPill(entry.status)}
        </div>
        ${entry.reason ? `<p style="margin:4px 0 0 0;"><strong>Reason:</strong> ${escapeHtml(entry.reason)}</p>` : ""}
        ${entry.doctorNotes ? `<p style="margin:4px 0 0 0;"><strong>Notes:</strong> ${escapeHtml(entry.doctorNotes)}</p>` : ""}
        ${rxHtml}
      </div>
    </div>
  `;
}
