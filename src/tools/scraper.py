import requests
from bs4 import BeautifulSoup
import time
from typing import Optional

def scrape_content(url: str, timeout: int = 10) -> Optional[str]:
    """
    Extracts the main text content from a URL.

    Args:
        url: The URL to scrape.
        timeout: Request timeout in seconds.

    Returns:
        The extracted main text or None if scraping failed.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        # Rate limiting to avoid blocks
        time.sleep(1)

        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # Remove noise
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            element.decompose()

        # Extract text from paragraphs
        paragraphs = soup.find_all('p')
        text = "\n".join([p.get_text().strip() for p in paragraphs if p.get_text().strip()])

        # Fallback to body text if no paragraphs found
        if not text:
            text = soup.get_text(separator='\n', strip=True)

        return text

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None
