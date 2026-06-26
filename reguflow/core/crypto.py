import hashlib
import json
from typing import Any

def generate_payload_hash(payload: Any) -> str:
    """
    Generates a SHA-256 hash for a given payload to ensure tamper-evidence.
    """
    if not isinstance(payload, str):
        # Convert dictionary or object to a JSON string with sorted keys for consistency
        try:
            if hasattr(payload, "model_dump_json"):
                payload_str = payload.model_dump_json()
            else:
                payload_str = json.dumps(payload, sort_keys=True)
        except Exception:
            payload_str = str(payload)
    else:
        payload_str = payload
        
    return hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
