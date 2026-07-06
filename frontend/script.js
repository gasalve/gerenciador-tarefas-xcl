// url do backend - muda aqui se trocar a porta
const API_URL = "http://localhost:8000";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const formError = document.getElementById("form-error");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const loadingState = document.getElementById("loading-state");
const filterButtons = document.querySelectorAll(".filter-btn");

const confirmModal = document.getElementById("confirm-modal");
const confirmModalMessage = document.getElementById("confirm-modal-message");
const confirmModalCancel = document.getElementById("confirm-modal-cancel");
const confirmModalConfirm = document.getElementById("confirm-modal-confirm");

const filterLabels = {
  todas: "Todas",
  Pendente: "Pendentes",
  "Concluída": "Concluídas",
};

let currentFilter = "todas";
let allTasks = [];

async function loadTasks() {
  loadingState.hidden = false;
  emptyState.hidden = true;
  taskList.innerHTML = "";

  try {
    const response = await fetch(`${API_URL}/tasks`);

    if (!response.ok) throw new Error("Falha ao buscar tarefas");

    allTasks = await response.json();
    updateFilterCounts();
    renderCurrentFilter();
  } catch (error) {
    loadingState.hidden = true;
    taskList.innerHTML = `<p class="empty-state">Não foi possível conectar ao servidor. Verifique se o back-end está rodando em ${API_URL}.</p>`;
    console.error(error);
  }
}

function updateFilterCounts() {
  const counts = {
    todas: allTasks.length,
    Pendente: allTasks.filter((t) => t.status === "Pendente").length,
    "Concluída": allTasks.filter((t) => t.status === "Concluída").length,
  };

  filterButtons.forEach((btn) => {
    const filter = btn.dataset.filter;
    const countEl = btn.querySelector(".filter-btn__count");
    if (countEl) countEl.textContent = `(${counts[filter]})`;
  });
}

function renderCurrentFilter() {
  const filtered = currentFilter === "todas"
    ? allTasks
    : allTasks.filter((t) => t.status === currentFilter);
  renderTasks(filtered);
}

function renderTasks(tasks) {
  loadingState.hidden = true;
  taskList.innerHTML = "";

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

// Modal de confirmação customizado, no lugar do confirm() nativo do navegador.
// Retorna uma Promise<boolean> que resolve conforme o botão clicado.
function askConfirmation(message) {
  return new Promise((resolve) => {
    confirmModalMessage.textContent = message;
    confirmModal.hidden = false;

    function cleanup(result) {
      confirmModal.hidden = true;
      confirmModalConfirm.removeEventListener("click", onConfirm);
      confirmModalCancel.removeEventListener("click", onCancel);
      resolve(result);
    }

    function onConfirm() { cleanup(true); }
    function onCancel() { cleanup(false); }

    confirmModalConfirm.addEventListener("click", onConfirm);
    confirmModalCancel.addEventListener("click", onCancel);
  });
}

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

async function deleteTask(id) {
  const confirmed = await askConfirmation("Tem certeza que deseja excluir esta tarefa?");
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Falha ao excluir tarefa");
    await loadTasks();
  } catch (error) {
    console.error(error);
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    currentFilter = btn.dataset.filter;
    renderCurrentFilter();
  });
});

loadTasks(); // carrega a lista assim que a pagina abre