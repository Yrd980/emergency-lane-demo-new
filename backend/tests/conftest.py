import pytest
import os
import tempfile
import shutil


@pytest.fixture(autouse=True)
def test_settings():
    tmpdir = tempfile.mkdtemp()
    os.environ["DB_PATH"] = os.path.join(tmpdir, "test.db")
    os.environ["EVIDENCE_DIR"] = os.path.join(tmpdir, "evidence")
    os.makedirs(os.environ["EVIDENCE_DIR"], exist_ok=True)
    from app.config import settings
    settings.db_path = os.environ["DB_PATH"]
    settings.evidence_dir = os.environ["EVIDENCE_DIR"]
    from app.database import init_db
    init_db()
    yield
    shutil.rmtree(tmpdir)


@pytest.fixture
def client():
    from app.main import create_app
    from starlette.testclient import TestClient
    app = create_app()
    return TestClient(app)
