import os

class Settings:
    def __init__(self):
        self.db_path = os.getenv("DB_PATH", "data/app.db")
        self.evidence_dir = os.getenv("EVIDENCE_DIR", "data/evidence")
        self.online_threshold_seconds = int(os.getenv("ONLINE_THRESHOLD_SECONDS", "60"))

settings = Settings()
