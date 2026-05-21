# Deployment Guide: Autonomous AI Research Agent

This guide provides instructions for deploying and using the AI Research Agent.

## Prerequisites

### 1. Ollama (Local LLM)
The agent requires a local Ollama instance to perform summarization and synthesis.
- Download and install Ollama from [ollama.ai](https://ollama.ai).
- Pull the required model:
  ```bash
  ollama pull llama3
  ```
- Ensure the Ollama server is running. By default, it listens on `http://localhost:11434`.

## Deployment Options

### Option A: Docker (Recommended)
The easiest way to deploy the agent is using Docker Compose.

1. **Build and start the container**:
   ```bash
   docker-compose up --build
   ```
2. **Access the API**:
   The API will be available at `http://localhost:8000`.

### Option B: Local Installation
If you prefer to run it without Docker:

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Run the server**:
   ```bash
   export PYTHONPATH=$PYTHONPATH:$(pwd)
   python src/main.py
   ```

## API Usage

### 1. Start Research Task
**Endpoint**: `POST /research`
**Body**:
```json
{
  "query": "The impact of quantum computing on cryptography in 2026",
  "template": "DEEP_DIVE" 
}
```
*Templates available: `DEEP_DIVE` (Default), `EXECUTIVE_BRIEF`, `COMPARATIVE_ANALYSIS`.*

**Response**:
```json
{
  "task_id": "uuid-string",
  "status": "processing"
}
```

### 2. Check Status & Retrieve Report
**Endpoint**: `GET /status/{task_id}`

**Response (if completed)**:
```json
{
  "status": "completed",
  "result": {
    "final_report": "...",
    "sources": ["url1", "url2", ...]
  }
}
```

## Architecture Overview
The system uses **LangGraph** for state orchestration, **DuckDuckGo** for search, **BeautifulSoup** for scraping, and **Ollama** for local LLM inference.
