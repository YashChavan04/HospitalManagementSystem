Auth.requireLogin(["ADMIN", "RECEPTIONIST"]);
renderShell("doctors.html");
applyRoleGates();

function applyRoleGates() {
  const role = Auth.getRole();
  document.querySelectorAll(".role-gated").forEach(el => {
    el.style.display = (el.dataset.role === role) ? "inline-flex" : "none";
  });
}

let doctors = [];
let departments = [];

async function loadDepartmentsForFilters() {
  try {
    departments = await DepartmentApi.getAll();
    const filterSelect = document.getElementById("filter-department");
    const formSelect = document.getElementById("doc-department");

    departments.forEach(d => {
      filterSelect.insertAdjacentHTML("beforeend", `<option value="${d.id}">${escapeHtml(d.name)}</option>`);
      formSelect.insertAdjacentHTML("beforeend", `<option value="${d.id}">${escapeHtml(d.name)}</option>`);
    });
  } catch (err) {
    handleApiError(err);
  }
}

async function loadDoctors() {
  try {
    const departmentId = document.getElementById("filter-department").value || undefined;
    const specialization = document.getElementById("filter-specialization").value || undefined;
    doctors = await DoctorApi.getAll({ departmentId, specialization });
    renderRows();
  } catch (err) {
    handleApiError(err);
  }
}

function renderRows() {
  const tbody = document.getElementById("doctor-rows");
  const emptyState = document.getElementById("empty-state");
  const isAdmin = Auth.getRole() === "ADMIN";

  if (!doctors.length) {
    tbody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  tbody.innerHTML = doctors.map(d => `
    <tr>
      <td><strong>${escapeHtml(d.name)}</strong>${d.qualification ? `<div style="font-size:.78rem;color:var(--muted);">${escapeHtml(d.qualification)}</div>` : ""}</td>
      <td>${escapeHtml(d.specialization)}</td>
      <td>${escapeHtml(d.departmentName) || "—"}</td>
      <td class="cell-mono">${escapeHtml(d.phone) || escapeHtml(d.email) || "—"}</td>
      <td>${d.consultationFee != null ? "₹" + d.consultationFee : "—"}</td>
      <td>
        ${isAdmin ? `
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" onclick="openEditModal(${d.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDoctor(${d.id})">Delete</button>
        </div>` : ""}
      </td>
    </tr>
  `).join("");
}

function openCreateModal() {
  document.getElementById("modal-title").textContent = "New doctor";
  document.getElementById("doctor-form").reset();
  document.getElementById("doc-id").value = "";
  openModal("doctor-modal");
}

function openEditModal(id) {
  const doc = doctors.find(d => d.id === id);
  if (!doc) return;
  document.getElementById("modal-title").textContent = "Edit doctor";
  document.getElementById("doc-id").value = doc.id;
  document.getElementById("doc-name").value = doc.name;
  document.getElementById("doc-email").value = doc.email || "";
  document.getElementById("doc-phone").value = doc.phone || "";
  document.getElementById("doc-specialization").value = doc.specialization;
  document.getElementById("doc-qualification").value = doc.qualification || "";
  document.getElementById("doc-fee").value = doc.consultationFee ?? "";
  document.getElementById("doc-department").value = doc.departmentId || "";
  openModal("doctor-modal");
}

async function deleteDoctor(id) {
  if (!confirm("Delete this doctor? Their appointment history will also be removed.")) return;
  try {
    await DoctorApi.remove(id);
    toast("Doctor deleted", "success");
    loadDoctors();
  } catch (err) {
    handleApiError(err);
  }
}

document.getElementById("doctor-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("doc-id").value;
  const payload = {
    name: document.getElementById("doc-name").value.trim(),
    email: document.getElementById("doc-email").value.trim(),
    phone: document.getElementById("doc-phone").value.trim(),
    specialization: document.getElementById("doc-specialization").value.trim(),
    qualification: document.getElementById("doc-qualification").value.trim(),
    consultationFee: document.getElementById("doc-fee").value ? Number(document.getElementById("doc-fee").value) : null,
    departmentId: Number(document.getElementById("doc-department").value),
  };

  try {
    if (id) {
      await DoctorApi.update(id, payload);
      toast("Doctor updated", "success");
    } else {
      await DoctorApi.create(payload);
      toast("Doctor added", "success");
    }
    closeModal("doctor-modal");
    loadDoctors();
  } catch (err) {
    handleApiError(err);
  }
});

document.getElementById("filter-department").addEventListener("change", loadDoctors);
document.getElementById("filter-specialization").addEventListener("input", debounce(loadDoctors, 350));

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

(async () => {
  await loadDepartmentsForFilters();
  await loadDoctors();
})();
