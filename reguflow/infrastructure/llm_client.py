import aiohttp
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.generate_endpoint = f"{self.base_url}/api/generate"

    async def generate(self, model: str, prompt: str, system: str = "", format: str = "") -> str:
        payload = {
            "model": model,
            "prompt": prompt,
            "system": system,
            "stream": False
        }
        if format:
            payload["format"] = format

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.generate_endpoint, json=payload) as response:
                    response.raise_for_status()
                    data = await response.json()
                    return data.get("response", "")
        except aiohttp.ClientError as e:
            logger.error(f"Ollama API connection error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling Ollama: {e}")
            raise
