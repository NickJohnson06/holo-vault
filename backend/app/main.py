from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Holo Vault API", version="1.0.0")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import binders, pages, uploads, card_slots, auth

app.include_router(auth.router, prefix="/api/v1")
app.include_router(binders.router, prefix="/api/v1")
app.include_router(pages.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(card_slots.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Holo Vault API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
