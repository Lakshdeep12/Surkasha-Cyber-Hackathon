from typing import Dict, TypedDict, List
from langgraph.graph import StateGraph, END
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.regulatory_intelligence import process_circular
from agents.map_generation import generate_map

class ComplianceState(TypedDict):
    circular_text: str
    obligations: List[dict]
    maps: List[dict]
    model_name: str

def extract_obligations(state: ComplianceState):
    print("Running Regulatory Intelligence Agent...")
    result = process_circular(state["circular_text"], model_name=state.get("model_name", "llama3"))
    return {"obligations": result.get("obligations", [])}

def create_maps(state: ComplianceState):
    print("Running MAP Generation Agent...")
    maps = []
    model_name = state.get("model_name", "llama3")
    for obs in state.get("obligations", []):
        map_result = generate_map(obs, model_name=model_name)
        # Store original obligation description for DB correlation if needed
        map_result["_obligation_desc"] = obs.get("description", "")
        maps.append(map_result)
    return {"maps": maps}

workflow = StateGraph(ComplianceState)

workflow.add_node("extract_obligations", extract_obligations)
workflow.add_node("create_maps", create_maps)

workflow.set_entry_point("extract_obligations")
workflow.add_edge("extract_obligations", "create_maps")
workflow.add_edge("create_maps", END)

app = workflow.compile()

def run_compliance_workflow(circular_text: str, model_name="llama3") -> dict:
    initial_state = {
        "circular_text": circular_text,
        "obligations": [],
        "maps": [],
        "model_name": model_name
    }
    result = app.invoke(initial_state)
    return result
