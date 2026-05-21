import pytest
import asyncio
from src.agent.graph import research_agent
from src.agent.state import ResearchState

def test_agent_full_research_cycle():
    """
    Tests the full end-to-end research workflow for a sample topic.
    """
    print("\nRunning E2E research cycle...")
    initial_state = {
        "query": "The impact of quantum computing on cryptography in 2026",
        "search_queries": [],
        "sources": [],
        "extracted_contents": [],
        "summaries": [],
        "final_report": "",
        "template": "DEEP_DIVE",
        "iteration_count": 0,
        "task_id": "test-task-1",
        "logs": [],
        "current_step": "idle"
    }

    # Execute the graph asynchronously
    final_state = asyncio.run(research_agent.ainvoke(initial_state))

    # Assertions
    assert final_state["final_report"] != ""
    assert len(final_state["summaries"]) > 0
    assert len(final_state["sources"]) > 0

    print(f"\nFinal Report Length: {len(final_state['final_report'])} characters")
    print(f"Sources Found: {len(final_state['sources'])}")
    print(f"Summaries Generated: {len(final_state['summaries'])}")

def test_agent_citations_and_templates():
    """
    Verifies that citations are present and templates change the output style.
    """
    print("\nTesting citations and templates...")
    query = "The future of solid-state batteries"

    # Test Deep Dive
    state_deep = {
        "query": query,
        "search_queries": [],
        "sources": [],
        "extracted_contents": [],
        "summaries": [],
        "final_report": "",
        "template": "DEEP_DIVE",
        "iteration_count": 0,
        "task_id": "test-task-2",
        "logs": [],
        "current_step": "idle"
    }
    res_deep = asyncio.run(research_agent.ainvoke(state_deep))

    # Test Executive Brief
    state_brief = {
        "query": query,
        "search_queries": [],
        "sources": [],
        "extracted_contents": [],
        "summaries": [],
        "final_report": "",
        "template": "EXECUTIVE_BRIEF",
        "iteration_count": 0,
        "task_id": "test-task-3",
        "logs": [],
        "current_step": "idle"
    }
    res_brief = asyncio.run(research_agent.ainvoke(state_brief))

    # Assertions
    assert "[1]" in res_deep["final_report"] or "[Source 1]" in res_deep["final_report"]
    assert len(res_deep["final_report"]) > len(res_brief["final_report"])
    print("Citation and template verification successful.")
