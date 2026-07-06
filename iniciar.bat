@echo off
REM ============================================================
REM Sobe o back-end e o front-end do Gerenciador de Tarefas
REM de uma vez so, cada um em uma janela de terminal separada.
REM ============================================================

echo Iniciando back-end (FastAPI)...
start "Backend - Gerenciador de Tarefas" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

REM Espera alguns segundos para o back-end subir antes do front-end tentar conectar
timeout /t 3 /nobreak >nul

echo Iniciando front-end...
start "Frontend - Gerenciador de Tarefas" cmd /k "cd frontend && py -m http.server 5500"

REM Espera o servidor do front-end subir e abre o navegador automaticamente
timeout /t 2 /nobreak >nul
start http://localhost:5500

echo.
echo Tudo pronto! Duas janelas de terminal foram abertas (backend e frontend).
echo Para encerrar, feche as duas janelas de terminal que abriram.
