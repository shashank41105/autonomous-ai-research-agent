from langgraph.graph import StateGraph, END
from src.agent.state import ResearchState
from src.agent.nodes import (
    query_planner,
    search_node,
    scrape_node,
    summarize_node,
    synthesis_node,
    critic_node,
    review_node
)

def create_research_graph():
    """
    Creates the LangGraph state machine for the research agent.
    """
    workflow = StateGraph(ResearchState)

    # Add nodes
    workflow.add_node("planner", query_planner)
    workflow.add_node("search", search_node)
    workflow.add_node("scrape", scrape_node)
    workflow.add_node("summarize", summarize_node)
    workflow.add_node("synthesize", synthesis_node)
    workflow.add_node("critic", critic_node)
    workflow.add_node("review", review_node)

    # Define edges
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "search")
    workflow.add_edge("search", "scrape")
    workflow.add_edge("scrape", "summarize")
    workflow.add_edge("summarize", "synthesize")
    workflow.add_edge("synthesize", "critic")
    workflow.add_edge("critic", "review")

    # Conditional edge for review
    workflow.add_conditional_edges(
        "review",
        lambda x: "end" if x.get("is_sufficient") else "planner",
        {
            "end": END,
            "planner": "planner"
        }
    )

    return workflow.compile()

# Singleton instance for easy import
research_agent = create_research_graph()

