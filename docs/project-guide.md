# 项目说明

## 1. 项目定位

本项目是一套本地部署的高速应急车道疑似占用检测产品原型。

它不是单页 CRUD，也不是一次性演示页面。当前产品要服务一个可长期使用的操作闭环：

```text
接入设备
  -> 监控设备和系统状态
  -> 接收疑似占用事件
  -> 查看证据链
  -> 人工复核
  -> 继续处理下一条或排查异常
```

## 2. 子系统

### Android 端

职责：

- 摄像头采集。
- ROI 标定。
- 车辆检测和轻量跟踪。
- 疑似占用事件生成。
- 本地队列缓存。
- 上传事件、证据和设备心跳。

关键入口：

- `android/app/src/main/java/com/emergency/lane/MainActivity.kt`
- `android/app/src/main/java/com/emergency/lane/ui/EmergencyLaneNavHost.kt`
- `android/app/src/main/java/com/emergency/lane/camera/`
- `android/app/src/main/java/com/emergency/lane/data/remote/`

### 后端

职责：

- 提供局域网 API。
- 保存设备、事件、证据和复核状态。
- 提供统计、设备详情和系统健康状态。
- 保持上传幂等，避免重复事件破坏已复核结果。

关键入口：

- `backend/app/main.py`
- `backend/app/routers/`
- `backend/app/services/`
- `backend/app/database.py`

### Web 工作台

职责：

- 引导设备接入。
- 展示系统工作台。
- 处理待复核事件。
- 查询历史事件。
- 查看设备运营状态。
- 查看系统健康和运行设置。

关键入口：

- `frontend/src/App.tsx`
- `frontend/src/api/client.ts`
- `frontend/src/pages/`
- `frontend/src/components/`

## 3. 页面结构

Web 当前页面：

- `/`：工作台，显示系统当前最重要的下一步行动。
- `/setup`：接入向导，指导配置 Android 后端地址和生成测试事件。
- `/review`：复核工作台，处理待复核事件队列。
- `/events`：事件查询，用于历史检索和追溯。
- `/events/:id`：事件复核详情，围绕证据链和人工复核展开。
- `/devices`：设备运营中心。
- `/devices/:id`：单设备详情。
- `/health`：系统健康。
- `/settings`：运行设置。

## 4. 常用接口

- `GET /api/health`
- `GET /api/system/status`
- `POST /api/devices/register`
- `POST /api/devices/heartbeat`
- `GET /api/devices`
- `GET /api/devices/{device_id}`
- `POST /api/events`
- `GET /api/events`
- `GET /api/events/{event_id}`
- `PATCH /api/events/{event_id}/review`
- `POST /api/events/{event_id}/evidence`
- `GET /api/stats/overview`

## 5. 本地运行

后端：

```bash
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

前端：

```bash
cd frontend
bun install
bun run dev --host 0.0.0.0
```

Android：

```bash
cd android
./gradlew assembleDebug
```

## 6. 验证

后端：

```bash
cd backend
uv run pytest tests/ -q
```

前端：

```bash
cd frontend
bun run lint
bun run build
```

Android：

```bash
cd android
./gradlew assembleDebug
```

## 7. 当前边界

当前版本聚焦本地产品闭环，不承诺：

- 自动处罚。
- 执法系统对接。
- 云端多租户。
- 大规模并发。
- 复杂账号权限。
- 24 小时无人值守生产运行。
