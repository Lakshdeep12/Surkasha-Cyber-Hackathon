import json
from langchain_core.prompts import PromptTemplate
from .llm_config import get_llm
import sys
import os

# Add parent directory to path to allow backend imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.schemas import RegulatoryIntelligenceOutput

def process_circular(circular_text: str, model_name="llama3") -> dict:
    llm = get_llm(model_name)
    
    prompt = PromptTemplate.from_template(
        """You are an expert Regulatory Compliance Officer at Canara Bank.
Analyze the following regulatory circular and extract all mandatory obligations, deadlines, affected departments, and assess the risk level (Critical, High, Medium, Low).
The affected departments must be chosen from the following list: Compliance Office, Cybersecurity Wing, IT Operations, Core Banking, Risk Management, Internal Audit.

Circular Text:
{circular_text}

Provide your answer ONLY as a valid JSON object matching this schema:
{{
  "obligations": [
    {{
      "description": "string",
      "deadline": "string or null",
      "affected_departments": ["string"],
      "risk_level": "string"
    }}
  ]
}}
"""
    )
    
    chain = prompt | llm
    result = chain.invoke({"circular_text": circular_text})
    
    # Parse the JSON string
    try:
        if hasattr(result, 'content'):
            parsed_json = json.loads(result.content)
        else:
            parsed_json = json.loads(result)
        # Validate against schema
        validated_data = RegulatoryIntelligenceOutput(**parsed_json)
        return validated_data.model_dump()
    except Exception as e:
        print(f"Failed to parse or validate LLM output: {e}")
        # Return empty structure as fallback
        return {"obligations": []}
