import logging
from typing import Dict, Any
from models.schemas import ExtractedTask

logger = logging.getLogger(__name__)

class DeterministicRouter:
    def __init__(self):
        # Fallback dictionary representing the routing logic from theme_2.xlsx
        # Can be extended dynamically
        self.routing_matrix = {
            "IT": "IT_Vertical_Queue",
            "Security": "Cybersecurity_Wing_Queue",
            "Compliance": "Compliance_Operations_Queue",
            "Operations": "Branch_Operations_Queue",
            "HR": "HR_Vertical_Queue"
        }

    def route_task(self, task: ExtractedTask) -> str:
        """
        Routes the task to a specific message queue or endpoint based on the mapping matrix.
        """
        dept = task.target_department
        
        # Simple heuristic match if exact match not found
        matched_queue = "General_Exception_Queue"
        for key, queue in self.routing_matrix.items():
            if key.lower() in dept.lower():
                matched_queue = queue
                break
                
        logger.info(f"Routed task {task.task_id} (dept: {dept}) to {matched_queue}")
        return matched_queue
