import json
import os
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class MemoryUpdate(BaseModel):
    data: dict[str, Any]


ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

path = Path(__file__).parent / "memory"
memory_file = path / "garden_memory.json"
context_file = path / "garden_context.txt"


def load_memory():
    if memory_file.exists():
        memory = json.loads(memory_file.read_text())
        return memory
    else:
        return {}


def load_context():
    if context_file.exists():
        context = context_file.read_text()
        return context
    else:
        return ""


def save_memory(data):
    memory_file.parent.mkdir(parents=True, exist_ok=True)
    memory_file.write_text(json.dumps(data))


@app.get("/context")
async def get_context():
    context = load_context()
    return context


@app.get("/memory")
async def get_memory():
    memory = load_memory()
    return memory


@app.post("/memory")
async def post_memory(memory_update: MemoryUpdate):
    memory = load_memory()
    memory.update(memory_update.data)
    save_memory(memory)
    return memory


@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=body,
            timeout=60.0,
        )
    return response.json()
