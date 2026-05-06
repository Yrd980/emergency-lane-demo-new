# 项目指南

## 项目定位

这是一个可本地演示的高速应急车道疑似占用检测系统。系统由 Android 端、HP 电脑本地后端和 Web 管理端组成，用于跑通“手机端发现疑似事件 -> 本地服务接收留证 -> Web 端人工复核和查询”的闭环。

首版定位是项目演示和人工辅助复核，不是自动执法或自动处罚系统。

## 功能范围

- Android 端摄像头采集、ROI 标定、车辆检测、轻量跟踪和疑似事件生成。
- Android 端离线缓存事件，网络恢复后上传到 HP 电脑端。
- FastAPI 后端接收设备心跳、事件数据和证据文件。
- SQLite 保存设备、事件、证据和复核状态。
- React Web 管理端展示统计、设备状态、事件列表、事件详情和证据。
- Web 管理端支持人工确认或驳回疑似事件。

## 项目结构

```text
.
├── android/    # Kotlin Compose Android 应用
├── backend/    # FastAPI + SQLite 本地服务
├── frontend/   # React + TypeScript + Vite 管理界面
├── docs/       # 需求、设计、验收和图表文档
└── AGENTS.md   # 给代码代理使用的协作约束
```

## 技术栈

- 后端：Python 3.11+、FastAPI、SQLite、pytest、uv
- 前端：React、TypeScript、Vite、Tailwind CSS、Bun
- Android：Kotlin、Jetpack Compose、CameraX、TFLite、Room、DataStore、WorkManager、Retrofit

## 本地运行

### 启动后端

```powershell
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

后端默认配置：

- API 地址：`http://localhost:8000`
- 数据库：`backend/data/app.db`
- 证据目录：`backend/data/evidence`

可用环境变量：

- `DB_PATH`
- `EVIDENCE_DIR`
- `ONLINE_THRESHOLD_SECONDS`

### 启动前端

```powershell
cd frontend
bun install
bun run dev
```

Vite 开发服务会把 `/api` 和 `/evidence` 代理到 `http://localhost:8000`。

### 构建 Android

```powershell
cd android
.\gradlew.bat assembleDebug
```

Android 端需要把后端地址配置为手机可访问的 HP 电脑局域网地址，例如 `http://192.168.x.x:8000`，不能使用手机本机的 `localhost`。

## 常用接口

- `GET /api/health`
- `POST /api/devices/register`
- `POST /api/devices/heartbeat`
- `GET /api/devices`
- `POST /api/events`
- `GET /api/events`
- `GET /api/events/{event_id}`
- `PATCH /api/events/{event_id}/review`
- `POST /api/events/{event_id}/evidence`
- `GET /api/stats/overview`

事件上传以 `event_id` 去重。重复上传不会覆盖已复核结果。

## 测试与检查

后端测试：

```powershell
cd backend
uv run pytest
```

前端构建和 lint：

```powershell
cd frontend
bun run build
bun run lint
```

Android 单元测试：

```powershell
cd android
.\gradlew.bat :app:testDebugUnitTest
```

Android 调试包构建：

```powershell
cd android
.\gradlew.bat assembleDebug
```

## 演示流程

1. 在 HP 电脑启动后端服务。
2. 启动 Web 管理端并打开事件列表或仪表盘。
3. 手机和 HP 电脑连接到同一局域网。
4. 在 Android App 中配置 HP 电脑后端地址。
5. 完成应急车道 ROI 标定。
6. 启动检测。
7. 车辆进入 ROI 并超过停留阈值后生成疑似事件。
8. Android 端上传事件和证据。
9. Web 管理端查看事件详情和证据。
10. 复核人员将事件标记为 `confirmed` 或 `rejected`。

