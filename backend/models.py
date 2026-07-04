"""
Schemas (formatos de dados) usados pela API.

O FastAPI usa essas classes para validar automaticamente o que chega
nas requisições e para documentar a API (gera o /docs sozinho).
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal

StatusType = Literal["Pendente", "Concluída"]


class TaskCreate(BaseModel):
    """Dados esperados para criar uma nova tarefa."""

    title: str = Field(..., min_length=1, max_length=120, description="Título da tarefa")
    description: str = Field("", max_length=500, description="Descrição da tarefa")


class TaskStatusUpdate(BaseModel):
    """Dados esperados para alterar o status de uma tarefa."""

    status: StatusType


class Task(BaseModel):
    """Formato de uma tarefa retornada pela API."""

    id: int
    title: str
    description: str
    status: StatusType
    created_at: str
