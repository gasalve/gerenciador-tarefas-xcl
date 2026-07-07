# Gerenciador de Tarefas

Desafio técnico do Programa de Estágio XCL. Aplicação simples para cadastrar,
listar, concluir e excluir tarefas do dia a dia, com front-end e back-end
separados.

## Tecnologias utilizadas

**Back-end**
- Python 3
- FastAPI — framework web para construir a API REST
- SQLite — banco de dados (arquivo local, sem necessidade de servidor)
- Uvicorn — servidor ASGI que executa a aplicação

**Front-end**
- HTML, CSS e JavaScript puros (sem framework), para manter o código
  totalmente transparente e fácil de explicar

## Arquitetura da solução

O projeto é dividido em duas partes independentes que se comunicam por
HTTP, conforme exigido pelo desafio:

```
gerenciador-tarefas/
├── backend/            # API REST (FastAPI)
│   ├── main.py         # Rotas da API
│   ├── database.py     # Conexão e criação da tabela no SQLite
│   ├── models.py       # Schemas de validação (Pydantic)
│   ├── test_main.py    # Testes automatizados (Pytest)
│   └── requirements.txt
├── frontend/            # Interface (HTML/CSS/JS puro)
│   ├── index.html
│   ├── style.css
│   └── script.js
└── iniciar.bat          # Atalho opcional (Windows) — sobe backend e frontend

- O **back-end** expõe uma API REST que cuida de toda a regra de negócio
  e do armazenamento das tarefas no banco SQLite.
- O **front-end** é uma página estática que consome essa API via
  `fetch()`. Ele não acessa o banco de dados diretamente — só conversa
  com o back-end por HTTP, o que permite trocar qualquer uma das duas
  partes no futuro sem afetar a outra.

### Endpoints da API

| Método | Rota           | Descrição                          |
|--------|----------------|-------------------------------------|
| GET    | `/tasks`       | Lista tarefas (aceita `?status=`)   |
| POST   | `/tasks`       | Cria uma nova tarefa                |
| PATCH  | `/tasks/{id}`  | Altera o status de uma tarefa       |
| DELETE | `/tasks/{id}`  | Remove uma tarefa                   |

Documentação interativa gerada automaticamente pelo FastAPI disponível em
`http://localhost:8000/docs` com o back-end rodando.

## Como executar o projeto

### 1. Back-end

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

A API sobe em `http://localhost:8000`. O arquivo `tasks.db` (SQLite) é
criado automaticamente na primeira execução.

### 2. Front-end

Basta abrir o arquivo `frontend/index.html` diretamente no navegador,
ou servir a pasta com um servidor simples:

```bash
cd frontend
python -m http.server 5500
```

E acessar `http://localhost:5500`.

> O back-end precisa estar rodando para o front-end funcionar, já que
> toda a leitura/escrita de tarefas passa pela API.

### Atalho opcional (Windows)

Para não precisar repetir os comandos acima toda vez, incluí um script
`iniciar.bat` na raiz do projeto. Basta dar duplo-clique nele: ele sobe
o back-end, espera alguns segundos e sobe o front-end, abrindo o
navegador automaticamente.

Esse script é só uma conveniência para uso local no Windows — **não**
é a forma oficial de executar o projeto (que é a documentada acima com
`uvicorn` e `python -m http.server`, e funciona em qualquer sistema
operacional).

## Principais decisões tomadas durante o desenvolvimento

- **SQLite em vez de arquivo JSON**: optei por um banco de dados de
  verdade em vez de um arquivo JSON simples porque isso me permite usar
  SQL, gera menos risco de corromper dados durante escritas simultâneas,
  e ainda assim é um banco leve, que não exige instalar um servidor
  separado (é só um arquivo `.db` local).
- **FastAPI**: escolhido pela validação automática dos dados de entrada
  (Pydantic) e pela documentação interativa gerada sozinha em `/docs`,
  o que facilita tanto o desenvolvimento quanto testar a API manualmente.
- **Front-end sem framework**: como o objetivo do desafio é demonstrar
  arquitetura e organização, optei por HTML/CSS/JS puros para manter o
  código simples de ler e de explicar, sem a complexidade extra de um
  build de React/Vue.
- **Separação em camadas no back-end**: `database.py` cuida só da
  conexão/persistência, `models.py` só da validação dos dados, e
  `main.py` só das rotas — para manter cada arquivo com uma
  responsabilidade clara.
- **CORS liberado (`allow_origins=["*"]`)**: como o front-end roda em uma
  origem separada do back-end durante o desenvolvimento local, foi
  necessário liberar CORS para as chamadas `fetch()` funcionarem. Em um
  cenário de produção, isso seria restrito ao domínio real do front-end.

## Testes automatizados

O back-end tem testes cobrindo os 4 endpoints (criar, listar, filtrar,
alterar status e excluir), incluindo casos de erro (título vazio, tarefa
inexistente).

Para rodar, com o ambiente virtual do back-end ativado:

```bash
cd backend
pip install -r requirements.txt
pytest
```

Os testes usam um banco SQLite separado (`test_tasks.db`), criado e
apagado automaticamente a cada execução — não interferem no
`tasks.db` usado no dia a dia.

## Diferenciais implementados

- Filtro de tarefas por status (Todas / Pendentes / Concluídas)
- Interface responsiva (funciona em telas de celular)
- Testes automatizados com pytest cobrindo os endpoints da API

## Possíveis melhorias futuras

- Adicionar edição do título/descrição de uma tarefa já criada
- Autenticação de usuários (cada um vendo só suas próprias tarefas)
- Deploy do back-end (ex: Render/Railway) e do front-end (ex: Vercel)
- Dockerizar o projeto para facilitar a execução em qualquer máquina
- Adicionar uma sugestão de prioridade automática usando IA a partir do
  título/descrição da tarefa
