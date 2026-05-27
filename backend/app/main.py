import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.config import settings

def create_app() -> FastAPI:
    app = FastAPI(title="Emergency Lane Detection")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    from app.routers import auth, health, devices, suspected_incidents, evidence, stats, system, settings as settings_router, tasks
    app.include_router(auth.router)
    app.include_router(health.router)
    app.include_router(devices.router)
    app.include_router(suspected_incidents.router)
    app.include_router(evidence.router)
    app.include_router(stats.router)
    app.include_router(system.router)
    app.include_router(settings_router.router)
    app.include_router(tasks.router)

    os.makedirs(settings.evidence_dir, exist_ok=True)
    app.mount("/evidence", StaticFiles(directory=settings.evidence_dir), name="evidence")

    @app.on_event("startup")
    def on_startup():
        init_db()
        from app.services.evidence_service import cleanup_expired_evidence
        cleanup_expired_evidence()

    return app

app = create_app()
