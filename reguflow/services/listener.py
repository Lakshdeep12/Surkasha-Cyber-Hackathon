import os
import asyncio
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class SandboxListener:
    def __init__(self, watch_dir: str):
        self.watch_dir = Path(watch_dir)
        self.processed_files = set()

    async def get_new_circulars(self):
        """
        Simulates detecting new circulars in the Mock RBI Sandbox (e.g., uploads folder).
        """
        if not self.watch_dir.exists():
            logger.warning(f"Watch directory {self.watch_dir} does not exist. Creating it.")
            self.watch_dir.mkdir(parents=True, exist_ok=True)
            
        new_circulars = []
        for file_path in self.watch_dir.glob("*.txt"):
            if file_path.name not in self.processed_files:
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    new_circulars.append({
                        "id": file_path.stem,
                        "content": content
                    })
                    self.processed_files.add(file_path.name)
                except Exception as e:
                    logger.error(f"Error reading file {file_path}: {e}")
        return new_circulars
