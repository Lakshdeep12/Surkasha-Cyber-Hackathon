import asyncio
import logging
from infrastructure.database import db_client
from core.engine import DualLLMEngine
from core.crypto import generate_payload_hash
from services.listener import SandboxListener
from services.router import DeterministicRouter
from models.schemas import AuditLogEntry

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

async def run_pipeline():
    logger.info("Initializing ReguFlow Pipeline...")
    
    # 1. Initialize Components
    try:
        await db_client.connect()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return

    # Using qwen:0.5b and gemma:2b as fallback models for local Ollama setup.
    # The user can adapt these to their exact tags.
    engine = DualLLMEngine(extractor_model="qwen", auditor_model="gemma") 
    router = DeterministicRouter()
    
    # Listen to the uploads folder as mentioned by the user
    listener = SandboxListener(watch_dir=r"D:\Suraksha hackathon\rbi sandbox\backend\uploads")

    logger.info("ReguFlow Pipeline is active and listening for new circulars...")

    try:
        while True:
            # 2. [Mock RBI Sandbox] -> [ReguFlow Listener]
            new_circulars = await listener.get_new_circulars()
            
            for circular in new_circulars:
                logger.info(f"Processing new circular: {circular['id']}")
                
                # 3. [Dual-LLM Engine]
                try:
                    # Node 1: Qwen Extractor
                    extracted_schema = await engine.extract_schema(circular["content"])
                    logger.info(f"Extraction successful for {circular['id']}. Found {len(extracted_schema.tasks)} tasks.")
                    
                    # Node 2: Gemma Auditor
                    validation_result = await engine.audit_schema(circular["content"], extracted_schema)
                    
                    if validation_result.is_valid:
                        logger.info(f"Validation passed for {circular['id']} (Confidence: {validation_result.confidence_score})")
                        
                        # 4. Deterministic Routing
                        for task in extracted_schema.tasks:
                            route_queue = router.route_task(task)
                            task_dict = task.model_dump()
                            task_dict["routed_to"] = route_queue
                            
                            # Generate Cryptographic Ledger Patch
                            payload_hash = generate_payload_hash(task_dict)
                            
                            # 5. [MongoDB Ledger]
                            audit_entry = AuditLogEntry(
                                action="task_routed",
                                details=task_dict,
                                payload_hash=payload_hash
                            )
                            
                            await db_client.insert_document("audit_ledger", audit_entry.model_dump())
                            logger.info(f"Task {task.task_id} securely logged with hash {payload_hash}")
                            
                        # Log the whole circular as processed
                        circular_hash = generate_payload_hash(extracted_schema)
                        circular_audit = AuditLogEntry(
                            action="circular_processed",
                            details={"circular_id": circular["id"], "validation_feedback": validation_result.feedback},
                            payload_hash=circular_hash
                        )
                        await db_client.insert_document("audit_ledger", circular_audit.model_dump())

                    else:
                        logger.warning(f"Validation failed for {circular['id']}: {validation_result.feedback}")
                        # Escalation logic would happen here for human-in-the-loop
                        
                except Exception as e:
                    logger.error(f"Error processing circular {circular['id']}: {e}")

            # Sleep before polling again
            await asyncio.sleep(10)
            
    except KeyboardInterrupt:
        logger.info("Pipeline stopped by user.")
    finally:
        await db_client.disconnect()

if __name__ == "__main__":
    asyncio.run(run_pipeline())
