# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware import cors

app = FastAPI(title="Holo Vault API", version="1.0.0")

# Setup CORS for the React frontend
app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import binders, pages, uploads, card_slots, auth, oauth

app.include_router(auth.router, prefix="/api/v1")
app.include_router(oauth.router, prefix="/api/v1")
app.include_router(binders.router, prefix="/api/v1")
app.include_router(pages.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(card_slots.router, prefix="/api/v1")

@app.on_event("startup")
def startup_event():
    from app.workers import start_background_workers
    start_background_workers()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Holo Vault API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
