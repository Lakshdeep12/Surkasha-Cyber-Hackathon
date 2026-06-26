from motor.motor_asyncio import AsyncIOMotorClient
import logging
import asyncio

logger = logging.getLogger(__name__)

class MongoDBClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBClient, cls).__new__(cls)
            cls._instance.client = None
            cls._instance.db = None
        return cls._instance

    async def connect(self, uri: str = "mongodb://localhost:27017", db_name: str = "reguflow"):
        max_retries = 5
        for attempt in range(max_retries):
            try:
                self.client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
                # Verify connection
                await self.client.admin.command('ping')
                self.db = self.client[db_name]
                logger.info(f"Connected to MongoDB at {uri}, database: {db_name}")
                return
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
        raise ConnectionError("Could not connect to MongoDB after multiple attempts.")

    async def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    async def insert_document(self, collection_name: str, document: dict):
        try:
            collection = self.db[collection_name]
            result = await collection.insert_one(document)
            return result.inserted_id
        except Exception as e:
            logger.error(f"Error inserting document into {collection_name}: {e}")
            raise

db_client = MongoDBClient()
