import pytest
from src.tools.search import search_web
from src.tools.scraper import scrape_content
from src.tools.summarizer import summarize_text

def test_search_web():
    print("\nTesting search_web...")
    results = search_web("Python programming language")
    assert isinstance(results, list)
    if results:
        assert 'href' in results[0]
        assert 'title' in results[0]

def test_scrape_content():
    print("\nTesting scrape_content...")
    # Using a reliable stable page for testing
    url = "https://www.python.org/about/"
    content = scrape_content(url)
    assert content is not None
    assert len(content) > 0
    assert "Python" in content

def test_summarize_text():
    print("\nTesting summarize_text...")
    sample_text = "Python is a high-level, interpreted, general-purpose programming language. Created by Guido van Rossum and first released in 1991."
    summary = summarize_text(sample_text)
    assert summary is not None
    assert hasattr(summary, 'key_findings')

def test_integration_pipeline():
    print("\nTesting integration pipeline...")
    query = "Artificial Intelligence trends 2025 2026"
    results = search_web(query, max_results=1)

    if not results:
        pytest.fail("No search results found")

    url = results[0]['href']
    content = scrape_content(url)

    if not content:
        pytest.fail(f"Failed to scrape content from {url}")

    summary = summarize_text(content)
    assert summary is not None
    print(f"Integration successful. Summary Conclusion: {summary.conclusion}")
