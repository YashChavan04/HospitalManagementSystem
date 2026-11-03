Auth.requireLogin(["ADMIN"]);
renderShell("departments.html");

let departments = [];

async function loadDepartments() {
  try {
    departments = await DepartmentApi.getAll();
    renderRows();
  } catch (err) {
    handleApiError(err);
  }
}

function renderRows() {
  const tbody = document.getElementById("department-rows");
  const emptyState = document.getElementById("empty-state");

  if (!departments.length) {
    tbody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  tbody.innerHTML = departments.map(d => `
    <tr>
      <td><strong>${escapeHtml(d.name)}</strong></td>
      <td>${escapeHtml(d.location) || "—"}</td>
      <td>${escapeHtml(d.description) || "—"}</td>
      <td>${d.doctorCount}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" onclick="openEditModal(${d.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDepartment(${d.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openCreateModal() {
  document.getElementById("modal-title").textContent = "New department";
  document.getElementById("department-form").reset();
  document.getElementById("dept-id").value = "";
  openModal("department-modal");
}

function openEditModal(id) {
  const dept = departments.find(d => d.id === id);
  if (!dept) return;
  document.getElementById("modal-title").textContent = "Edit department";
  document.getElementById("dept-id").value = dept.id;
  document.getElementById("dept-name").value = dept.name;
  document.getElementById("dept-location").value = dept.location || "";
  document.getElementById("dept-description").value = dept.description || "";
  openModal("department-modal");
}

async function deleteDepartment(id) {
  if (!confirm("Delete this department? Doctors assigned to it will be affected.")) return;
  try {
    await DepartmentApi.remove(id);
    toast("Department deleted", "success");
    loadDepartments();
  } catch (err) {
    handleApiError(err);
  }
}

document.getElementById("department-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("dept-id").value;
  const payload = {
    name: document.getElementById("dept-name").value.trim(),
    location: document.getElementById("dept-location").value.trim(),
    description: document.getElementById("dept-description").value.trim(),
  };

  try {
    if (id) {
      await DepartmentApi.update(id, payload);
      toast("Department updated", "success");
    } else {
      await DepartmentApi.create(payload);
      toast("Department created", "success");
    }
    closeModal("department-modal");
    loadDepartments();
  } catch (err) {
    handleApiError(err);
  }
});

loadDepartments();
