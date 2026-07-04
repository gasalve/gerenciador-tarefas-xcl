// URL base da API do back-end.
// Se você mudar a porta do back-end, ajuste aqui também.
const API_URL = "http://localhost:8000";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const formError = document.getElementById("form-error");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const loadingState = document.getElementById("loading-state");
const filterButtons = document.querySelectorAll(".filter-btn");

let currentFilter = "todas";

// ------------------------------------------------------------
// Carregar e renderizar tarefas
// ------------------------------------------------------------
async function loadTasks() {
  loadingState.hidden = false;
  emptyState.hidden = true;
  taskList.innerHTML = "";

  try {
    const query = currentFilter !== "todas" ? `?status=${encodeURIComponent(currentFilter)}` : "";
    const response = await fetch(`${API_URL}/tasks${query}`);

    if (!response.ok) throw new Error("Falha ao buscar tarefas");

    const tasks = await response.json();
    renderTasks(tasks);
  } catch (error) {
    loadingState.hidden = true;
    taskList.innerHTML = `<p class="empty-state">Não foi possível conectar ao servidor. Verifique se o back-end está rodando em ${API_URL}.</p>`;
    console.error(error);
  }
}

function renderTasks(tasks) {
  loadingState.hidden = true;

  if (tasks.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  taskList.innerHTML = tasks.map(taskToCardHTML).join("");

  // Liga os eventos dos botões recém-criados
  taskList.querySelectorAll("[data-toggle-id]").forEach((btn) => {
    btn.addEventListener("click", () => toggleStatus(btn.dataset.toggleId, btn.dataset.nextStatus));
  });
  taskList.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => deleteTask(btn.dataset.deleteId));
  });
}

function taskToCardHTML(task) {
  const isDone = task.status === "Concluída";
  const nextStatus = isDone ? "Pendente" : "Concluída";
  const nextLabel = isDone ? "Reabrir tarefa" : "Marcar como concluída";
  const description = task.description
    ? `<p class="task-card__desc">${escapeHTML(task.description)}</p>`
    : "";

  return `
    <li class="task-card">
      <span class="task-card__id">OS Nº ${String(task.id).padStart(4, "0")}</span>
      <div>
        <h3 class="task-card__title">${escapeHTML(task.title)}</h3>
        ${description}
      </div>
      <span class="task-card__stamp task-card__stamp--${task.status}">${task.status}</span>
      <div class="task-card__actions">
        <button type="button" data-toggle-id="${task.id}" data-next-status="${nextStatus}">${nextLabel}</button>
        <button type="button" class="danger" data-delete-id="${task.id}">Excluir</button>
      </div>
    </li>
  `;
}

// Evita que título/descrição digitados pelo usuário quebrem o HTML da página.
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ------------------------------------------------------------
// Criar tarefa
// ------------------------------------------------------------
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!title) {
    showFormError("O título é obrigatório.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    if (!response.ok) throw new Error("Falha ao criar tarefa");

    form.reset();
    await loadTasks();
  } catch (error) {
    showFormError("Não foi possível salvar a tarefa. Tente novamente.");
    console.error(error);
  }
});

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

// ------------------------------------------------------------
// Alterar status
// ------------------------------------------------------------
async function toggleStatus(id, nextStatus) {
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) throw new Error("Falha ao atualizar status");

    await loadTasks();
  } catch (error) {
    console.error(error);
  }
}

// ------------------------------------------------------------
// Excluir tarefa
// ------------------------------------------------------------
async function deleteTask(id) {
  const confirmed = confirm("Tem certeza que deseja excluir esta tarefa?");
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Falha ao excluir tarefa");
    await loadTasks();
  } catch (error) {
    console.error(error);
  }
}

// ------------------------------------------------------------
// Filtros
// ------------------------------------------------------------
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    currentFilter = btn.dataset.filter;
    loadTasks();
  });
});

// ------------------------------------------------------------
// Inicialização
// ------------------------------------------------------------
loadTasks();
