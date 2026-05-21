from duckduckgo_search import DDGS
from typing import List, Dict

def search_web(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """
    Searches the web using DuckDuckGo and returns a list of results.

    Args:
        query: The search query.
        max_results: Maximum number of results to return.

    Returns:
        A list of dictionaries containing 'title', 'href', and 'body'.
    """
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({
                    'title': r.get('title'),
                    'href': r.get('href'),
                    'body': r.get('body')
                })
    except Exception as e:
        print(f"Error occurred during web search: {e}")

    return results
