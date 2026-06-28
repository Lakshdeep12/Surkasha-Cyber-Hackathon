# Suraksha Cyber Hackathon

This repository contains the codebase for our project developed during the Suraksha Cyber Hackathon.

## Project Structure

- **`reguflow`**: The main application folder, containing:
  - `frontend`: User Interface
  - `backend`: Backend services
  - `agents`: AI/Automation agents
  - `database`: Database models and schemas
  - `docker`: Docker configuration files and `docker-compose.yml` for containerization
- **`rbi sandbox`**: Sandbox environment for testing and prototyping.
- **`Explanation assets`**: Documentation, design assets, and presentations.

## Local agents
```bash
ollama pull qwen2.5
# OR
ollama pull llama3
```

## Getting Started

To run the `reguflow` application, navigate to the `reguflow` directory. You can use the provided `docker-compose.yml` to spin up the required services.

```bash
cd reguflow
docker-compose up -d
```

Make sure to install any necessary requirements located in `reguflow/requirements.txt` if you are running scripts locally outside of Docker.

```bash
cd reguflow
pip install -r requirements.txt
```

Steps for Running the Project (Every Time)
The project has 5 components that must all be running for the project to work as intended. Open 5 terminals and run the following commands:

Terminal 1 — RBI Sandbox Backend (Port 8000)
cd "d:\Suraksha hackathon\rbi sandbox\backend"
uvicorn main:app --port 8000 --reload

Terminal 2 — RBI Sandbox Frontend (Port 5173)
cd "d:\Suraksha hackathon\rbi sandbox\frontend"
npm run dev -- --port 5173

Terminal 3 — Reguflow API (Port 8001)
cd "d:\Suraksha hackathon\reguflow"
uvicorn api.main:app --port 8001 --reload

Terminal 4 — Reguflow Frontend (Port 5174)
cd "d:\Suraksha hackathon\reguflow\frontend"
npm run dev -- --port 5174

Terminal 5 — Reguflow Pipeline (Background Task)
cd "d:\Suraksha hackathon\reguflow"
python pipeline.py

1. Open http://localhost:5173  → Upload & Publish a circular
         ↓
2. Pipeline picks it up automatically (Terminal 5)
         ↓
3. Open http://localhost:5174/admin → See it appear on the dashboard
         ↓
4. Click "🧠 RIR" on the ARBI Sandbox → Download Intelligence Report PDF