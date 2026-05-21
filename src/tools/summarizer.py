from ollama import AsyncClient
import json
import re
from pydantic import BaseModel, Field
from typing import List, Optional


class SummaryReport(BaseModel):
    key_findings: List[str] = Field(description="A list of the most important discoveries from the text.")
    supporting_evidence: List[str] = Field(description="Specific facts or data points that support the findings.")
    conclusion: str = Field(description="A concise final summary of the content.")

async def summarize_text_async(text: str, model: str = "llama3") -> Optional[SummaryReport]:
    """
    Summarizes extracted text using a local Ollama model with structured output.

    Args:
        text: The text to summarize.
        model: The Ollama model to use.

    Returns:
        A SummaryReport object if successful, otherwise None.
    """
    if not text or len(text.strip()) == 0:
        return None

    prompt = (
        f"Analyze the following text and provide a structured summary. "
        f"Extract key findings, supporting evidence, and a final conclusion.\n\n"
        f"Text:\n{text}"
    )

    try:
        response = await AsyncClient().chat(
            model=model,
            messages=[{'role': 'user', 'content': prompt}],
            format="json",
        )

        content = response['message']['content']

        # Extract JSON from markdown blocks if present
        json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
        else:
            # Try to find the first { and last } if the model added conversational fluff
            start_index = content.find('{')
            end_index = content.rfind('}')
            if start_index != -1 and end_index != -1:
                content = content[start_index:end_index + 1]

        return SummaryReport.model_validate_json(content)

    except Exception as e:
        print(f"Error summarizing text: {e}")
        return None

def summarize_text(text: str, model: str = "llama3") -> Optional[SummaryReport]:
    """
    Synchronous wrapper for summarize_text_async.
    """
    import asyncio
    try:
        return asyncio.run(summarize_text_async(text, model))
    except RuntimeError:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(summarize_text_async(text, model))
    except Exception as e:
        print(f"Error in sync summarize_text wrapper: {e}")
        return None
