from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from api.routes import router
import logging
from infrastructure.database import db_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

app = FastAPI(
    title="ReguFlow API",
    description="Air-gapped AI-Governed Regulatory Compliance OS",
    version="1.0.0"
)

# Enable CORS for the frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

# Mount static files for the dashboard
app.mount("/dashboard", StaticFiles(directory="api/static", html=True), name="static")

@app.get("/")
async def root():
    return RedirectResponse(url="/dashboard")

@app.on_event("startup")
async def startup_event():
    logging.info("ReguFlow API starting up...")
    try:
        await db_client.connect()
    except Exception as e:
        logging.error(f"Failed to connect to DB during API startup: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    logging.info("ReguFlow API shutting down...")
    await db_client.disconnect()
