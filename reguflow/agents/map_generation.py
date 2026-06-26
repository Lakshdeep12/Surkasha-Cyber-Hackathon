import json
import uuid
from langchain_core.prompts import PromptTemplate
from .llm_config import get_llm
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.schemas import MAPGenerationOutput

def generate_map(obligation: dict, model_name="llama3") -> dict:
    llm = get_llm(model_name)
    
    prompt = PromptTemplate.from_template(
        """You are an expert Compliance Operations Manager.
Convert the following regulatory obligation into a Measurable Action Point (MAP).

Obligation Description: {description}
Deadline: {deadline}
Affected Departments: {affected_departments}

Provide your answer ONLY as a valid JSON object matching this schema:
{{
  "map_id": "unique string",
  "task": "specific measurable action",
  "owner": "one specific department from the affected list",
  "deadline": "YYYY-MM-DD or specific text",
  "success_criteria": "how to verify completion"
}}
"""
    )
    
    chain = prompt | llm
    
    # Use the first affected department as a fallback owner
    departments_str = ", ".join(obligation.get("affected_departments", []))
    
    result = chain.invoke({
        "description": obligation.get("description", ""),
        "deadline": obligation.get("deadline", "None"),
        "affected_departments": departments_str
    })
    
    try:
        if hasattr(result, 'content'):
            parsed_json = json.loads(result.content)
        else:
            parsed_json = json.loads(result)
        
        # Override map_id with a real UUID
        parsed_json["map_id"] = str(uuid.uuid4())
        
        validated_data = MAPGenerationOutput(**parsed_json)
        return validated_data.model_dump()
    except Exception as e:
        print(f"Failed to parse or validate LLM output for MAP: {e}")
        return {
            "map_id": str(uuid.uuid4()),
            "task": f"Implement: {obligation.get('description', '')[:50]}...",
            "owner": obligation.get("affected_departments", ["Unknown"])[0] if obligation.get("affected_departments") else "Unknown",
            "deadline": obligation.get("deadline", ""),
            "success_criteria": "Verified by compliance officer"
        }
