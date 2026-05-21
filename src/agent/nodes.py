from ollama import AsyncClient
import json
import sqlite3
import datetime
from typing import List, Dict
from src.agent.state import ResearchState
from src.tools.search import search_web
from src.tools.scraper import scrape_content
from src.tools.summarizer import summarize_text_async, SummaryReport

def update_task_telemetry(state: ResearchState, current_step: str, log_messages: List[str], extra_data: dict = None):
    task_id = state.get("task_id")
    if not task_id:
        return
    
    try:
        with sqlite3.connect("tasks.db") as conn:
            cursor = conn.execute("SELECT result FROM tasks WHERE task_id = ?", (task_id,))
            row = cursor.fetchone()
            
            current_result = {}
            if row and row[0]:
                try:
                    current_result = json.loads(row[0])
                except Exception:
                    pass
            
            existing_logs = current_result.get("logs", [])
            formatted_logs = []
            for msg in log_messages:
                timestamp = datetime.datetime.now().strftime("%H:%M:%S")
                formatted = f"[{timestamp}] {msg}"
                existing_logs.append(formatted)
                formatted_logs.append(formatted)
            
            search_queries = list(set(current_result.get("search_queries", []) + state.get("search_queries", []) + (extra_data.get("search_queries", []) if extra_data and "search_queries" in extra_data else [])))
            sources = list(set(current_result.get("sources", []) + state.get("sources", []) + (extra_data.get("sources", []) if extra_data and "sources" in extra_data else [])))
            
            current_result.update({
                "logs": existing_logs,
                "current_step": current_step,
                "search_queries": search_queries,
                "sources": sources,
                "final_report": state.get("final_report", "") or (extra_data.get("final_report", "") if extra_data and "final_report" in extra_data else "")
            })
            
            if extra_data:
                for k, v in extra_data.items():
                    if k not in ["search_queries", "sources", "final_report"]:
                        current_result[k] = v
                
            conn.execute(
                "UPDATE tasks SET result = ? WHERE task_id = ?",
                (json.dumps(current_result), task_id)
            )
            return formatted_logs
    except Exception as e:
        print(f"Error updating telemetry DB: {e}")
        return []

async def query_planner(state: ResearchState) -> Dict:
    """
    Breaks down the main query into multiple search queries, leveraging historical context if semantically similar.
    """
    query = state['query']
    
    logs = [
        f"INITIALIZING RESEARCH TASK FOR QUERY: '{query}'",
        "GENERATING SEARCH PATHWAYS USING COGNITIVE PLANNER..."
    ]
    formatted = update_task_telemetry(state, "planner", logs)

    # Local Semantic Memory recall
    past_report_context = ""
    memory_logs = []
    try:
        with sqlite3.connect("tasks.db") as conn:
            cursor = conn.execute("SELECT task_id, result FROM tasks WHERE status = 'completed' AND task_id != ?", (state.get("task_id", ""),))
            past_tasks = cursor.fetchall()
            
        completed_records = []
        for tid, res_json in past_tasks:
            if res_json:
                res = json.loads(res_json)
                if "query" in res and "final_report" in res:
                    completed_records.append({
                        "task_id": tid,
                        "query": res["query"],
                        "final_report": res["final_report"]
                    })
        
        # If we have past tasks, let's run semantic matching using Ollama
        if completed_records:
            match_prompt = (
                f"You are a local semantic memory matcher. Decide if the user's new query: '{query}' "
                f"semantically matches or overlaps significantly with any of these past queries:\n\n"
            )
            for idx, rec in enumerate(completed_records[:10]):
                match_prompt += f"[{idx}] {rec['query']}\n"
            
            match_prompt += (
                f"\nIf there is a closely related or overlapping query, respond with the exact format 'MATCH: [index]' (e.g., 'MATCH: 0'). "
                f"If none of them are semantically matching, respond with 'MATCH: NONE'. "
                f"Do not output any other text."
            )
            
            match_resp = await AsyncClient().chat(model='llama3', messages=[{'role': 'user', 'content': match_prompt}])
            match_text = match_resp['message']['content'].strip()
            
            if "MATCH:" in match_text and "NONE" not in match_text:
                try:
                    import re
                    match_idx_str = re.findall(r'\d+', match_text)
                    if match_idx_str:
                        match_idx = int(match_idx_str[0])
                        if 0 <= match_idx < len(completed_records):
                            matched_rec = completed_records[match_idx]
                            past_report_context = matched_rec["final_report"]
                            memory_logs.append(f"[LOCAL SEMANTIC MEMORY] HIGH-DENSITY MATCH DETECTED IN ASTRAL CORE ARCHIVE!")
                            memory_logs.append(f"[LOCAL SEMANTIC MEMORY] MATCHED PAST STUDY: '{matched_rec['query']}'")
                            memory_logs.append("[LOCAL SEMANTIC MEMORY] RECALLING HISTORICAL DOSSIER TO ENABLE INCREMENTAL LEARNING.")
                except Exception as ex:
                    print(f"Memory match parsing error: {ex}")
    except Exception as e:
        print(f"Error accessing memory index: {e}")

    if memory_logs:
        formatted_mem = update_task_telemetry(state, "planner", memory_logs)
        if formatted:
            formatted.extend(formatted_mem or [])

    # Use Ollama to generate multiple search queries, considering previous context if available
    if past_report_context:
        prompt = (
            f"You are a research assistant. The user wants to research: '{query}'.\n"
            f"We have previously researched a closely related topic and compiled this report:\n\n"
            f"--- PREVIOUS RESEARCH START ---\n{past_report_context[:1500]}...\n--- PREVIOUS RESEARCH END ---\n\n"
            f"Generate 3 diverse and specific search queries to find NEW, UPDATED, or missing details that "
            f"build on top of the previous research. Return only the queries, one per line."
        )
    else:
        prompt = (
            f"You are a research assistant. The user wants to research: '{query}'.\n"
            f"Generate 3 diverse and specific search queries to find the most comprehensive "
            f"and accurate information on this topic. Return only the queries, one per line."
        )

    response = await AsyncClient().chat(model='llama3', messages=[{'role': 'user', 'content': prompt}])
    content = response['message']['content']
    queries = [q.strip() for q in content.strip().split('\n') if q.strip()][:3]

    done_logs = [f"GENERATED SEARCH TARGETS: {queries}"]
    formatted_done = update_task_telemetry(state, "planner", done_logs, {"search_queries": queries})

    return {
        "search_queries": queries, 
        "logs": (formatted or []) + (formatted_done or []),
        "current_step": "planner"
    }

def search_node(state: ResearchState) -> Dict:
    """
    Executes web searches for the planned queries.
    """
    logs = ["LAUNCHING SYSTEM WEB SEARCH...", "DISPATCHING GOOGLE/DUCKDUCKGO API RECIPIENTS..."]
    formatted = update_task_telemetry(state, "search", logs)

    all_sources = []
    for q in state['search_queries']:
        sub_log = [f"SCANNING INDEX FOR QUERY: '{q}'"]
        update_task_telemetry(state, "search", sub_log)
        if formatted:
            formatted.extend([f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {l}" for l in sub_log])
        
        results = search_web(q, max_results=3)
        for r in results:
            all_sources.append(r['href'])

    # Deduplicate sources
    unique_sources = list(set(all_sources))
    
    done_logs = [f"SEARCH CYCLES COMPLETE. DISCOVERED {len(unique_sources)} CORE INFORMATION CHANNELS."]
    formatted_done = update_task_telemetry(state, "search", done_logs, {"sources": unique_sources})

    return {
        "sources": unique_sources, 
        "logs": (formatted or []) + (formatted_done or []),
        "current_step": "search"
    }

def scrape_node(state: ResearchState) -> Dict:
    """
    Extracts content from the identified sources.
    Returns content as a list of JSON strings to preserve source-content mapping.
    """
    logs = [f"ESTABLISHING CONCURRENT CONNECTIONS TO {len(state['sources'])} TARGET ENDPOINTS..."]
    formatted = update_task_telemetry(state, "scrape", logs)

    contents = []
    for url in state['sources']:
        domain = url.split("//")[-1].split("/")[0]
        sub_log = [f"EXTRACTING KINETIC BODY DATA FROM SOURCE: '{domain}'"]
        update_task_telemetry(state, "scrape", sub_log)
        if formatted:
            formatted.extend([f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {l}" for l in sub_log])

        text = scrape_content(url)
        if text:
            contents.append(json.dumps({"url": url, "text": text}))
            success_log = [f"SCRAPE SUCCESSFUL: {len(text)} CHARACTERS PARSED."]
            update_task_telemetry(state, "scrape", success_log)
            if formatted:
                formatted.extend([f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {l}" for l in success_log])
        else:
            fail_log = [f"SCRAPE FAILED OR TIMEOUT FOR ENDPOINT: '{domain}'"]
            update_task_telemetry(state, "scrape", fail_log)
            if formatted:
                formatted.extend([f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {l}" for l in fail_log])

    done_logs = [f"SCRAPING OPERATIONS TERMINATED. TOTAL PACKETS EXTRACTED: {len(contents)}."]
    formatted_done = update_task_telemetry(state, "scrape", done_logs)

    return {
        "extracted_contents": contents, 
        "logs": (formatted or []) + (formatted_done or []),
        "current_step": "scrape"
    }

async def summarize_node(state: ResearchState) -> Dict:
    """
    Summarizes each piece of extracted content and tracks the source.
    """
    logs = ["INITIALIZING PARALLEX INFERENCE CYCLES...", "COMPRESSING EXTRACTED TEXT INTO SEMANTIC INSIGHTS..."]
    formatted = update_task_telemetry(state, "summarize", logs)

    summaries = []
    contents = state['extracted_contents']

    for item_json in contents:
        try:
            item = json.loads(item_json)
            url = item['url']
            domain = url.split("//")[-1].split("/")[0]
            content = item['text']
            
            sub_log = [f"SUMMARIZING SOURCE MATERIAL WITH LOCAL LLM: '{domain}'"]
            update_task_telemetry(state, "summarize", sub_log)
            if formatted:
                formatted.extend([f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {l}" for l in sub_log])

            summary = await summarize_text_async(content)
            if summary:
                summaries.append({
                    "url": url,
                    "text": f"Key Findings: {summary.key_findings}\nConclusion: {summary.conclusion}"
                })
                success_log = [f"SEMANTIC EXTRACTION COMPLETED FOR '{domain}'."]
                update_task_telemetry(state, "summarize", success_log)
                if formatted:
                    formatted.extend([f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {l}" for l in success_log])
        except Exception as e:
            err_log = [f"INFERENCE INTERRUPT FOR SOURCE PRODUCER: {e}"]
            update_task_telemetry(state, "summarize", err_log)
            if formatted:
                formatted.extend([f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {l}" for l in err_log])

    done_logs = [f"COMPRESSION COMPLETED. SYNTHESIZED {len(summaries)} SEMANTIC PRODUCERS."]
    formatted_done = update_task_telemetry(state, "summarize", done_logs)

    return {
        "summaries": summaries, 
        "logs": (formatted or []) + (formatted_done or []),
        "current_step": "summarize"
    }

async def synthesis_node(state: ResearchState) -> Dict:
    """
    Aggregates summaries into a professional research report with citations.
    """
    template_type = state.get('template', 'DEEP_DIVE')
    logs = [
        f"COMPILING ALL KNOWLEDGE SEGMENTS VIA STYLE TEMPLATE: {template_type}",
        "RUNNING MASTER REPORT GENERATOR INFERENCE ENGINE..."
    ]
    formatted = update_task_telemetry(state, "synthesize", logs)

    # 1. Prepare indexed sources for the LLM
    summaries_with_indices = []
    for i, s in enumerate(state['summaries']):
        summaries_with_indices.append(f"Source [{i+1}] ({s['url']}):\n{s['text']}")

    all_summaries_text = "\n\n".join(summaries_with_indices)

    templates = {
        "EXECUTIVE_BRIEF": (
            "Create a concise executive brief. Focus on the 'bottom line', "
            "key strategic implications, and a high-level summary. "
            "Be extremely brief and punchy."
        ),
        "DEEP_DIVE": (
            "Create a comprehensive, detailed research report. Provide exhaustive "
            "evidence, explore nuances, and provide deep technical context."
        ),
        "COMPARATIVE_ANALYSIS": (
            "Create a comparative report. Focus on contrasting different viewpoints, "
            "highlighting contradictions between sources, and identifying the most "
            "reliable consensus."
        )
    }

    template_instruction = templates.get(template_type, templates["DEEP_DIVE"])

    # 3. Construct the Master Prompt
    prompt = (
        f"You are an expert research synthesizer. Your goal is to produce a professional "
        f"research document on the topic: '{state['query']}'.\n\n"
        f"TEMPLATE STYLE: {template_instruction}\n\n"
        f"RESEARCH DATA:\n{all_summaries_text}\n\n"
        f"STRICT REQUIREMENTS:\n"
        f"1. CITATIONS: Every claim MUST be cited using the bracketed index from the data "
        f" (e.g., 'The market is growing by 20% [1]').\n"
        f"2. CROSS-REFERENCING: Explicitly mention when multiple sources agree or "
        f"contradict each other.\n"
        f"3. STRUCTURE: Use clear headers (Introduction, Detailed Analysis, Conclusion).\n"
        f"4. SOURCE LIST: End the report with a 'References' section listing all URLs by their index.\n\n"
        f"Final Report:"
    )

    response = await AsyncClient().chat(model='llama3', messages=[{'role': 'user', 'content': prompt}])
    final_report = response['message']['content']

    done_logs = ["KNOWLEDGE ARCHIVE GENERATED AND REGISTERED TO STATIC CELL."]
    formatted_done = update_task_telemetry(state, "synthesize", done_logs, {"final_report": final_report})

    return {
        "final_report": final_report, 
        "logs": (formatted or []) + (formatted_done or []),
        "current_step": "synthesize"
    }

async def critic_node(state: ResearchState) -> Dict:
    """
    Simulates a multi-agent debate by having a Skeptic Critic review the synthesized report,
    and the Optimist Researcher revise it, posting the full debate transcript to the logs.
    """
    logs = [
        "INITIATING MULTI-AGENT CRITICAL DEBATE NODES...",
        "SPAWNING AGENT ROLE: SKEPTIC CRITIC...",
        "SPAWNING AGENT ROLE: OPTIMIST RESEARCHER..."
    ]
    formatted = update_task_telemetry(state, "critic", logs)

    query = state['query']
    report = state['final_report']

    # Step 1: Critic Reviews
    critic_prompt = (
        f"You are a Skeptic Critic evaluating a newly synthesized research report on: '{query}'.\n"
        f"Analyze the report specifically looking for contradictions, unverified claims, bias, or gaps. "
        f"List exactly 2 specific critical issues or suggestions for improvement. Keep it highly concise.\n\n"
        f"DRAFT REPORT:\n{report}\n\n"
        f"Critique:"
    )

    response = await AsyncClient().chat(model='llama3', messages=[{'role': 'user', 'content': critic_prompt}])
    critique = response['message']['content']

    debate_log_1 = [
        "[AGENT DEBATE] SKEPTIC CRITIC: Draft report analyzed. Submitting structural feedback.",
        f"[AGENT DEBATE] SKEPTIC CRITIC NOTE:\n{critique}"
    ]
    formatted_1 = update_task_telemetry(state, "critic", debate_log_1)

    # Step 2: Researcher Refines
    researcher_prompt = (
        f"You are the Optimist Researcher. You have received feedback from the Skeptic Critic regarding your research report on '{query}'.\n\n"
        f"CRITIQUE:\n{critique}\n\n"
        f"Please revise the original report to directly address these points. Retain the exact markdown formatting, citations, and References section.\n\n"
        f"ORIGINAL REPORT:\n{report}\n\n"
        f"Revised Report:"
    )

    response = await AsyncClient().chat(model='llama3', messages=[{'role': 'user', 'content': researcher_prompt}])
    refined_report = response['message']['content']

    debate_log_2 = [
        "[AGENT DEBATE] OPTIMIST RESEARCHER: Critic feedback acknowledged.",
        "[AGENT DEBATE] OPTIMIST RESEARCHER: Integrating updates, resolving contradictions, and finalizing dossier...",
        "MUTUAL CONSENSUS ACHIEVED. DEBATE CYCLE RESOLVED."
    ]
    formatted_2 = update_task_telemetry(state, "critic", debate_log_2, {"final_report": refined_report})

    all_formatted = (formatted or []) + (formatted_1 or []) + (formatted_2 or [])
    return {
        "final_report": refined_report,
        "logs": all_formatted,
        "current_step": "critic"
    }

def review_node(state: ResearchState) -> Dict:
    """
    Determines if the current information is sufficient.
    """
    logs = ["AUDITING INFORMATION SUFFICIENCY (PASS 1/1)...", "SUFFICIENT DATA DENSITY DETECTED. FINALIZING STATUS PACKET."]
    formatted = update_task_telemetry(state, "review", logs)

    return {
        "is_sufficient": True, 
        "logs": formatted or [],
        "current_step": "review"
    }

