# Phase 2: HP 电脑端闭环 — 实现设计

## 目标

实现 HP 电脑端后端服务和 Web 管理界面，使用模拟数据跑通事件接收、列表、详情、复核、历史查询的完整闭环。本阶段不依赖 Android 端。

## 技术栈

- **后端**: Python 3.11+ / FastAPI / SQLite / uvicorn
- **前端**: React 18 / TypeScript / Tailwind CSS / Vite
- **测试**: pytest + httpx TestClient

## 后端目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 入口, CORS, startup/shutdown
│   ├── config.py            # host/port/db路径/证据目录 配置
│   ├── database.py          # SQLite 连接管理, 建表
│   ├── models/              # Pydantic 模型 (请求/响应)
│   │   ├── device.py        # DeviceRegister, Heartbeat, DeviceStatus
│   │   ├── event.py         # EventCreate, EventListResponse, EventDetail, ReviewUpdate
│   │   └── evidence.py      # EvidenceUpload 响应
│   ├── routers/             # API 路由 (薄层, 参数解析 → service)
│   │   ├── health.py        # GET /api/health
│   │   ├── devices.py       # GET /api/devices, POST register/heartbeat
│   │   ├── events.py        # POST/GET /api/events, PATCH review
│   │   ├── evidence.py      # POST /api/events/{id}/evidence, 静态文件挂载
│   │   └── stats.py         # GET /api/stats/overview
│   └── services/            # 业务逻辑
│       ├── device_service.py
│       ├── event_service.py
│       ├── evidence_service.py
│       └── stats_service.py
├── data/                    # 运行时产物 (gitignore)
│   ├── app.db
│   └── evidence/
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_devices.py
│   ├── test_events.py
│   ├── test_evidence.py
│   └── test_stats.py
├── requirements.txt
└── start.sh
```

分层约束：routers 只做 HTTP 参数解析和响应格式化，services 做业务逻辑和数据库操作，database 做连接和建表。

## API 端点

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/devices` | 设备列表（DeviceStatus 页数据源） |
| POST | `/api/devices/register` | 设备注册 |
| POST | `/api/devices/heartbeat` | 设备心跳 |
| GET | `/api/stats/overview` | 概览统计（Dashboard 数据源） |
| POST | `/api/events` | 事件上传 |
| GET | `/api/events` | 事件列表 (分页+筛选) |
| GET | `/api/events/{event_id}` | 事件详情 |
| POST | `/api/events/{event_id}/evidence` | 证据文件上传 (multipart) |
| PATCH | `/api/events/{event_id}/review` | 人工复核 |
| GET | `/evidence/{event_id}/{filename}` | 静态证据文件 |

### GET /api/stats/overview 响应

```json
{
  "total_events_today": 25,
  "pending_count": 8,
  "confirmed_count": 12,
  "rejected_count": 5,
  "online_device_count": 2,
  "recent_events": [
    {
      "event_id": "evt_20260505_000001",
      "device_id": "vivo_x100_001",
      "start_time": "2026-05-05T10:00:00+08:00",
      "duration_seconds": 12,
      "vehicle_class": "car",
      "confidence": 0.86,
      "review_status": "pending",
      "thumbnail_url": "/evidence/evt_20260505_000001/frame_peak.jpg"
    }
  ]
}
```

### GET /api/events 查询参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| status | string | pending / confirmed / rejected |
| device_id | string | 设备 ID |
| start_time_from | string | ISO 时间，范围起始 |
| start_time_to | string | ISO 时间，范围结束 |
| limit | int | 每页条数，默认 50 |
| offset | int | 偏移量，默认 0 |

## 数据库（SQLite，3 张表）

**devices**: device_id (PK), device_name, app_version, model_version, registered_at, last_seen_at, battery_level, thermal_state, fps, pending_upload_count

心跳字段 (battery_level, thermal_state, fps, pending_upload_count) 在 `POST /api/devices/heartbeat` 时更新到 devices 表，`GET /api/devices` 直接读取，无需联表查询。

**events**: event_id (PK), device_id, start_time, end_time, duration_seconds, roi_id, track_id, vehicle_class, vehicle_box_json, confidence, gps_json, review_status, operator_note, created_at, reviewed_at

**evidence_files**: id (PK auto), event_id, evidence_type, file_path, mime_type, size_bytes, sha256, uploaded_at

## 前端目录结构

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts            # fetch 封装, baseURL, 错误处理
│   ├── types/
│   │   └── index.ts             # 共享 TypeScript 类型
│   ├── hooks/
│   │   ├── useEvents.ts         # 事件列表查询+筛选+分页
│   │   ├── useEventDetail.ts    # 单事件详情
│   │   ├── usePolling.ts        # 概览统计轮询
│   │   └── useReview.ts         # 复核 mutation
│   ├── components/
│   │   ├── Layout.tsx           # 侧边栏+内容区
│   │   ├── StatCard.tsx         # 统计卡片
│   │   ├── StatusBadge.tsx      # pending/confirmed/rejected 标签
│   │   ├── EventTable.tsx       # 事件表格
│   │   ├── EvidenceViewer.tsx   # 证据帧轮播+视频
│   │   ├── ReviewPanel.tsx      # 确认/驳回+备注
│   │   └── FilterBar.tsx        # 筛选条件
│   ├── pages/
│   │   ├── Dashboard.tsx        # 概览统计+最近事件
│   │   ├── EventList.tsx        # 事件列表 (筛选+分页)
│   │   ├── EventDetail.tsx      # 事件详情+证据+复核
│   │   └── DeviceStatus.tsx     # 设备状态卡片
│   ├── App.tsx                  # 路由定义
│   └── main.tsx                 # 入口
├── index.html
├── package.json
├── vite.config.ts               # proxy /api → backend
├── tailwind.config.js
└── tsconfig.json
```

路由：

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/` | Dashboard | 概览统计 |
| `/events` | EventList | 事件列表 ?status=&device_id= |
| `/events/:id` | EventDetail | 事件详情+复核 |
| `/devices` | DeviceStatus | 设备状态 |

状态管理：自定义 hooks + fetch，不引入外部状态库。数据流：`hooks → api/client → 服务端 → 类型化响应 → 页面渲染`。

## Phase 2 任务拆解（12 步，按序执行）

### Step 1: 后端骨架
- 初始化 FastAPI 项目、requirements.txt、start.sh
- config.py：host, port, db_path, evidence_dir
- database.py：建表 SQL (devices, events, evidence_files)
- GET /api/health
- 验证项：`uvicorn app.main:app` 启动成功，curl /api/health 返回 200

### Step 2: 设备管理
- POST /api/devices/register — 注册或 upsert
- POST /api/devices/heartbeat — 更新 last_seen_at, battery_level, thermal_state, fps, pending_upload_count
- GET /api/devices — 返回所有已注册设备及其最新状态
- device_service + router + Pydantic models
- 验证项：注册返回 device_id + registered:true，心跳更新状态字段，GET /api/devices 返回设备列表

### Step 3: 事件接收与存储
- POST /api/events — 接收事件 JSON，幂等处理
- GET /api/events — 分页+筛选 (status, device_id, start_time_from, start_time_to, limit, offset)
- GET /api/events/{event_id} — 事件详情+证据文件列表+复核信息
- 验证项：上传成功，重复 event_id 返回 duplicate:true，列表分页正确，时间范围筛选正确

### Step 4: 证据文件管理
- POST /api/events/{event_id}/evidence — multipart 上传
- 保存至 data/evidence/{event_id}/，写入 evidence_files 表
- 静态文件挂载：GET /evidence/{event_id}/{filename}
- 验证项：上传返回 stored:true，文件可通过 URL 访问

### Step 5: 人工复核
- PATCH /api/events/{event_id}/review — 更新 review_status + operator_note + reviewed_at
- 校验：review_status 必须是 confirmed 或 rejected
- 验证项：复核更新成功，重复上传同一事件不覆盖复核状态

### Step 6: 后端测试
- pytest + httpx TestClient
- 覆盖 13 个场景：健康检查、设备注册、心跳、设备列表、概览统计、事件上传、事件去重、事件列表分页、事件列表时间筛选、事件详情、证据上传、复核更新、重复上传不覆盖复核

### Step 7: 前端骨架
- Vite + React + TypeScript + Tailwind 项目初始化
- 路由 + Layout 组件（侧边栏导航：概览/事件/设备）
- API client 封装（baseURL, 错误统一处理）
- TypeScript 类型定义（与后端 Pydantic models 对齐）

### Step 8: 概览页（Dashboard）
- StatCard 组件 + Dashboard 页面
- usePolling hook 每 5 秒轮询 `GET /api/stats/overview`
- 展示：今日事件数、待复核数、已确认数、已驳回数、在线设备数、最近 10 条事件

### Step 9: 事件列表页（EventList）
- EventTable + FilterBar + StatusBadge 组件
- 筛选：复核状态、设备 ID、时间范围
- 分页：limit/offset，显示总数
- 点击行进入事件详情

### Step 10: 事件详情页 + 复核（EventDetail）
- 事件结构化信息展示（设备、时间、轨迹、置信度、GPS）
- EvidenceViewer 组件：证据帧切换（frame_before/peak/after）+ 视频播放
- ReviewPanel 组件：确认/驳回按钮 + 备注 textarea
- useReview hook：调用 PATCH 成功后刷新页面数据

### Step 11: 设备状态页（DeviceStatus）
- 设备卡片列表，每张卡片显示：设备名称、App 版本、模型版本、最后心跳时间、FPS、电量、温度状态、待上传数
- 数据来源：devices 表 + 最新心跳字段

### Step 12: 模拟数据 + 端到端验证
- 编写 Python 脚本通过 API 注入：2 台模拟设备 + 10 个模拟事件 (覆盖 pending/confirmed/rejected)
- 浏览器端走完整流程：概览 → 列表筛选 → 事件详情 → 确认 → 驳回 → 历史查询 → 设备状态
- 确认所有验收项通过

## 验收清单（17 项）

- [ ] `GET /api/health` 返回 200
- [ ] 设备注册成功
- [ ] 心跳更新 last_seen_at, battery_level, thermal_state, fps, pending_upload_count
- [ ] `GET /api/devices` 返回设备列表含最新状态
- [ ] `GET /api/stats/overview` 返回正确的今日事件数、各状态数、在线设备数、最近事件
- [ ] 事件上传成功
- [ ] 重复 event_id 返回 duplicate:true，不创建第二条事件
- [ ] 证据文件上传成功，可通过 URL 访问
- [ ] 事件列表分页查询正确，时间范围筛选正确
- [ ] 事件详情返回完整结构化数据 + 证据文件列表
- [ ] 复核更新成功（confirmed/rejected）
- [ ] 重复上传不覆盖 review_status
- [ ] Web 概览页统计数字与 API 一致
- [ ] Web 事件列表缩略图展示、筛选（含时间范围）、分页正确
- [ ] Web 事件详情页证据帧可切换、视频可播放
- [ ] Web 复核确认/驳回操作成功、备注保存、页面刷新
- [ ] Web 设备状态页显示在线设备信息

## 不纳入 Phase 2

- Android 端任何功能
- 真实模型推理
- 用户认证与权限
- 多设备并发压力测试
- WebSocket 实时推送（先轮询替代）
