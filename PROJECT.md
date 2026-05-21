# Autonomous AI Research Agent

## Problem Statement
Build an autonomous AI agent that can research topics, search the web, summarize findings, create structured reports, and save results to cloud storage.

## Architecture
User Query → Agent Orchestrator (LangGraph) →
├─ Web Search Tool (DuckDuckGo API)
├─ Content Extractor (BeautifulSoup)
├─ Summarizer (Local LLM via Ollama)
├─ Report Generator (Structured Output)
└─ Storage (Notion API / Google Drive)

## Tech Stack
- **Orchestration**: LangGraph
- **LLM Inference**: Ollama (Local)
- **Search**: DuckDuckGo API
- **Scraping**: BeautifulSoup
- **Data Validation**: Pydantic
- **API Framework**: FastAPI
- **Deployment**: Docker

## Implementation Roadmap

### Phase 1: Core Tools
- [ ] Implement web search tool (DuckDuckGo)
- [ ] Build web scraper with rate limiting (BeautifulSoup)
- [ ] Create summarization pipeline (Ollama)
- [ ] Test individual components

### Phase 2: Agent Framework
- [ ] Design state graph for research workflow
- [ ] Implement LangGraph state machine
- [ ] Build tool calling mechanism
- [ ] Add error handling & retries

### Phase 3: Advanced Features
- [ ] Add multi-source synthesis
- [ ] Implement citation tracking
- [ ] Create report templates

### Phase 4: Deployment
- [ ] Wrap in FastAPI
- [ ] Create Docker container
- [ ] Write deployment documentation
- [ ] Record demo video

## Evaluation Criteria
- Successfully researches 5 diverse topics.
- Generates structured reports with sources.
- Handles errors gracefully.
- Completes in <5 minutes per topic.
