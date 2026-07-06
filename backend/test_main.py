"""
Testes da API. Roda com: pytest (de dentro da pasta backend)

Usa um banco SQLite separado (test_tasks.db) so pros testes, pra nao
misturar com o tasks.db real usado no dia a dia.
"""

import os
import pytest
from fastapi.testclient import TestClient

import database
database.DB_PATH = "test_tasks.db"

from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    # roda antes e depois de cada teste, pra eles nao dependerem uns dos outros
    if os.path.exists(database.DB_PATH):
        os.remove(database.DB_PATH)
    database.init_db()
    yield
    if os.path.exists(database.DB_PATH):
        os.remove(database.DB_PATH)


def test_create_task():
    response = client.post("/tasks", json={"title": "Comprar copos", "description": "10cm"})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Comprar copos"
    assert data["status"] == "Pendente"


def test_create_task_sem_titulo_falha():
    response = client.post("/tasks", json={"title": "", "description": ""})
    assert response.status_code == 422


def test_list_tasks():
    client.post("/tasks", json={"title": "Tarefa 1", "description": ""})
    client.post("/tasks", json={"title": "Tarefa 2", "description": ""})

    response = client.get("/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_tasks_filtrado_por_status():
    created = client.post("/tasks", json={"title": "Tarefa", "description": ""}).json()
    client.patch(f"/tasks/{created['id']}", json={"status": "Concluída"})
    client.post("/tasks", json={"title": "Outra tarefa", "description": ""})

    response = client.get("/tasks?status=Concluída")
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "Concluída"


def test_update_status():
    created = client.post("/tasks", json={"title": "Tarefa", "description": ""}).json()

    response = client.patch(f"/tasks/{created['id']}", json={"status": "Concluída"})
    assert response.status_code == 200
    assert response.json()["status"] == "Concluída"


def test_update_status_tarefa_inexistente():
    response = client.patch("/tasks/9999", json={"status": "Concluída"})
    assert response.status_code == 404


def test_delete_task():
    created = client.post("/tasks", json={"title": "Tarefa", "description": ""}).json()

    response = client.delete(f"/tasks/{created['id']}")
    assert response.status_code == 204

    response = client.get("/tasks")
    assert all(t["id"] != created["id"] for t in response.json())


def test_delete_task_inexistente():
    response = client.delete("/tasks/9999")
    assert response.status_code == 404
