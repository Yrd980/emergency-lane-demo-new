# Phase 2: HP 电脑端闭环 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 HP 电脑端 FastAPI 后端 + React Web 管理界面，使用模拟数据跑通事件接收、列表、详情、复核、历史查询的完整闭环。

**Architecture:** FastAPI 后端分 routers（HTTP 层）→ services（业务逻辑）→ database（SQLite）三层。前端 react-router-dom 管理 4 页面路由，自定义 hooks 封装 API 调用。Vite dev server 代理 `/api` 到后端。

**Tech Stack:** Python 3.11+ / FastAPI / SQLite / uvicorn / pytest / React 18 / TypeScript / Tailwind CSS / Vite / react-router-dom

---

### Task 1: 后端项目骨架

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/main.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/start.sh`
- Create: `backend/.gitignore`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p backend/app/routers backend/app/services backend/tests backend/data/evidence
```

- [ ] **Step 2: 创建 requirements.txt**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
python-multipart==0.0.20
pytest==8.3.4
httpx==0.28.1
requests==2.32.3
```

- [ ] **Step 3: 创建 config.py**

```python
import os

class Settings:
    def __init__(self):
        self.db_path = os.getenv("DB_PATH", "data/app.db")
        self.evidence_dir = os.getenv("EVIDENCE_DIR", "data/evidence")
        self.online_threshold_seconds = int(os.getenv("ONLINE_THRESHOLD_SECONDS", "60"))

settings = Settings()
```

- [ ] **Step 4: 创建 database.py**

```python
import sqlite3
import os
from app.config import settings

def get_db() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(settings.db_path), exist_ok=True)
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            device_name TEXT NOT NULL,
            app_version TEXT NOT NULL,
            model_version TEXT NOT NULL,
            registered_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            battery_level REAL DEFAULT 0,
            thermal_state TEXT DEFAULT 'normal',
            fps REAL DEFAULT 0,
            pending_upload_count INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_seconds REAL NOT NULL,
            roi_id TEXT NOT NULL,
            track_id TEXT NOT NULL,
            vehicle_class TEXT NOT NULL,
            vehicle_box_json TEXT NOT NULL,
            confidence REAL NOT NULL,
            gps_json TEXT NOT NULL DEFAULT '{}',
            review_status TEXT NOT NULL DEFAULT 'pending',
            operator_note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            reviewed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS evidence_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            evidence_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            sha256 TEXT NOT NULL DEFAULT '',
            uploaded_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_events_device ON events(device_id);
        CREATE INDEX IF NOT EXISTS idx_events_status ON events(review_status);
        CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
        CREATE INDEX IF NOT EXISTS idx_evidence_event ON evidence_files(event_id);
    """)
    conn.commit()
    conn.close()
```

- [ ] **Step 5: 创建 main.py**

```python
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
    from app.routers import health, devices, events, evidence, stats
    app.include_router(health.router)
    app.include_router(devices.router)
    app.include_router(events.router)
    app.include_router(evidence.router)
    app.include_router(stats.router)

    os.makedirs(settings.evidence_dir, exist_ok=True)
    app.mount("/evidence", StaticFiles(directory=settings.evidence_dir), name="evidence")

    @app.on_event("startup")
    def on_startup():
        init_db()

    return app

app = create_app()
```

Note: The router imports will fail until those modules exist — that's expected as we create them in later tasks.

- [ ] **Step 6: 创建占位文件**

```bash
touch backend/app/__init__.py
touch backend/app/routers/__init__.py
touch backend/app/services/__init__.py
touch backend/tests/__init__.py
```

```bash
chmod +x backend/start.sh
```

`backend/start.sh`:
```bash
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
mkdir -p data/evidence
uvicorn app.main:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}" --reload
```

`backend/.gitignore`:
```
data/
__pycache__/
*.pyc
.env
```

- [ ] **Step 7: 创建临时 health router 占位（让 main.py 可启动）**

`backend/app/routers/health.py`:
```python
from fastapi import APIRouter
router = APIRouter(tags=["health"])
```

创建对应的占位 routers（events, devices, evidence, stats）使 import 不报错:

```bash
for mod in devices events evidence stats; do
  echo 'from fastapi import APIRouter
router = APIRouter()' > backend/app/routers/${mod}.py
done
```

- [ ] **Step 8: 安装依赖并验证可启动**

```bash
cd backend && pip install -r requirements.txt
python -c "from app.main import app; print('OK')"
```

Expected: prints "OK" without errors.

- [ ] **Step 9: Commit**

```bash
git add backend/
git commit -m "feat: add backend project skeleton with config and database init"
```

---

### Task 2: Health 端点 (TDD)

**Files:**
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_health.py`
- Modify: `backend/app/routers/health.py`

- [ ] **Step 1: 编写 conftest.py**

```python
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
    from app.main import app
    from starlette.testclient import TestClient
    return TestClient(app)
```

- [ ] **Step 2: 编写失败测试**

```python
def test_health_returns_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "server_time" in data
```

- [ ] **Step 3: 运行测试确认失败**

```bash
cd backend && python -m pytest tests/test_health.py -v
```

Expected: FAIL (404 — health endpoint returns no route or empty response)

- [ ] **Step 4: 实现 health router**

Rewrite `backend/app/routers/health.py`:

```python
from fastapi import APIRouter
from datetime import datetime, timezone, timedelta

router = APIRouter(tags=["health"])

@router.get("/api/health")
def health_check():
    tz = timezone(timedelta(hours=8))
    return {
        "status": "ok",
        "server_time": datetime.now(tz).isoformat(),
    }
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd backend && python -m pytest tests/test_health.py -v
```

Expected: 1 PASS

- [ ] **Step 6: Commit**

```bash
git add backend/tests/conftest.py backend/tests/test_health.py backend/app/routers/health.py
git commit -m "feat: add health check endpoint"
```

---

### Task 3: 设备管理端点 (TDD)

**Files:**
- Create: `backend/app/models/__init__.py` (touch)
- Create: `backend/app/models/device.py`
- Create: `backend/app/services/device_service.py`
- Create: `backend/app/routers/devices.py` (rewrite from placeholder)
- Create: `backend/tests/test_devices.py`

- [ ] **Step 1: 编写 Pydantic models (backend/app/models/device.py)**

```python
from pydantic import BaseModel

class DeviceRegister(BaseModel):
    device_id: str
    device_name: str
    app_version: str
    model_version: str

class DeviceHeartbeat(BaseModel):
    device_id: str
    battery_level: float = 0
    thermal_state: str = "normal"
    fps: float = 0
    pending_upload_count: int = 0
```

- [ ] **Step 2: 编写 device_service (backend/app/services/device_service.py)**

```python
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.config import settings

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()

def register(device_id: str, device_name: str, app_version: str, model_version: str):
    conn = get_db()
    now = _now()
    conn.execute(
        """INSERT INTO devices (device_id, device_name, app_version, model_version, registered_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(device_id) DO UPDATE SET
               device_name=excluded.device_name,
               app_version=excluded.app_version,
               model_version=excluded.model_version,
               last_seen_at=excluded.last_seen_at""",
        (device_id, device_name, app_version, model_version, now, now),
    )
    conn.commit()
    return {"device_id": device_id, "registered": True}

def heartbeat(device_id: str, battery_level: float, thermal_state: str, fps: float, pending_upload_count: int):
    conn = get_db()
    now = _now()
    conn.execute(
        """UPDATE devices SET last_seen_at=?, battery_level=?, thermal_state=?, fps=?, pending_upload_count=?
           WHERE device_id=?""",
        (now, battery_level, thermal_state, fps, pending_upload_count, device_id),
    )
    conn.commit()
    return {"device_id": device_id, "heartbeat_accepted": True}

def list_devices():
    conn = get_db()
    rows = conn.execute("SELECT * FROM devices ORDER BY last_seen_at DESC").fetchall()
    now_dt = datetime.now(timezone(timedelta(hours=8)))
    result = []
    for r in rows:
        last = datetime.fromisoformat(r["last_seen_at"])
        is_online = (now_dt - last).total_seconds() < settings.online_threshold_seconds
        result.append({
            "device_id": r["device_id"],
            "device_name": r["device_name"],
            "app_version": r["app_version"],
            "model_version": r["model_version"],
            "registered_at": r["registered_at"],
            "last_seen_at": r["last_seen_at"],
            "battery_level": r["battery_level"],
            "thermal_state": r["thermal_state"],
            "fps": r["fps"],
            "pending_upload_count": r["pending_upload_count"],
            "is_online": is_online,
        })
    return result
```

- [ ] **Step 3: 编写 devices router**

Rewrite `backend/app/routers/devices.py`:

```python
from fastapi import APIRouter
from app.models.device import DeviceRegister, DeviceHeartbeat
from app.services import device_service

router = APIRouter(prefix="/api/devices", tags=["devices"])

@router.get("")
def list_devices():
    return device_service.list_devices()

@router.post("/register")
def register_device(body: DeviceRegister):
    return device_service.register(
        device_id=body.device_id,
        device_name=body.device_name,
        app_version=body.app_version,
        model_version=body.model_version,
    )

@router.post("/heartbeat")
def device_heartbeat(body: DeviceHeartbeat):
    return device_service.heartbeat(
        device_id=body.device_id,
        battery_level=body.battery_level,
        thermal_state=body.thermal_state,
        fps=body.fps,
        pending_upload_count=body.pending_upload_count,
    )
```

- [ ] **Step 4: 编写测试 (backend/tests/test_devices.py)**

```python
def test_register_device(client):
    resp = client.post("/api/devices/register", json={
        "device_id": "vivo_001",
        "device_name": "vivo X100",
        "app_version": "0.1.0",
        "model_version": "yolov8n-int8",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["device_id"] == "vivo_001"
    assert data["registered"] is True

def test_heartbeat_updates_fields(client):
    client.post("/api/devices/register", json={
        "device_id": "vivo_001",
        "device_name": "vivo X100",
        "app_version": "0.1.0",
        "model_version": "yolov8n-int8",
    })
    resp = client.post("/api/devices/heartbeat", json={
        "device_id": "vivo_001",
        "battery_level": 82.0,
        "thermal_state": "normal",
        "fps": 15.2,
        "pending_upload_count": 3,
    })
    assert resp.status_code == 200
    assert resp.json()["heartbeat_accepted"] is True

def test_list_devices_returns_registered(client):
    client.post("/api/devices/register", json={
        "device_id": "vivo_001",
        "device_name": "vivo X100",
        "app_version": "0.1.0",
        "model_version": "yolov8n-int8",
    })
    resp = client.get("/api/devices")
    assert resp.status_code == 200
    devices = resp.json()
    assert len(devices) == 1
    assert devices[0]["device_id"] == "vivo_001"
    assert devices[0]["is_online"] is True

def test_heartbeat_preserves_register_fields(client):
    client.post("/api/devices/register", json={
        "device_id": "vivo_001",
        "device_name": "vivo X100",
        "app_version": "0.1.0",
        "model_version": "yolov8n-int8",
    })
    client.post("/api/devices/heartbeat", json={
        "device_id": "vivo_001",
        "battery_level": 50.0,
        "fps": 10.0,
    })
    resp = client.get("/api/devices")
    device = resp.json()[0]
    assert device["battery_level"] == 50.0
    assert device["fps"] == 10.0
    assert device["device_name"] == "vivo X100"
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd backend && python -m pytest tests/test_devices.py -v
```

Expected: 4 PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/__init__.py backend/app/models/device.py backend/app/services/device_service.py backend/app/routers/devices.py backend/tests/test_devices.py
git commit -m "feat: add device registration, heartbeat, and list endpoints"
```

---

### Task 4: 事件上传、查询、复核 (TDD)

**Files:**
- Create: `backend/app/models/event.py`
- Create: `backend/app/services/event_service.py`
- Create: `backend/app/routers/events.py` (rewrite from placeholder)
- Create: `backend/tests/test_events.py`

- [ ] **Step 1: 编写 Pydantic models (backend/app/models/event.py)**

```python
from pydantic import BaseModel
from typing import Optional

class VehicleBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class GpsLocation(BaseModel):
    lat: float = 0.0
    lng: float = 0.0
    accuracy_meters: float = 0.0

class EventCreate(BaseModel):
    event_id: str
    device_id: str
    start_time: str
    end_time: str
    duration_seconds: float
    roi_id: str
    track_id: str
    vehicle_class: str
    vehicle_box: VehicleBox
    confidence: float
    gps_location: Optional[GpsLocation] = None

class ReviewUpdate(BaseModel):
    review_status: str
    operator_note: str = ""
```

- [ ] **Step 2: 编写 event_service (backend/app/services/event_service.py)**

```python
import json
from datetime import datetime, timezone, timedelta
from app.database import get_db

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()

def create_event(
    event_id: str, device_id: str, start_time: str, end_time: str,
    duration_seconds: float, roi_id: str, track_id: str, vehicle_class: str,
    vehicle_box: dict, confidence: float, gps_location: dict,
):
    conn = get_db()
    existing = conn.execute(
        "SELECT event_id, review_status FROM events WHERE event_id=?", (event_id,)
    ).fetchone()
    if existing:
        return {"event_id": event_id, "accepted": False, "duplicate": True}

    conn.execute(
        """INSERT INTO events (event_id, device_id, start_time, end_time, duration_seconds,
           roi_id, track_id, vehicle_class, vehicle_box_json, confidence, gps_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (event_id, device_id, start_time, end_time, duration_seconds,
         roi_id, track_id, vehicle_class, json.dumps(vehicle_box),
         confidence, json.dumps(gps_location), _now()),
    )
    conn.commit()
    return {"event_id": event_id, "accepted": True, "duplicate": False}

def list_events(
    status: str = None, device_id: str = None,
    start_time_from: str = None, start_time_to: str = None,
    limit: int = 50, offset: int = 0,
):
    conn = get_db()
    clauses = []
    params = []

    if status:
        clauses.append("e.review_status = ?")
        params.append(status)
    if device_id:
        clauses.append("e.device_id = ?")
        params.append(device_id)
    if start_time_from:
        clauses.append("e.start_time >= ?")
        params.append(start_time_from)
    if start_time_to:
        clauses.append("e.start_time <= ?")
        params.append(start_time_to)

    where = "WHERE " + " AND ".join(clauses) if clauses else ""

    count_sql = f"SELECT COUNT(*) FROM events e {where}"
    total = conn.execute(count_sql, params).fetchone()[0]

    rows = conn.execute(
        f"""SELECT e.* FROM events e {where}
            ORDER BY e.created_at DESC LIMIT ? OFFSET ?""",
        params + [limit, offset],
    ).fetchall()

    items = []
    for r in rows:
        thumb = conn.execute(
            "SELECT file_path FROM evidence_files WHERE event_id=? AND evidence_type='frame_peak' LIMIT 1",
            (r["event_id"],),
        ).fetchone()
        thumbnail_url = (
            f"/evidence/{r['event_id']}/{thumb['file_path'].split('/')[-1]}"
            if thumb else ""
        )
        items.append({
            "event_id": r["event_id"],
            "device_id": r["device_id"],
            "start_time": r["start_time"],
            "duration_seconds": r["duration_seconds"],
            "vehicle_class": r["vehicle_class"],
            "confidence": r["confidence"],
            "review_status": r["review_status"],
            "thumbnail_url": thumbnail_url,
        })

    return {"items": items, "total": total}

def get_event(event_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM events WHERE event_id=?", (event_id,)).fetchone()
    if not row:
        return None

    evidence_rows = conn.execute(
        "SELECT * FROM evidence_files WHERE event_id=? ORDER BY evidence_type",
        (event_id,),
    ).fetchall()

    evidence = []
    for ef in evidence_rows:
        filename = ef["file_path"].split("/")[-1]
        evidence.append({
            "id": ef["id"],
            "event_id": ef["event_id"],
            "evidence_type": ef["evidence_type"],
            "mime_type": ef["mime_type"],
            "url": f"/evidence/{event_id}/{filename}",
        })

    return {
        "event_id": row["event_id"],
        "device_id": row["device_id"],
        "start_time": row["start_time"],
        "end_time": row["end_time"],
        "duration_seconds": row["duration_seconds"],
        "roi_id": row["roi_id"],
        "track_id": row["track_id"],
        "vehicle_class": row["vehicle_class"],
        "vehicle_box": json.loads(row["vehicle_box_json"]),
        "confidence": row["confidence"],
        "gps_location": json.loads(row["gps_json"]),
        "review_status": row["review_status"],
        "operator_note": row["operator_note"],
        "created_at": row["created_at"],
        "reviewed_at": row["reviewed_at"],
        "evidence_files": evidence,
    }

def update_review(event_id: str, review_status: str, operator_note: str):
    conn = get_db()
    now = _now()
    conn.execute(
        "UPDATE events SET review_status=?, operator_note=?, reviewed_at=? WHERE event_id=?",
        (review_status, operator_note, now, event_id),
    )
    conn.commit()
    return {
        "event_id": event_id,
        "review_status": review_status,
        "operator_note": operator_note,
        "reviewed_at": now,
    }
```

- [ ] **Step 3: 编写 events router**

Rewrite `backend/app/routers/events.py`:

```python
from fastapi import APIRouter, Query, HTTPException
from app.models.event import EventCreate, ReviewUpdate
from app.services import event_service

router = APIRouter(prefix="/api/events", tags=["events"])

@router.post("")
def create_event(body: EventCreate):
    gps = body.gps_location.model_dump() if body.gps_location else {}
    return event_service.create_event(
        event_id=body.event_id, device_id=body.device_id,
        start_time=body.start_time, end_time=body.end_time,
        duration_seconds=body.duration_seconds, roi_id=body.roi_id,
        track_id=body.track_id, vehicle_class=body.vehicle_class,
        vehicle_box=body.vehicle_box.model_dump(),
        confidence=body.confidence, gps_location=gps,
    )

@router.get("")
def list_events(
    status: str = Query(None),
    device_id: str = Query(None),
    start_time_from: str = Query(None),
    start_time_to: str = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
):
    return event_service.list_events(
        status=status, device_id=device_id,
        start_time_from=start_time_from, start_time_to=start_time_to,
        limit=limit, offset=offset,
    )

@router.get("/{event_id}")
def get_event(event_id: str):
    event = event_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.patch("/{event_id}/review")
def update_review(event_id: str, body: ReviewUpdate):
    if body.review_status not in ("confirmed", "rejected"):
        raise HTTPException(status_code=422, detail="review_status must be 'confirmed' or 'rejected'")
    return event_service.update_review(event_id, body.review_status, body.operator_note)
```

- [ ] **Step 4: 编写参数化事件测试 (backend/tests/test_events.py)**

```python
import pytest

EVENT_PAYLOAD = {
    "event_id": "evt_001",
    "device_id": "vivo_001",
    "start_time": "2026-05-05T10:00:00+08:00",
    "end_time": "2026-05-05T10:00:12+08:00",
    "duration_seconds": 12,
    "roi_id": "roi_default",
    "track_id": "track_42",
    "vehicle_class": "car",
    "vehicle_box": {"x": 120, "y": 220, "width": 180, "height": 90},
    "confidence": 0.86,
    "gps_location": {"lat": 31.23, "lng": 121.47, "accuracy_meters": 5.0},
}

def test_create_event(client):
    resp = client.post("/api/events", json=EVENT_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["accepted"] is True
    assert data["duplicate"] is False

def test_duplicate_event(client):
    client.post("/api/events", json=EVENT_PAYLOAD)
    resp = client.post("/api/events", json=EVENT_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["duplicate"] is True
    assert data["accepted"] is False

def test_list_events_pagination(client):
    for i in range(5):
        p = {**EVENT_PAYLOAD, "event_id": f"evt_{i:03d}",
             "start_time": f"2026-05-05T10:00:{i:02d}+08:00",
             "end_time": f"2026-05-05T10:00:{i+5:02d}+08:00",
             "track_id": f"track_{i}"}
        client.post("/api/events", json=p)
    resp = client.get("/api/events?limit=2&offset=0")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 5

def test_list_events_filter_by_status(client):
    p = {**EVENT_PAYLOAD, "event_id": "evt_filter_status"}
    client.post("/api/events", json=p)
    resp = client.get("/api/events?status=pending")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(i["review_status"] == "pending" for i in items)

def test_list_events_filter_by_time_range(client):
    t1 = {**EVENT_PAYLOAD, "event_id": "evt_t1",
          "start_time": "2026-05-05T08:00:00+08:00",
          "end_time": "2026-05-05T08:00:12+08:00"}
    t2 = {**EVENT_PAYLOAD, "event_id": "evt_t2",
          "start_time": "2026-05-05T12:00:00+08:00",
          "end_time": "2026-05-05T12:00:12+08:00"}
    client.post("/api/events", json=t1)
    client.post("/api/events", json=t2)
    resp = client.get("/api/events?start_time_from=2026-05-05T09:00:00%2B08:00&start_time_to=2026-05-05T13:00:00%2B08:00")
    items = resp.json()["items"]
    eids = [e["event_id"] for e in items]
    assert "evt_t2" in eids
    assert "evt_t1" not in eids

def test_get_event_detail(client):
    client.post("/api/events", json=EVENT_PAYLOAD)
    resp = client.get("/api/events/evt_001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["vehicle_class"] == "car"
    assert data["vehicle_box"]["width"] == 180
    assert data["evidence_files"] == []

def test_event_not_found_returns_404(client):
    resp = client.get("/api/events/nonexistent")
    assert resp.status_code == 404

def test_update_review_confirmed(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_rev"})
    resp = client.patch("/api/events/evt_rev/review", json={
        "review_status": "confirmed",
        "operator_note": "证据清晰",
    })
    assert resp.status_code == 200
    assert resp.json()["review_status"] == "confirmed"

def test_review_invalid_status_returns_422(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_inv"})
    resp = client.patch("/api/events/evt_inv/review", json={"review_status": "maybe"})
    assert resp.status_code == 422

def test_duplicate_upload_does_not_overwrite_review(client):
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_keep"})
    client.patch("/api/events/evt_keep/review", json={
        "review_status": "confirmed", "operator_note": "已确认",
    })
    client.post("/api/events", json={**EVENT_PAYLOAD, "event_id": "evt_keep"})
    resp = client.get("/api/events/evt_keep")
    assert resp.json()["review_status"] == "confirmed"
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd backend && python -m pytest tests/test_events.py -v
```

Expected: 10 PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/event.py backend/app/services/event_service.py backend/app/routers/events.py backend/tests/test_events.py
git commit -m "feat: add event CRUD, idempotent creation, and review endpoints"
```

---

### Task 5: 证据上传、统计概览 (TDD)

**Files:**
- Create: `backend/app/models/evidence.py`
- Create: `backend/app/services/evidence_service.py`
- Create: `backend/app/services/stats_service.py`
- Create: `backend/app/routers/evidence.py` (rewrite from placeholder)
- Create: `backend/app/routers/stats.py` (rewrite from placeholder)
- Create: `backend/tests/test_evidence.py`
- Create: `backend/tests/test_stats.py`

- [ ] **Step 1: 编写 evidence models (backend/app/models/evidence.py)**

```python
from pydantic import BaseModel

class EvidenceResponse(BaseModel):
    event_id: str
    type: str
    stored: bool
    url: str
```

- [ ] **Step 2: 编写 evidence_service (backend/app/services/evidence_service.py)**

```python
import os
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.config import settings

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).isoformat()

def save_evidence(event_id: str, evidence_type: str, file_content: bytes, filename: str, mime_type: str):
    event_dir = os.path.join(settings.evidence_dir, event_id)
    os.makedirs(event_dir, exist_ok=True)
    dest = os.path.join(event_dir, filename)
    with open(dest, "wb") as f:
        f.write(file_content)
    size = os.path.getsize(dest)

    conn = get_db()
    conn.execute(
        """INSERT INTO evidence_files (event_id, evidence_type, file_path, mime_type, size_bytes, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (event_id, evidence_type, dest, mime_type, size, _now()),
    )
    conn.commit()
    return {"event_id": event_id, "type": evidence_type, "stored": True, "url": f"/evidence/{event_id}/{filename}"}
```

- [ ] **Step 3: 编写 stats_service (backend/app/services/stats_service.py)**

```python
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.config import settings

def _now():
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz)

def get_overview():
    conn = get_db()
    now = _now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    total_today = conn.execute(
        "SELECT COUNT(*) FROM events WHERE created_at >= ?", (today_start,)
    ).fetchone()[0]

    pending = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='pending'").fetchone()[0]
    confirmed = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='confirmed'").fetchone()[0]
    rejected = conn.execute("SELECT COUNT(*) FROM events WHERE review_status='rejected'").fetchone()[0]

    threshold = (now - timedelta(seconds=settings.online_threshold_seconds)).isoformat()
    online = conn.execute(
        "SELECT COUNT(*) FROM devices WHERE last_seen_at >= ?", (threshold,)
    ).fetchone()[0]

    recent_rows = conn.execute(
        "SELECT e.* FROM events e ORDER BY e.created_at DESC LIMIT 10"
    ).fetchall()

    recent = []
    for r in recent_rows:
        thumb = conn.execute(
            "SELECT file_path FROM evidence_files WHERE event_id=? AND evidence_type='frame_peak' LIMIT 1",
            (r["event_id"],),
        ).fetchone()
        thumbnail_url = (
            f"/evidence/{r['event_id']}/{thumb['file_path'].split('/')[-1]}"
            if thumb else ""
        )
        recent.append({
            "event_id": r["event_id"],
            "device_id": r["device_id"],
            "start_time": r["start_time"],
            "duration_seconds": r["duration_seconds"],
            "vehicle_class": r["vehicle_class"],
            "confidence": r["confidence"],
            "review_status": r["review_status"],
            "thumbnail_url": thumbnail_url,
        })

    return {
        "total_events_today": total_today,
        "pending_review_count": pending,
        "confirmed_count": confirmed,
        "rejected_count": rejected,
        "online_device_count": online,
        "recent_events": recent,
    }
```

- [ ] **Step 4: 编写 evidence router**

Rewrite `backend/app/routers/evidence.py`:

```python
from fastapi import APIRouter, UploadFile, File, Form
from app.services import evidence_service

router = APIRouter(prefix="/api/events", tags=["evidence"])

@router.post("/{event_id}/evidence")
def upload_evidence(
    event_id: str,
    type: str = Form(...),
    file: UploadFile = File(...),
):
    content = file.file.read()
    return evidence_service.save_evidence(
        event_id=event_id,
        evidence_type=type,
        file_content=content,
        filename=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
    )
```

- [ ] **Step 5: 编写 stats router**

Rewrite `backend/app/routers/stats.py`:

```python
from fastapi import APIRouter
from app.services import stats_service

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/overview")
def get_overview():
    return stats_service.get_overview()
```

- [ ] **Step 6: 编写证据测试 (backend/tests/test_evidence.py)**

```python
import io

BASE_EVENT = {
    "event_id": "evt_ev",
    "device_id": "vivo_001",
    "start_time": "2026-05-05T10:00:00+08:00",
    "end_time": "2026-05-05T10:00:12+08:00",
    "duration_seconds": 12,
    "roi_id": "roi_default",
    "track_id": "track_42",
    "vehicle_class": "car",
    "vehicle_box": {"x": 0, "y": 0, "width": 100, "height": 100},
    "confidence": 0.86,
}

def test_upload_evidence(client):
    client.post("/api/events", json=BASE_EVENT)
    fake_img = io.BytesIO(b"\xff\xd8\xff\x00fake-jpeg")
    resp = client.post(
        "/api/events/evt_ev/evidence",
        files={"file": ("frame_peak.jpg", fake_img, "image/jpeg")},
        data={"type": "frame_peak"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["stored"] is True
    assert data["type"] == "frame_peak"
    assert "frame_peak.jpg" in data["url"]

def test_evidence_appears_in_event_detail(client):
    client.post("/api/events", json=BASE_EVENT)
    fake_img = io.BytesIO(b"fakeimg")
    client.post(
        "/api/events/evt_ev/evidence",
        files={"file": ("frame_peak.jpg", fake_img, "image/jpeg")},
        data={"type": "frame_peak"},
    )
    resp = client.get("/api/events/evt_ev")
    assert len(resp.json()["evidence_files"]) == 1
```

- [ ] **Step 7: 编写统计测试 (backend/tests/test_stats.py)**

```python
BASE_EVENT = {
    "event_id": "evt_s1",
    "device_id": "vivo_001",
    "start_time": "2026-05-05T10:00:00+08:00",
    "end_time": "2026-05-05T10:00:12+08:00",
    "duration_seconds": 12,
    "roi_id": "roi_default",
    "track_id": "track_1",
    "vehicle_class": "car",
    "vehicle_box": {"x": 0, "y": 0, "width": 100, "height": 100},
    "confidence": 0.8,
}

def test_stats_overview_structure(client):
    resp = client.get("/api/stats/overview")
    assert resp.status_code == 200
    data = resp.json()
    for key in ["total_events_today", "pending_review_count", "confirmed_count",
                "rejected_count", "online_device_count", "recent_events"]:
        assert key in data
    assert isinstance(data["recent_events"], list)

def test_stats_counts_reflect_events(client):
    client.post("/api/events", json={**BASE_EVENT, "event_id": "evt_s1"})
    client.post("/api/events", json={**BASE_EVENT, "event_id": "evt_s2", "vehicle_class": "truck"})
    client.patch("/api/events/evt_s1/review", json={"review_status": "confirmed"})
    resp = client.get("/api/stats/overview")
    data = resp.json()
    assert data["confirmed_count"] == 1
    assert data["pending_review_count"] == 1

def test_online_device_count(client):
    client.post("/api/devices/register", json={
        "device_id": "vivo_001",
        "device_name": "vivo X100",
        "app_version": "0.1.0",
        "model_version": "yolov8n-int8",
    })
    resp = client.get("/api/stats/overview")
    assert resp.json()["online_device_count"] == 1
```

- [ ] **Step 8: 运行全部后端测试**

```bash
cd backend && python -m pytest tests/ -v
```

Expected: all tests pass (health 1 + devices 4 + events 10 + evidence 2 + stats 3 = 20)

- [ ] **Step 9: Commit**

```bash
git add backend/app/models/evidence.py backend/app/services/evidence_service.py backend/app/services/stats_service.py backend/app/routers/evidence.py backend/app/routers/stats.py backend/tests/test_evidence.py backend/tests/test_stats.py
git commit -m "feat: add evidence upload, stats overview, and static file serving"
```

---

### Task 6: 前端项目骨架

**Files:**
- Create: All files under `frontend/`

- [ ] **Step 1: 初始化 Vite + React + TypeScript 项目**

```bash
cd /home/yrd/projects/emergency-lane-demo-new
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: 配置 Tailwind 和 Vite proxy**

`frontend/src/index.css`:
```css
@import "tailwindcss";
```

`frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/evidence': 'http://localhost:8000',
    },
  },
})
```

- [ ] **Step 3: 创建 TypeScript 类型定义 (frontend/src/types/index.ts)**

```typescript
export interface VehicleBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GpsLocation {
  lat: number;
  lng: number;
  accuracy_meters: number;
}

export interface EvidenceFile {
  id: number;
  event_id: string;
  evidence_type: string;
  mime_type: string;
  url: string;
}

export interface EventDetail {
  event_id: string;
  device_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  roi_id: string;
  track_id: string;
  vehicle_class: string;
  vehicle_box: VehicleBox;
  confidence: number;
  gps_location: GpsLocation;
  review_status: string;
  operator_note: string;
  created_at: string;
  reviewed_at: string | null;
  evidence_files: EvidenceFile[];
}

export interface EventListItem {
  event_id: string;
  device_id: string;
  start_time: string;
  duration_seconds: number;
  vehicle_class: string;
  confidence: number;
  review_status: string;
  thumbnail_url: string;
}

export interface EventListResponse {
  items: EventListItem[];
  total: number;
}

export interface OverviewStats {
  total_events_today: number;
  pending_review_count: number;
  confirmed_count: number;
  rejected_count: number;
  online_device_count: number;
  recent_events: EventListItem[];
}

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  app_version: string;
  model_version: string;
  registered_at: string;
  last_seen_at: string;
  battery_level: number;
  thermal_state: string;
  fps: number;
  pending_upload_count: number;
  is_online: boolean;
}
```

- [ ] **Step 4: 创建 API client (frontend/src/api/client.ts)**

```typescript
const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${body}`);
  }
  return resp.json();
}

export const api = {
  getStats: () =>
    request<import('../types').OverviewStats>('/stats/overview'),

  getEvents: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<import('../types').EventListResponse>(`/events?${qs}`);
  },

  getEvent: (id: string) =>
    request<import('../types').EventDetail>(`/events/${id}`),

  reviewEvent: (id: string, review_status: string, operator_note: string) =>
    request(`/events/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status, operator_note }),
    }),

  getDevices: () =>
    request<import('../types').DeviceInfo[]>('/devices'),
};
```

- [ ] **Step 5: 创建 Layout 组件 (frontend/src/components/Layout.tsx)**

```tsx
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '概览' },
  { to: '/events', label: '事件' },
  { to: '/devices', label: '设备' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-slate-800 text-white flex flex-col">
        <div className="p-4 text-lg font-bold border-b border-slate-700">
          应急车道检测
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 6: 更新 App.tsx 添加路由 (frontend/src/App.tsx)**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import DeviceStatus from './pages/DeviceStatus';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<EventList />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/devices" element={<DeviceStatus />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
```

- [ ] **Step 7: 创建页面占位组件**

Create `frontend/src/pages/` directory, then write each placeholder:

`Dashboard.tsx`:
```tsx
export default function Dashboard() {
  return <div className="text-gray-400">加载中...</div>;
}
```

`EventList.tsx`:
```tsx
export default function EventList() {
  return <div className="text-gray-400">加载中...</div>;
}
```

`EventDetail.tsx`:
```tsx
export default function EventDetail() {
  return <div className="text-gray-400">加载中...</div>;
}
```

`DeviceStatus.tsx`:
```tsx
export default function DeviceStatus() {
  return <div className="text-gray-400">加载中...</div>;
}
```

- [ ] **Step 8: 删除 Vite 默认样板文件**

```bash
rm -f frontend/src/App.css frontend/src/assets/react.svg
```

Update `frontend/src/main.tsx` to remove default CSS import:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 9: 验证前端可启动并路由正确**

```bash
cd frontend && npm run dev
```

打开 http://localhost:5173，确认侧边栏导航存在，点击各路由不报错。

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: add frontend skeleton with routing and layout"
```

---

### Task 7: Dashboard 页面

**Files:**
- Create: `frontend/src/hooks/usePolling.ts`
- Create: `frontend/src/components/StatCard.tsx`
- Create: `frontend/src/components/StatusBadge.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: 创建 usePolling hook (frontend/src/hooks/usePolling.ts)**

```typescript
import { useEffect, useState } from 'react';

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number
): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetcher, intervalMs]);

  return { data, error };
}
```

- [ ] **Step 2: 创建 StatCard 组件 (frontend/src/components/StatCard.tsx)**

```tsx
export default function StatCard({
  label,
  value,
  color = 'bg-white',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className={`${color} rounded-lg shadow p-4 flex flex-col items-center`}>
      <span className="text-3xl font-bold text-gray-800">{value}</span>
      <span className="text-sm text-gray-500 mt-1">{label}</span>
    </div>
  );
}
```

- [ ] **Step 3: 创建 StatusBadge 组件 (frontend/src/components/StatusBadge.tsx)**

```tsx
const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: '待复核', cls: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', cls: 'bg-green-100 text-green-800' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-800' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
```

- [ ] **Step 4: 实现 Dashboard 页面 (frontend/src/pages/Dashboard.tsx)**

```tsx
import { useNavigate } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import type { OverviewStats } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, error } = usePolling<OverviewStats>(() => api.getStats(), 5000);

  if (error) return <div className="text-red-500">加载失败: {error}</div>;
  if (!data) return <div className="text-gray-400">加载中...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">概览</h1>
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="今日事件" value={data.total_events_today} />
        <StatCard label="待复核" value={data.pending_review_count} color="bg-yellow-50" />
        <StatCard label="已确认" value={data.confirmed_count} color="bg-green-50" />
        <StatCard label="已驳回" value={data.rejected_count} color="bg-red-50" />
        <StatCard label="在线设备" value={data.online_device_count} color="bg-blue-50" />
      </div>

      <h2 className="text-lg font-semibold mb-2">最近事件</h2>
      <div className="space-y-2">
        {data.recent_events.map((evt) => (
          <div
            key={evt.event_id}
            className="bg-white rounded shadow p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/events/${evt.event_id}`)}
          >
            {evt.thumbnail_url ? (
              <img src={evt.thumbnail_url} alt="" className="w-20 h-14 object-cover rounded" />
            ) : (
              <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">无图</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{evt.event_id}</div>
              <div className="text-xs text-gray-500">
                {evt.start_time} · {evt.duration_seconds}秒 · {evt.vehicle_class}
              </div>
            </div>
            <div className="text-xs text-gray-500">{(evt.confidence * 100).toFixed(0)}%</div>
            <StatusBadge status={evt.review_status} />
          </div>
        ))}
        {data.recent_events.length === 0 && (
          <div className="text-gray-400 text-sm">暂无事件</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/usePolling.ts frontend/src/components/StatCard.tsx frontend/src/components/StatusBadge.tsx frontend/src/pages/Dashboard.tsx
git commit -m "feat: add dashboard page with stats polling"
```

---

### Task 8: 事件列表页

**Files:**
- Create: `frontend/src/hooks/useEvents.ts`
- Create: `frontend/src/components/FilterBar.tsx`
- Create: `frontend/src/components/EventTable.tsx`
- Modify: `frontend/src/pages/EventList.tsx`

- [ ] **Step 1: 创建 useEvents hook (frontend/src/hooks/useEvents.ts)**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { EventListResponse } from '../types';

export function useEvents() {
  const [data, setData] = useState<EventListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    limit: '50',
    offset: '0',
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getEvents(filters);
      setData(result);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { data, loading, error, filters, setFilters, refetch: fetchEvents };
}
```

- [ ] **Step 2: 创建 FilterBar 组件 (frontend/src/components/FilterBar.tsx)**

```tsx
export default function FilterBar({
  filters,
  onChange,
}: {
  filters: Record<string, string>;
  onChange: (f: Record<string, string>) => void;
}) {
  const update = (key: string, value: string) => {
    const next = { ...filters, [key]: value, offset: '0' };
    if (!value) delete next[key];
    onChange(next);
  };

  return (
    <div className="flex gap-3 mb-4 flex-wrap items-end">
      <label className="flex flex-col text-xs text-gray-500">
        状态
        <select
          className="border rounded px-2 py-1 text-sm mt-0.5"
          value={filters.status || ''}
          onChange={(e) => update('status', e.target.value)}
        >
          <option value="">全部</option>
          <option value="pending">待复核</option>
          <option value="confirmed">已确认</option>
          <option value="rejected">已驳回</option>
        </select>
      </label>
      <label className="flex flex-col text-xs text-gray-500">
        设备
        <input
          className="border rounded px-2 py-1 text-sm mt-0.5 w-32"
          value={filters.device_id || ''}
          onChange={(e) => update('device_id', e.target.value)}
          placeholder="设备 ID"
        />
      </label>
      <label className="flex flex-col text-xs text-gray-500">
        开始时间起
        <input
          type="datetime-local"
          className="border rounded px-2 py-1 text-sm mt-0.5"
          value={(filters.start_time_from || '').replace('%2B', '+').slice(0, 19) || ''}
          onChange={(e) => update('start_time_from', e.target.value ? e.target.value + ':00+08:00' : '')}
        />
      </label>
      <label className="flex flex-col text-xs text-gray-500">
        开始时间止
        <input
          type="datetime-local"
          className="border rounded px-2 py-1 text-sm mt-0.5"
          value={(filters.start_time_to || '').replace('%2B', '+').slice(0, 19) || ''}
          onChange={(e) => update('start_time_to', e.target.value ? e.target.value + ':00+08:00' : '')}
        />
      </label>
      <button
        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        onClick={() => onChange({ limit: '50', offset: '0' })}
      >
        重置
      </button>
    </div>
  );
}
```

- [ ] **Step 3: 创建 EventTable 组件 (frontend/src/components/EventTable.tsx)**

```tsx
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import type { EventListItem } from '../types';

export default function EventTable({
  items,
  total,
  offset,
  limit,
  onPage,
}: {
  items: EventListItem[];
  total: number;
  offset: number;
  limit: number;
  onPage: (offset: number) => void;
}) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div>
      <div className="text-xs text-gray-500 mb-2">共 {total} 条</div>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b">
            <th className="p-2">缩略图</th>
            <th className="p-2">事件 ID</th>
            <th className="p-2">时间</th>
            <th className="p-2">设备</th>
            <th className="p-2">时长</th>
            <th className="p-2">类别</th>
            <th className="p-2">置信度</th>
            <th className="p-2">状态</th>
          </tr>
        </thead>
        <tbody>
          {items.map((evt) => (
            <tr
              key={evt.event_id}
              className="border-b hover:bg-gray-50 cursor-pointer text-sm"
              onClick={() => navigate(`/events/${evt.event_id}`)}
            >
              <td className="p-2">
                {evt.thumbnail_url ? (
                  <img src={evt.thumbnail_url} alt="" className="w-16 h-10 object-cover rounded" />
                ) : (
                  <div className="w-16 h-10 bg-gray-200 rounded" />
                )}
              </td>
              <td className="p-2 font-mono text-xs">{evt.event_id}</td>
              <td className="p-2 text-xs">{evt.start_time}</td>
              <td className="p-2 text-xs">{evt.device_id}</td>
              <td className="p-2 text-xs">{evt.duration_seconds}秒</td>
              <td className="p-2 text-xs">{evt.vehicle_class}</td>
              <td className="p-2 text-xs">{(evt.confidence * 100).toFixed(0)}%</td>
              <td className="p-2"><StatusBadge status={evt.review_status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          <button
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            onClick={() => onPage(Math.max(0, offset - limit))}
          >
            上一页
          </button>
          <span className="text-sm py-1 text-gray-500">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            onClick={() => onPage(offset + limit)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 实现 EventList 页面 (frontend/src/pages/EventList.tsx)**

```tsx
import { useEvents } from '../hooks/useEvents';
import FilterBar from '../components/FilterBar';
import EventTable from '../components/EventTable';

export default function EventList() {
  const { data, loading, error, filters, setFilters } = useEvents();

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">事件列表</h1>
      <FilterBar filters={filters} onChange={setFilters} />
      {error && <div className="text-red-500 text-sm mb-2">加载失败: {error}</div>}
      {loading && !data && <div className="text-gray-400">加载中...</div>}
      {data && (
        <EventTable
          items={data.items}
          total={data.total}
          offset={parseInt(filters.offset || '0')}
          limit={parseInt(filters.limit || '50')}
          onPage={(newOffset) => setFilters({ ...filters, offset: String(newOffset) })}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useEvents.ts frontend/src/components/FilterBar.tsx frontend/src/components/EventTable.tsx frontend/src/pages/EventList.tsx
git commit -m "feat: add event list page with filtering and pagination"
```

---

### Task 9: 事件详情页与复核

**Files:**
- Create: `frontend/src/hooks/useEventDetail.ts`
- Create: `frontend/src/hooks/useReview.ts`
- Create: `frontend/src/components/EvidenceViewer.tsx`
- Create: `frontend/src/components/ReviewPanel.tsx`
- Modify: `frontend/src/pages/EventDetail.tsx`

- [ ] **Step 1: 创建 useEventDetail hook (frontend/src/hooks/useEventDetail.ts)**

```typescript
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { EventDetail } from '../types';

export function useEventDetail(id: string) {
  const [data, setData] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    api.getEvent(id)
      .then((d) => { setData(d); setError(null); })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [id]);

  return { data, loading, error, refetch: fetch };
}
```

- [ ] **Step 2: 创建 useReview hook (frontend/src/hooks/useReview.ts)**

```typescript
import { useState } from 'react';
import { api } from '../api/client';

export function useReview(eventId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (review_status: string, operator_note: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.reviewEvent(eventId, review_status, operator_note);
      return true;
    } catch (e: unknown) {
      setError((e as Error).message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, error };
}
```

- [ ] **Step 3: 创建 EvidenceViewer 组件 (frontend/src/components/EvidenceViewer.tsx)**

```tsx
import { useState } from 'react';
import type { EvidenceFile } from '../types';

export default function EvidenceViewer({ files }: { files: EvidenceFile[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const images = files.filter((f) => f.mime_type.startsWith('image/'));
  const videos = files.filter((f) => f.mime_type.startsWith('video/'));

  if (images.length === 0 && videos.length === 0) {
    return <div className="text-gray-400 text-sm">暂无证据文件</div>;
  }

  const allMedia = [...images, ...videos];

  return (
    <div>
      <div className="flex gap-2 mb-2 flex-wrap">
        {images.map((img, i) => (
          <button
            key={img.id}
            className={`px-3 py-1 text-xs rounded ${activeIdx === i ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveIdx(i)}
          >
            {img.evidence_type}
          </button>
        ))}
        {videos.map((vid, i) => (
          <button
            key={vid.id}
            className={`px-3 py-1 text-xs rounded ${activeIdx === images.length + i ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveIdx(images.length + i)}
          >
            视频片段
          </button>
        ))}
      </div>
      <div className="bg-black rounded overflow-hidden flex items-center justify-center min-h-[300px]">
        {activeIdx < images.length ? (
          <img
            src={images[activeIdx].url}
            alt={images[activeIdx].evidence_type}
            className="max-w-full max-h-[500px] object-contain"
          />
        ) : (
          <video
            controls
            className="max-w-full max-h-[500px]"
            src={videos[activeIdx - images.length]?.url}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 ReviewPanel 组件 (frontend/src/components/ReviewPanel.tsx)**

```tsx
import { useState } from 'react';

export default function ReviewPanel({
  reviewStatus,
  operatorNote,
  onSubmit,
  submitting,
}: {
  reviewStatus: string;
  operatorNote: string;
  onSubmit: (status: string, note: string) => Promise<boolean>;
  submitting: boolean;
}) {
  const [note, setNote] = useState(operatorNote);
  const isReviewed = reviewStatus !== 'pending';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">人工复核</h3>
      {isReviewed ? (
        <div className="text-sm text-gray-600">
          已复核 ({reviewStatus === 'confirmed' ? '已确认' : '已驳回'}) · {operatorNote || '无备注'}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            placeholder="复核备注（可选）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              disabled={submitting}
              onClick={() => onSubmit('confirmed', note)}
            >
              确认占用
            </button>
            <button
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              disabled={submitting}
              onClick={() => onSubmit('rejected', note)}
            >
              驳回
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 实现 EventDetail 页面 (frontend/src/pages/EventDetail.tsx)**

```tsx
import { useParams } from 'react-router-dom';
import { useEventDetail } from '../hooks/useEventDetail';
import { useReview } from '../hooks/useReview';
import StatusBadge from '../components/StatusBadge';
import EvidenceViewer from '../components/EvidenceViewer';
import ReviewPanel from '../components/ReviewPanel';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useEventDetail(id!);
  const { submit, submitting } = useReview(id!);

  if (loading) return <div className="text-gray-400">加载中...</div>;
  if (error) return <div className="text-red-500">加载失败: {error}</div>;
  if (!data) return null;

  const handleReview = async (status: string, note: string) => {
    const ok = await submit(status, note);
    if (ok) refetch();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">事件详情</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-2 text-sm">
          <div><span className="text-gray-500">事件 ID:</span> <span className="font-mono">{data.event_id}</span></div>
          <div><span className="text-gray-500">设备:</span> {data.device_id}</div>
          <div><span className="text-gray-500">开始时间:</span> {data.start_time}</div>
          <div><span className="text-gray-500">结束时间:</span> {data.end_time}</div>
          <div><span className="text-gray-500">持续时长:</span> {data.duration_seconds}秒</div>
          <div><span className="text-gray-500">轨迹 ID:</span> {data.track_id}</div>
          <div><span className="text-gray-500">车辆类别:</span> {data.vehicle_class}</div>
          <div><span className="text-gray-500">置信度:</span> {(data.confidence * 100).toFixed(0)}%</div>
          <div><span className="text-gray-500">GPS:</span> {data.gps_location.lat.toFixed(4)}, {data.gps_location.lng.toFixed(4)}</div>
          <div><span className="text-gray-500">状态:</span> <StatusBadge status={data.review_status} /></div>
        </div>
        <ReviewPanel
          reviewStatus={data.review_status}
          operatorNote={data.operator_note}
          onSubmit={handleReview}
          submitting={submitting}
        />
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">证据文件</h2>
        <EvidenceViewer files={data.evidence_files} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useEventDetail.ts frontend/src/hooks/useReview.ts frontend/src/components/EvidenceViewer.tsx frontend/src/components/ReviewPanel.tsx frontend/src/pages/EventDetail.tsx
git commit -m "feat: add event detail page with evidence viewer and review panel"
```

---

### Task 10: 设备状态页

**Files:**
- Modify: `frontend/src/pages/DeviceStatus.tsx`

- [ ] **Step 1: 实现 DeviceStatus 页面**

```tsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { DeviceInfo } from '../types';

export default function DeviceStatus() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDevices()
      .then((d) => { setDevices(d); setError(null); })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400">加载中...</div>;
  if (error) return <div className="text-red-500">加载失败: {error}</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">设备状态</h1>
      {devices.length === 0 ? (
        <div className="text-gray-400">暂无设备</div>
      ) : (
        <div className="grid gap-4">
          {devices.map((dev) => (
            <div key={dev.device_id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">{dev.device_name}</div>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${dev.is_online ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">设备 ID:</span> {dev.device_id}</div>
                <div><span className="text-gray-500">App 版本:</span> {dev.app_version}</div>
                <div><span className="text-gray-500">模型版本:</span> {dev.model_version}</div>
                <div><span className="text-gray-500">最后心跳:</span> {dev.last_seen_at}</div>
                <div><span className="text-gray-500">FPS:</span> {dev.fps}</div>
                <div><span className="text-gray-500">电量:</span> {dev.battery_level}%</div>
                <div><span className="text-gray-500">温度:</span> {dev.thermal_state}</div>
                <div><span className="text-gray-500">待上传:</span> {dev.pending_upload_count}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/DeviceStatus.tsx
git commit -m "feat: add device status page"
```

---

### Task 11: Seed 数据脚本

**Files:**
- Create: `backend/seed_data.py`

- [ ] **Step 1: 编写 seed_data.py**

```python
"""注入模拟数据：2 台设备 + 10 个事件 (覆盖 pending/confirmed/rejected)"""
import requests
from datetime import datetime, timezone, timedelta

BASE = "http://localhost:8000/api"
tz = timezone(timedelta(hours=8))

def post(path, body):
    r = requests.post(f"{BASE}{path}", json=body)
    print(f"POST {path}: {r.status_code} {r.json()}")

def patch(path, body):
    r = requests.patch(f"{BASE}{path}", json=body)
    print(f"PATCH {path}: {r.status_code} {r.json()}")

# Register devices
for dev_id, dev_name in [("vivo_x100_001", "vivo X100 #1"), ("vivo_x100_002", "vivo X100 #2")]:
    post("/devices/register", {
        "device_id": dev_id, "device_name": dev_name,
        "app_version": "0.1.0", "model_version": "yolov8n-int8-20260505",
    })
    post("/devices/heartbeat", {
        "device_id": dev_id, "battery_level": 85.0,
        "thermal_state": "normal", "fps": 15.0, "pending_upload_count": 0,
    })

# Create 10 events
events = [
    ("evt_seed_01", "vivo_x100_001", "confirmed", "证据清晰，确认占用"),
    ("evt_seed_02", "vivo_x100_001", "rejected", "紧急工程车辆，非占用"),
    ("evt_seed_03", "vivo_x100_002", "pending", ""),
    ("evt_seed_04", "vivo_x100_002", "confirmed", "长时间占用应急车道"),
    ("evt_seed_05", "vivo_x100_001", "pending", ""),
    ("evt_seed_06", "vivo_x100_001", "rejected", "短暂变道，未停留"),
    ("evt_seed_07", "vivo_x100_002", "pending", ""),
    ("evt_seed_08", "vivo_x100_002", "pending", ""),
    ("evt_seed_09", "vivo_x100_001", "confirmed", "占用超30秒"),
    ("evt_seed_10", "vivo_x100_002", "pending", ""),
]

now = datetime.now(tz)
for i, (eid, dev, status, note) in enumerate(events):
    start = (now - timedelta(minutes=30 - i * 3)).isoformat()
    end = (now - timedelta(minutes=30 - i * 3 - 1)).isoformat()
    post("/events", {
        "event_id": eid, "device_id": dev,
        "start_time": start, "end_time": end,
        "duration_seconds": 8 + i % 5,
        "roi_id": "roi_default", "track_id": f"track_{i:02d}",
        "vehicle_class": ["car", "truck", "bus", "car"][i % 4],
        "vehicle_box": {"x": 120 + i * 10, "y": 220, "width": 180, "height": 90},
        "confidence": 0.7 + (i % 5) * 0.05,
        "gps_location": {"lat": 31.23, "lng": 121.47, "accuracy_meters": 5.0},
    })
    if status != "pending":
        patch(f"/events/{eid}/review", {"review_status": status, "operator_note": note})

print("\nSeed complete. Visit http://localhost:5173")
```

- [ ] **Step 2: 验证脚本可执行**

启动后端：`cd backend && ./start.sh`

运行 seed:
```bash
cd backend && python seed_data.py
```

Expected: 22 successful HTTP calls printed.

- [ ] **Step 3: Commit**

```bash
git add backend/seed_data.py
git commit -m "feat: add seed data script with 2 devices and 10 events"
```

---

### Task 12: 端到端验证

- [ ] **Step 1: 运行全部后端测试**

```bash
cd backend && python -m pytest tests/ -v
```

Expected: 20 PASS

- [ ] **Step 2: 启动后端并注入数据**

Terminal 1:
```bash
cd backend && ./start.sh
```

Terminal 2:
```bash
cd backend && python seed_data.py
```

Terminal 3:
```bash
cd frontend && npm run dev
```

- [ ] **Step 3: 浏览器验证**

打开 http://localhost:5173，逐项检查:

- [ ] Dashboard: 5 张统计卡片数字正确
- [ ] Dashboard: 最近事件列表可点击进入详情
- [ ] 事件列表 (`/events`): 状态筛选正确
- [ ] 事件列表: 时间范围筛选正确
- [ ] 事件列表: 分页可用
- [ ] 事件详情 (`/events/:id`): 结构化信息完整
- [ ] 事件详情: 确认按钮生效，状态更新
- [ ] 事件详情: 驳回按钮生效，状态更新
- [ ] 事件详情: 复核备注保存并显示
- [ ] 设备状态 (`/devices`): 2 台设备详细信息
- [ ] 侧边栏导航: 四页切换正常
