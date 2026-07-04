"""
Camada de acesso ao banco de dados.

Usamos SQLite por ser um banco de dados real (suporta SQL, tipos,
integridade), mas que não exige instalar/configurar um servidor
separado - o banco inteiro é um único arquivo (tasks.db) que fica
junto do projeto.
"""

import sqlite3
from contextlib import contextmanager

DB_PATH = "tasks.db"


def init_db():
    """Cria a tabela de tarefas caso ainda não exista."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Pendente',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.commit()


@contextmanager
def get_connection():
    """
    Fornece uma conexão SQLite pronta para uso, garantindo que ela
    seja sempre fechada corretamente (mesmo se ocorrer um erro).
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # permite acessar colunas pelo nome
    try:
        yield conn
    finally:
        conn.close()
