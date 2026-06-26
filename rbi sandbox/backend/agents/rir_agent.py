"""
RIR (Regulatory Intelligence Report) AI Agent
Uses local Ollama to extract structured regulatory intelligence from circular content.
100% offline - no external APIs.
"""

import json
import logging
import re
import requests
from typing import Optional

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"

PREFERRED_MODELS = [
    "qwen3:latest", "qwen2.5:latest", "llama3:latest", "gemma:latest",
    "qwen:0.5b", "gemma:2b", "llama3.2:latest", "mistral:latest"
]

SYSTEM_PROMPT = """You are a Regulatory Intelligence Extraction Agent for a banking compliance system.

Your task is to analyze regulatory circulars published by the central bank (ARBI) and extract ONLY the actionable compliance information.

STRICT RULES:
- Extract only mandatory requirements, obligations, deadlines, and actionable items.
- IGNORE: greetings, formal introductions, contact information, legal boilerplate, repeated paragraphs, administrative references.
- NEVER invent or hallucinate regulations. Extract only what is explicitly stated.
- If a section cannot be determined from the text, state "Not specified in source regulation."
- Keep the executive_summary between 150-250 words.
- Identify banking departments affected from: Compliance Office, Cybersecurity Wing, IT Operations, Core Banking, Risk Management, Internal Audit, Treasury, Customer Service, Legal Affairs, Operations Department.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "executive_summary": "<150-250 word summary>",
  "key_obligations": ["<obligation 1>", "<obligation 2>"],
  "compliance_actions": ["<action 1>", "<action 2>"],
  "affected_departments": ["<dept 1>", "<dept 2>"],
  "risk_assessment": {
    "cyber_risk": "<Critical|High|Medium|Low>",
    "operational_risk": "<Critical|High|Medium|Low>",
    "regulatory_risk": "<Critical|High|Medium|Low>",
    "overall_priority": "<Critical|High|Medium|Low>",
    "risk_rationale": "<1-2 sentence explanation>"
  },
  "implementation_timeline": [
    {"action": "<action>", "deadline": "<date or timeframe>", "priority": "<Critical|High|Medium|Low>"}
  ],
  "maps": [
    {
      "map_id": "<MAP-ID>",
      "task": "<specific task>",
      "assigned_owner": "<department>",
      "success_criteria": "<measurable outcome>",
      "deadline": "<date or timeframe>"
    }
  ],
  "ai_interpretation": "<explanation of extraction rationale, 2-4 sentences>",
  "final_recommendation": "<concise compliance recommendation, 2-3 sentences>"
}"""

USER_PROMPT_TEMPLATE = """Analyze the following regulatory circular and extract the required intelligence.

REGULATION REFERENCE: {regulation_id}
REGULATION TITLE: {title}
CATEGORY: {category}
PRIORITY: {priority}
ISSUE DATE: {issue_date}
EFFECTIVE DATE: {effective_date}

FULL CIRCULAR CONTENT:
{content}

Extract the regulatory intelligence and respond with only a valid JSON object."""


def _get_available_model() -> Optional[str]:
    """Probe Ollama for available models and return the best match."""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            available = [m["name"] for m in resp.json().get("models", [])]
            logger.info(f"Available Ollama models: {available}")
            for preferred in PREFERRED_MODELS:
                for avail in available:
                    if preferred.split(":")[0] in avail:
                        return avail
            if available:
                return available[0]
    except Exception as e:
        logger.warning(f"Could not probe Ollama models: {e}")
    return None


def _clean_json_response(raw: str) -> str:
    """Strip markdown code fences and extract first JSON object."""
    raw = re.sub(r"```(?:json)?", "", raw).strip("`").strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return match.group(0)
    return raw


def _build_fallback_analysis(circular_data: dict) -> dict:
    """Generate a rule-based fallback if Ollama is unavailable."""
    content = circular_data.get("content", "")
    title = circular_data.get("title", "Unknown Regulation")
    priority = circular_data.get("priority", "Medium")

    markers = ("must", "shall", "required", "directed", "mandatory",
               "submit", "implement", "ensure", "comply", "maintain")
    lines = [ln.strip() for ln in content.splitlines() if ln.strip()]
    obligations = [ln for ln in lines if any(m in ln.lower() for m in markers)][:8]
    if not obligations:
        obligations = [
            "Comply with all provisions stated in this circular.",
            "Submit compliance report to regulator within prescribed timeline."
        ]

    actions = [
        (f"Review and implement: {ob[:80]}..." if len(ob) > 80 else f"Implement: {ob}")
        for ob in obligations[:5]
    ]

    risk_map = {
        "Critical": ("Critical", "High",   "Critical", "Critical"),
        "High":     ("High",     "Medium", "High",     "High"),
        "Medium":   ("Medium",   "Medium", "Medium",   "Medium"),
        "Low":      ("Low",      "Low",    "Low",      "Low"),
    }
    cyber, ops, reg, overall = risk_map.get(priority, risk_map["Medium"])

    departments = circular_data.get("target_departments") or ["Compliance Office"]
    effective = circular_data.get("effective_date") or "As per regulation"
    reg_id = circular_data.get("regulation_id", "REG")

    return {
        "executive_summary": (
            f"This regulation ({reg_id}) titled '{title}' has been issued by ARBI "
            f"with a priority level of {priority}. The circular mandates compliance "
            f"across key banking departments. All institutions must review the obligations "
            f"outlined herein and implement the required controls within the specified "
            f"timeframe. Failure to comply may result in regulatory action. This report "
            f"was generated using rule-based extraction as the AI model was unavailable. "
            f"Departments should immediately acknowledge receipt, assign responsible "
            f"owners, and begin gap analysis against existing controls."
        ),
        "key_obligations": obligations,
        "compliance_actions": actions,
        "affected_departments": departments,
        "risk_assessment": {
            "cyber_risk": cyber,
            "operational_risk": ops,
            "regulatory_risk": reg,
            "overall_priority": overall,
            "risk_rationale": f"Risk levels derived from circular priority classification ({priority})."
        },
        "implementation_timeline": [
            {
                "action": "Review circular and distribute to relevant departments",
                "deadline": "Immediately",
                "priority": "High"
            },
            {
                "action": "Implement all mandatory obligations",
                "deadline": effective,
                "priority": priority
            },
            {
                "action": "Submit compliance evidence to regulator",
                "deadline": effective,
                "priority": "High"
            }
        ],
        "maps": [
            {
                "map_id": f"MAP-{reg_id.replace('-', '_')}-{i+1:02d}",
                "task": ob,
                "assigned_owner": departments[0],
                "success_criteria": "Evidence of implementation documented and uploaded.",
                "deadline": effective
            }
            for i, ob in enumerate(obligations[:5])
        ] or [{
            "map_id": "MAP-001",
            "task": "Comply with regulation",
            "assigned_owner": departments[0],
            "success_criteria": "Compliance evidence submitted.",
            "deadline": effective
        }],
        "ai_interpretation": (
            "This analysis was generated using rule-based extraction because the local Ollama AI model "
            "was not available. Obligations were identified by scanning for regulatory keywords "
            "(must, shall, required, mandatory, ensure). Departments were sourced from circular metadata. "
            "For AI-enhanced analysis, ensure Ollama is running with a supported model."
        ),
        "final_recommendation": (
            f"This regulation must be treated with {priority.lower()} priority. "
            f"All relevant departments should be briefed immediately and implementation must "
            f"commence without delay. Document all compliance actions taken for audit purposes."
        )
    }


def extract_regulatory_intelligence(circular_data: dict) -> dict:
    """
    Main entry point. Sends circular content to Ollama and returns structured intelligence.
    Falls back to rule-based extraction if Ollama is unavailable.

    circular_data keys: regulation_id, title, category, priority, issue_date,
                        effective_date, content, target_departments
    """
    model = _get_available_model()
    if not model:
        logger.warning("No Ollama model available. Using rule-based fallback.")
        result = _build_fallback_analysis(circular_data)
        result["_model_used"] = "rule-based-fallback (Ollama unavailable)"
        return result

    logger.info(f"Using Ollama model: {model}")

    content = circular_data.get("content", "").strip()
    if not content:
        content = circular_data.get("summary", "No content provided.")

    if len(content) > 12000:
        content = content[:12000] + "\n\n[Content truncated for analysis]"

    user_prompt = USER_PROMPT_TEMPLATE.format(
        regulation_id=circular_data.get("regulation_id", "N/A"),
        title=circular_data.get("title", "N/A"),
        category=circular_data.get("category", "N/A"),
        priority=circular_data.get("priority", "N/A"),
        issue_date=circular_data.get("issue_date", "N/A"),
        effective_date=circular_data.get("effective_date", "N/A"),
        content=content,
    )

    try:
        payload = {
            "model": model,
            "prompt": user_prompt,
            "system": SYSTEM_PROMPT,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,
                "num_predict": 4096,
            }
        }
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=300
        )
        resp.raise_for_status()
        raw_response = resp.json().get("response", "")
        logger.info(f"Ollama raw response length: {len(raw_response)} chars")

        cleaned = _clean_json_response(raw_response)
        result = json.loads(cleaned)
        result["_model_used"] = model
        return result

    except requests.exceptions.Timeout:
        logger.error("Ollama timed out. Using rule-based fallback.")
    except requests.exceptions.ConnectionError:
        logger.error("Cannot connect to Ollama. Using rule-based fallback.")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Ollama JSON response: {e}. Using rule-based fallback.")
    except Exception as e:
        logger.error(f"Unexpected error calling Ollama: {e}. Using rule-based fallback.")

    result = _build_fallback_analysis(circular_data)
    result["_model_used"] = "rule-based-fallback (Ollama error)"
    return result
