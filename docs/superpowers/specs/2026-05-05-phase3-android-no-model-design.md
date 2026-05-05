# Phase 3: Android 无模型闭环 — 实现设计

## 目标

实现 vivo X100 Android 端的基础闭环，但暂不接入真实车辆检测模型。本阶段用手动触发和模拟检测结果验证：相机预览、ROI 标定、HP 地址配置、设备注册/心跳、本地事件队列、事件上传、证据上传、离线补传。

阶段完成后，应能在没有模型资产的情况下证明端侧 App 与 Phase 2 HP 电脑端 API 可以稳定联通。

## 范围

包含：

- CameraX 实时预览。
- ROI 多边形标定、保存、重置。
- HP 后端地址配置和连接测试。
- 设备注册和周期心跳。
- 手动创建模拟疑似占用事件。
- 本地事件和证据队列。
- 在线上传事件 JSON 和证据文件。
- 离线缓存与恢复补传。
- 上传状态、错误原因和队列数量展示。

不包含：

- YOLO / TFLite / ONNX Runtime 真实推理。
- ByteTrack 或实际跨帧跟踪。
- 自动占用判定。
- 车牌 OCR。
- 执法处罚或账号权限。

## 与 HP 端 API 的契约

Android 端只调用 Phase 2 已定义的本地 API：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/health` | 连接测试 |
| POST | `/api/devices/register` | App 启动或修改地址后注册设备 |
| POST | `/api/devices/heartbeat` | 上报电量、FPS、温度、待上传数量 |
| POST | `/api/events` | 上传事件结构化 JSON |
| POST | `/api/events/{event_id}/evidence` | 上传关键帧或视频 |
| GET | `/api/events/{event_id}` | 调试时确认服务端已保存 |

上传幂等以 `event_id` 为准。服务端返回 `duplicate: true` 时，Android 端应把本地事件标记为已被服务端接收，不重新生成事件。

## Android 模块结构

```text
com.emergency.lane/
  EmergencyLaneApp.kt
  MainActivity.kt
  data/
    local/
      AppDatabase (Room)          — 事件队列和证据文件
      RoiStore (DataStore)        — ROI 配置持久化
      SettingsStore (DataStore)   — HP 地址、设备 ID
      EventQueueRepository        — 队列操作封装
    remote/
      HpApiClient (Retrofit)      — HTTP API 调用
      HpApiService                — Retrofit 接口定义
      ApiModels                   — 请求/响应序列化模型
      UploadWorker (WorkManager)  — 后台上传任务
      UploadRepository            — 上传编排逻辑
  domain/
    RoiConfig / RoiPoint
    LocalEvent
    EvidenceFile
    UploadState
    VehicleBox / GpsLocation
    EventFactory                 — 手动/自动事件生成
  camera/
    CameraController             — CameraX 预览和帧捕获
  ui/
    EmergencyLaneNavHost.kt      — 4 页面导航
    detection/
    calibration/
    queue/
    settings/
```

**已锁定技术决策：** UI 框架 Jetpack Compose + Material3，架构 MVVM（ViewModel + Repository），HTTP Retrofit + OkHttp + kotlinx.serialization，本地队列 Room 2.6，设置 DataStore 1.1，后台上传 WorkManager 2.9。详细依赖版本见实现计划。

## 页面设计

### 检测首页

展示：

- CameraX 预览。
- 当前 ROI 多边形。
- HP 连接状态。
- 设备注册状态。
- 最近一次心跳时间。
- 本地待上传数量。
- 最近事件上传状态。

操作：

- 开始/停止预览。
- 进入 ROI 标定。
- 手动生成模拟事件。
- 手动触发上传队列。
- 进入连接设置。

### ROI 标定页

交互：

```text
进入标定页
  -> 显示实时预览
  -> 点击画面添加多边形顶点
  -> 至少 4 点后允许保存
  -> 支持撤销最后一点
  -> 支持清空重画
  -> 保存 frame_width/frame_height/points
```

保存格式：

```json
{
  "roi_id": "roi_default",
  "frame_width": 1280,
  "frame_height": 720,
  "points": [
    {"x": 820, "y": 210},
    {"x": 1260, "y": 240},
    {"x": 1270, "y": 710},
    {"x": 620, "y": 710}
  ],
  "updated_at": "2026-05-05T10:00:00+08:00"
}
```

### 连接设置页

字段：

- HP 后端 Base URL，例如 `http://192.168.1.20:8000`。
- 设备 ID，默认 `vivo_x100_001`。
- 设备名称，默认 `vivo X100`。
- App 版本。
- 模型版本，本阶段可写 `manual-sim-0.1.0`。

操作：

- 测试连接：调用 `/api/health`。
- 保存配置。
- 重新注册设备。

### 事件队列页

展示：

- `local_created` / `queued` / `uploading` / `uploaded` / `failed` 数量。
- 每条事件的 `event_id`、创建时间、上传尝试次数、最后错误。
- 证据文件数量。

操作：

- 重试失败事件。
- 查看事件 JSON。
- 删除已上传事件的本地证据缓存。

## 本地数据模型

### LocalEvent

```json
{
  "event_id": "evt_20260505_000001",
  "device_id": "vivo_x100_001",
  "start_time": "2026-05-05T10:00:00+08:00",
  "end_time": "2026-05-05T10:00:12+08:00",
  "duration_seconds": 12,
  "roi_id": "roi_default",
  "track_id": "manual_track_001",
  "vehicle_class": "car",
  "vehicle_box": {"x": 120, "y": 220, "width": 180, "height": 90},
  "confidence": 0.86,
  "gps_location": null,
  "upload_state": "queued",
  "upload_attempts": 0,
  "last_error": ""
}
```

### EvidenceFile

```json
{
  "event_id": "evt_20260505_000001",
  "evidence_type": "frame_peak",
  "local_path": "/data/user/0/.../frame_peak.jpg",
  "mime_type": "image/jpeg",
  "upload_state": "queued"
}
```

本阶段至少生成 `frame_peak`。如果实现成本可控，可补 `frame_before` 和 `frame_after`。视频片段保持可选。

## 手动事件生成

手动生成按钮用于在没有模型时验证闭环。

规则：

- 必须已有 ROI 配置。
- 必须已有 HP 地址和设备 ID。
- 从当前相机帧保存一张 `frame_peak.jpg`。
- 生成固定结构的事件 JSON。
- `event_id` 使用时间戳加本地递增序号，避免重复。
- `vehicle_box` 可以使用画面中央的固定矩形。
- `duration_seconds` 默认 12。
- `confidence` 默认 0.86。

## 上传状态机

```text
local_created
  -> queued
  -> uploading
  -> uploaded
       ^
       |
     failed -> queued
```

上传顺序：

1. `POST /api/events`。
2. 若返回 `accepted: true` 或 `duplicate: true`，继续上传证据。
3. 逐个上传证据文件。
4. 全部成功后标记事件为 `uploaded`。

失败策略：

- 网络异常、连接超时、HTTP 5xx：保留 `failed`，等待重试。
- HTTP 404 上传证据：说明事件未在服务端保存，应重新上传事件 JSON。
- HTTP 422：记录错误并停止自动重试，等待人工检查数据。

## 心跳

注册成功后每 10 秒发送一次心跳。

心跳字段：

- `device_id`
- `battery_level`
- `thermal_state`
- `fps`
- `pending_upload_count`

本阶段 `fps` 可以填预览帧率或采集估算值，`thermal_state` 可用 Android 热状态 API；若暂未接入系统 API，先用 `normal`。

## 验收标准

- App 能打开相机预览。
- ROI 至少 4 点可保存，退出重进后能恢复显示。
- 错误 HP 地址连接测试失败且有明确提示。
- 正确 HP 地址连接测试成功。
- 设备注册成功，Web 设备页可看到 vivo X100。
- 心跳更新 `battery_level`、`fps`、`pending_upload_count`。
- 手动生成事件后，Web 事件列表出现 pending 事件。
- 事件详情能看到结构化字段和至少一张证据图。
- 断开 HP 网络时事件进入本地队列。
- 恢复网络后事件自动或手动补传成功。
- 重复上传同一事件不会在 Web 端产生重复记录。

## 风险与对策

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| CameraX 坐标与预览坐标不一致 | ROI 显示和保存错位 | 保存预览尺寸，绘制层统一用同一坐标系 |
| Android 后台限制 | 心跳或上传中断 | 使用前台服务或保持页面前台运行作为首版约束 |
| 局域网地址变化 | 手机找不到 HP 服务 | 设置页显式显示 Base URL，并保留连接测试 |
| 证据图片过大 | 上传慢或失败 | 首版压缩关键帧到合理尺寸 |
| 重试过于频繁 | 耗电和日志噪音 | 失败后指数退避，手动重试立即执行 |

