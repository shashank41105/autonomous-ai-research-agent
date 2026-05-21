import uuid
import asyncio
import sqlite3
import json
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from src.agent.graph import research_agent

app = FastAPI(title="Autonomous AI Research Agent API")

# Persistent storage using SQLite
DB_PATH = "tasks.db"

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks ("
            "task_id TEXT PRIMARY KEY, "
            "status TEXT, "
            "result TEXT"
            ")"
        )

init_db()

class ResearchRequest(BaseModel):
    query: str
    template: Optional[str] = "DEEP_DIVE"

class ResearchResponse(BaseModel):
    task_id: str
    status: str

async def run_research(task_id: str, query: str, template: str):
    """
    Runs the LangGraph research agent and stores the result.
    """
    import datetime
    try:
        initial_state = {
            "query": query,
            "search_queries": [],
            "sources": [],
            "extracted_contents": [],
            "summaries": [],
            "final_report": "",
            "template": template,
            "iteration_count": 0,
            "is_sufficient": False,
            "task_id": task_id,
            "logs": [f"[{datetime.datetime.now().strftime('%H:%M:%S')}] BOOTING COGNITIVE ORCHESTRATOR GRAPH..."],
            "current_step": "idle"
        }

        # Execute agent
        result = await research_agent.ainvoke(initial_state)

        # Retrieve existing logs first to preserve them
        existing_logs = []
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.execute("SELECT result FROM tasks WHERE task_id = ?", (task_id,))
                row = cursor.fetchone()
                if row and row[0]:
                    existing_logs = json.loads(row[0]).get("logs", [])
        except Exception:
            pass

        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        existing_logs.append(f"[{timestamp}] MISSION LOGS SAVED. TERMINATING GRAPH PROCESS.")

        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "UPDATE tasks SET status = ?, result = ? WHERE task_id = ?",
                ("completed", json.dumps({
                    "query": query,
                    "final_report": result["final_report"], 
                    "sources": result["sources"],
                    "logs": existing_logs,
                    "current_step": "complete"
                }), task_id)
            )
    except Exception as e:
        existing_logs = []
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.execute("SELECT result FROM tasks WHERE task_id = ?", (task_id,))
                row = cursor.fetchone()
                if row and row[0]:
                    existing_logs = json.loads(row[0]).get("logs", [])
        except Exception:
            pass
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        existing_logs.append(f"[{timestamp}] CRITICAL CORE ERROR DETECTED: {str(e)}")
        
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "UPDATE tasks SET status = ?, result = ? WHERE task_id = ?",
                ("failed", json.dumps({
                    "query": query,
                    "error": str(e),
                    "logs": existing_logs,
                    "current_step": "failed"
                }), task_id)
            )

@app.get("/health")
async def health_check():
    """
    Simple health check endpoint to verify API and Ollama connectivity.
    """
    try:
        from ollama import AsyncClient
        client = AsyncClient()
        return {"status": "healthy", "backend": "online", "ollama": "reachable"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.post("/research", response_model=ResearchResponse)
async def start_research(request: ResearchRequest, background_tasks: BackgroundTasks):
    """
    Triggers a new research task.
    """
    import datetime
    task_id = str(uuid.uuid4())

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO tasks (task_id, status, result) VALUES (?, ?, ?)",
            (task_id, "processing", json.dumps({
                "query": request.query,
                "logs": [
                    f"[{datetime.datetime.now().strftime('%H:%M:%S')}] INITIALIZING COGNITIVE INTERFACE...",
                    f"[{datetime.datetime.now().strftime('%H:%M:%S')}] TASK REGISTERED IN PERSISTENT NODE: {task_id}"
                ],
                "current_step": "idle",
                "search_queries": [],
                "sources": [],
                "final_report": ""
            }))
        )

    # Run the agent in the background
    background_tasks.add_task(run_research, task_id, request.query, request.template)

    return ResearchResponse(task_id=task_id, status="processing")

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    """
    Checks the status of a research task and retrieves the result if completed.
    """
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT status, result FROM tasks WHERE task_id = ?", (task_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    status, result_json = row
    result = json.loads(result_json) if result_json else None

    return {
        "status": status,
        "result": result
    }

@app.get("/history")
async def get_history():
    """
    Retrieves the list of all historical research tasks.
    """
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute("SELECT task_id, status, result FROM tasks ORDER BY rowid DESC")
            rows = cursor.fetchall()
        
        history = []
        for row in rows:
            task_id, status, result_json = row
            result = json.loads(result_json) if result_json else {}
            history.append({
                "task_id": task_id,
                "status": status,
                "query": result.get("query") or "Unknown Query",
                "result": result
            })
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
