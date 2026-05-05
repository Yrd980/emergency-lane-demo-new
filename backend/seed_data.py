"""注入模拟数据：2 台设备 + 10 个事件 (覆盖 pending/confirmed/rejected) + 证据图片"""
import io
import requests
from datetime import datetime, timezone, timedelta

BASE = "http://localhost:8000/api"
tz = timezone(timedelta(hours=8))


def make_jpeg_bytes_minimal():
    """Return a tiny valid JPEG without adding Pillow to backend dependencies."""
    return (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00" + bytes([8] * 64) +
        b"\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x03\x01\x11\x00\x02\x11\x00\x03\x11\x00"
        b"\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        b"\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        b"\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00?\x00\xd2\xcf \xff\xd9"
    )


def make_jpeg_bytes(width=640, height=360, text="EMERGENCY LANE"):
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return make_jpeg_bytes_minimal()

    img = Image.new("RGB", (width, height), color=(40, 40, 40))
    draw = ImageDraw.Draw(img)
    draw.polygon([(420, 100), (620, 110), (630, 350), (320, 350)], outline=(0, 255, 255), width=3)
    draw.rectangle([(300, 150), (480, 280)], outline=(255, 0, 0), width=2)
    draw.text((310, 130), "car 0.86", fill=(255, 0, 0))
    draw.text((20, 20), text, fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def upload_evidence(event_id, evidence_type, filename, file_bytes, mime_type="image/jpeg"):
    url = f"{BASE}/events/{event_id}/evidence"
    files = {"file": (filename, io.BytesIO(file_bytes), mime_type)}
    data = {"evidence_type": evidence_type}
    r = requests.post(url, data=data, files=files)
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text
    print(f"POST evidence {event_id}/{evidence_type}: {r.status_code} {body}")


def post(path, body):
    r = requests.post(f"{BASE}{path}", json=body)
    print(f"POST {path}: {r.status_code} {r.json()}")


def patch(path, body):
    r = requests.patch(f"{BASE}{path}", json=body)
    print(f"PATCH {path}: {r.status_code} {r.json()}")


# Register devices
for dev_id, dev_name in [
    ("vivo_x100_001", "vivo X100 #1"),
    ("vivo_x100_002", "vivo X100 #2"),
]:
    post(
        "/devices/register",
        {
            "device_id": dev_id,
            "device_name": dev_name,
            "app_version": "0.1.0",
            "model_version": "yolov8n-int8-20260505",
        },
    )
    post(
        "/devices/heartbeat",
        {
            "device_id": dev_id,
            "battery_level": 85.0,
            "thermal_state": "normal",
            "fps": 15.0,
            "pending_upload_count": 0,
        },
    )

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
    post(
        "/events",
        {
            "event_id": eid,
            "device_id": dev,
            "start_time": start,
            "end_time": end,
            "duration_seconds": 8 + i % 5,
            "roi_id": "roi_default",
            "track_id": f"track_{i:02d}",
            "vehicle_class": ["car", "truck", "bus", "car"][i % 4],
            "vehicle_box": {
                "x": 120 + i * 10,
                "y": 220,
                "width": 180,
                "height": 90,
            },
            "confidence": 0.7 + (i % 5) * 0.05,
            "gps_location": {
                "lat": 31.23,
                "lng": 121.47,
                "accuracy_meters": 5.0,
            },
        },
    )
    if status != "pending":
        patch(
            f"/events/{eid}/review",
            {"review_status": status, "operator_note": note},
        )

# Upload evidence for first 4 events (covering all 3 review statuses)
evidence_events = ["evt_seed_01", "evt_seed_02", "evt_seed_04", "evt_seed_09"]
for eid in evidence_events:
    upload_evidence(eid, "frame_peak", "frame_peak.jpg", make_jpeg_bytes(text=eid))

print("\nSeed complete. Visit http://localhost:5173")
