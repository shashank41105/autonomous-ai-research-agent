from typing import Annotated, List, TypedDict, Dict
import operator

class ResearchState(TypedDict):
    """
    Represents the state of the autonomous research agent.
    """
    query: str
    search_queries: Annotated[List[str], operator.add]
    sources: Annotated[List[str], operator.add]
    extracted_contents: Annotated[List[str], operator.add]
    summaries: Annotated[List[Dict[str, str]], operator.add]
    final_report: str
    template: str
    iteration_count: int
    is_sufficient: bool
    task_id: str
    logs: Annotated[List[str], operator.add]
    current_step: str
