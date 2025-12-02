from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from fastapi import FastAPI
import os
from dotenv import load_dotenv

load_dotenv()

from ..note.models import Note

MONGODB_URL = os.getenv("DATABASE_URL")
DATABASE_NAME = os.getenv("MONGO_INITDB_DATABASE")

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    app.mongodb = app.mongodb_client[DATABASE_NAME]
    
    await init_beanie(
        database=app.mongodb,
        document_models=[Note]
    )

    print("Connected to MongoDB")

    yield

    app.mongodb_client.close()
    print("Disconnected from MongoDB")

