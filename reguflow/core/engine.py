import json
import logging
from infrastructure.llm_client import OllamaClient
from models.schemas import ExtractedSchema, ValidationResult

logger = logging.getLogger(__name__)

class DualLLMEngine:
    def __init__(self, extractor_model: str = "qwen:0.5b", auditor_model: str = "gemma:2b"):
        self.client = OllamaClient()
        self.extractor_model = extractor_model
        self.auditor_model = auditor_model

    async def extract_schema(self, text: str) -> ExtractedSchema:
        system_prompt = """
        You are an expert regulatory compliance AI. 
        Your task is to read the following regulatory circular and extract actionable tasks.
        Output ONLY a valid JSON object matching this schema:
        {
          "circular_id": "string",
          "tasks": [
            {
              "task_id": "string",
              "title": "string",
              "description": "string",
              "target_department": "string",
              "deadline": "YYYY-MM-DD",
              "risk_level": "Low|Medium|High|Critical"
            }
          ]
        }
        Do not include markdown blocks or any other text.
        """
        try:
            logger.info(f"Running extraction node ({self.extractor_model})...")
            response = await self.client.generate(
                model=self.extractor_model,
                prompt=text,
                system=system_prompt,
                format="json"
            )
            data = json.loads(response)
            # Rigorous Pydantic validation
            schema = ExtractedSchema(**data)
            return schema
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            raise

    async def audit_schema(self, text: str, schema: ExtractedSchema) -> ValidationResult:
        system_prompt = """
        You are a strict compliance auditor AI.
        Review the original circular and the extracted JSON schema.
        Determine if the extraction is accurate, complete, and does not contain hallucinations.
        Output ONLY a valid JSON object matching this schema:
        {
          "is_valid": true,
          "confidence_score": 0.9,
          "feedback": "string explaining reasoning"
        }
        Do not include markdown blocks or any other text.
        """
        prompt = f"Original Circular:\n{text}\n\nExtracted Schema:\n{schema.model_dump_json()}"
        try:
            logger.info(f"Running auditor node ({self.auditor_model})...")
            response = await self.client.generate(
                model=self.auditor_model,
                prompt=prompt,
                system=system_prompt,
                format="json"
            )
            data = json.loads(response)
            result = ValidationResult(**data)
            return result
        except Exception as e:
            logger.error(f"Audit failed: {e}")
            raise
