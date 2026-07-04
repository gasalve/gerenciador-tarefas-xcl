"""
API do Gerenciador de Tarefas.

Endpoints:
    GET    /tasks          -> lista todas as tarefas (aceita ?status=Pendente)
    POST   /tasks           -> cria uma nova tarefa
    PATCH  /tasks/{id}      -> altera o status de uma tarefa
    DELETE /tasks/{id}      -> remove uma tarefa

Rode com:  uvicorn main:app --reload
Documentação automática em: http://localhost:8000/docs
"""

from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_connection, init_db
from models import Task, TaskCreate, TaskStatusUpdate

app = FastAPI(
    title="API - Gerenciador de Tarefas",
    description="API simples para cadastrar e acompanhar tarefas do dia a dia.",
    version="1.0.0",
)

# Libera o acesso do front-end (que roda em outra origem/porta) à API.
# Em um cenário de produção real, isso seria restrito ao domínio do front-end.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/tasks", response_model=list[Task])
def list_tasks(status: Optional[str] = None):
    """Lista todas as tarefas. Se `status` for informado, filtra por ele."""
    with get_connection() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM tasks WHERE status = ? ORDER BY id DESC", (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
        return [dict(row) for row in rows]


@app.post("/tasks", response_model=Task, status_code=201)
def create_task(task: TaskCreate):
    """Cadastra uma nova tarefa com status inicial 'Pendente'."""
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)",
            (task.title, task.description, "Pendente"),
        )
        conn.commit()
        new_row = conn.execute(
            "SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(new_row)


@app.patch("/tasks/{task_id}", response_model=Task)
def update_task_status(task_id: int, update: TaskStatusUpdate):
    """Altera o status de uma tarefa existente."""
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Tarefa não encontrada")

        conn.execute(
            "UPDATE tasks SET status = ? WHERE id = ?", (update.status, task_id)
        )
        conn.commit()
        updated = conn.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        return dict(updated)


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    """Remove uma tarefa pelo id."""
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Tarefa não encontrada")

        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
