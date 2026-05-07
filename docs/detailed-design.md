# 系统设计

## 1. 总体架构

```text
┌───────────────────────────────┐
│ Android App                    │
│ CameraX / ROI / Detection      │
│ Local Queue / Upload           │
└───────────────┬───────────────┘
                │ HTTP JSON + multipart
                ▼
┌───────────────────────────────┐
│ FastAPI Backend                │
│ Devices / Events / Evidence    │
│ Review / Stats / System Status │
└───────────────┬───────────────┘
                │ REST API
                ▼
┌───────────────────────────────┐
│ React Web Workbench            │
│ Setup / Dashboard / Review     │
│ Devices / Health / Settings    │
└───────────────────────────────┘
```

## 2. Android 设计

Android 端负责发现和上报，不负责最终处罚。

主要模块：

- CameraX 采集。
- 模型加载和推理。
- ROI 几何判断。
- 轻量跟踪。
- 事件状态机。
- Room 本地队列。
- WorkManager 上传。
- Retrofit 调用后端。

上传内容：

- 设备注册。
- 设备心跳。
- 事件结构化数据。
- 证据文件，事件生成时优先包含 `frame_before`、`frame_peak`、`frame_after`。

## 3. 后端设计

后端采用 routers -> services -> SQLite 的简单分层。

### 路由

- `health.py`：基础健康检查。
- `system.py`：系统产品状态。
- `devices.py`：设备注册、心跳、列表、详情。
- `events.py`：事件创建、列表、详情、复核。
- `evidence.py`：证据上传。
- `stats.py`：工作台统计。

### 数据表

- `devices`：设备注册信息、心跳、性能和上传积压。
- `device_metric_history`：设备心跳指标历史，用于排障趋势。
- `events`：疑似事件、复核状态和结构化字段。
- `evidence_files`：证据文件、类型、路径、大小和 hash。
- `review_history`：复核操作者、改判前后状态、备注和时间。

### 产品化接口

`GET /api/system/status` 返回：

- 后端状态。
- 数据库状态。
- 证据目录状态。
- 设备数量和在线数。
- 上传积压。
- 待复核数量。
- 当前阻断项和下一步建议。

`GET /api/settings` 和 `PUT /api/settings` 返回和保存：

- 复核策略。
- 在线判定窗口。
- 证据保留天数。
- 是否要求完整证据。
- 设备访问模式。

`GET /api/devices/{device_id}` 返回：

- 设备基础信息。
- 在线状态。
- 心跳间隔。
- FPS、电量、温度、上传积压。
- 设备问题列表。
- 最近指标历史。
- 最近事件。

事件详情扩展：

- `evidence_summary`。
- `review_history`。
- `risk_level`。
- `review_priority_reason`。
- `previous_event_id`。
- `next_event_id`。

这些字段是 additive，不破坏 Android 当前上传契约。

## 4. Web 设计

Web 端以产品工作台为核心，不以 CRUD 为核心。

### App shell

- 桌面端左侧导航。
- 移动端底部导航。
- 统一页面宽度、背景、卡片、按钮和状态组件。

### 页面职责

`/` 工作台：

- 聚合系统健康、待复核、最近事件和设备状态。
- 根据当前状态给出唯一主行动。

`/setup` 接入向导：

- 给出后端地址。
- 支持复制。
- 展示接入步骤和当前接入状态。

`/review` 复核工作台：

- 默认只看 pending 事件。
- 队首事件作为下一步。
- 清空后引导回工作台。

`/events` 事件查询：

- 用于历史查询和筛选。
- 不承担主要复核入口。

`/events/:id` 事件详情：

- 先展示证据。
- 再展示复核面板。
- 展示复核历史和操作者记录。
- 再展示字段。
- 复核成功后反馈并支持进入下一条。

`/devices` 设备运营中心：

- 展示在线、离线、积压和性能。
- 异常设备给下一步。

`/devices/:id` 设备详情：

- 展示设备问题、最近指标历史、最近事件和运行指标。

`/health` 系统健康：

- 展示后端、数据库、证据目录、设备和事件队列。

`/settings` 设置：

- 保存复核策略、在线判定窗口、证据保留和设备访问模式。
- 证据清理任务和设备 token 校验仍是后续扩展。

## 5. 状态设计

统一状态组件：

- `StateBlock`：loading、empty、error、success。
- `ActionPanel`：当前页面下一步。
- `MetricTile`：核心指标。
- `StatusBadge`：状态标签。
- `ToastProvider`：操作反馈。

所有主要页面必须有：

- 页面说明。
- 主行动。
- 异常恢复入口。
- 空状态下一步。

## 6. 验证策略

后端：

- 新接口必须补测试。
- 事件幂等、复核状态、设备心跳、系统状态都要覆盖。

前端：

- `bun run lint`
- `bun run build`
- 检查移动端布局。
- 检查空数据、后端错误、无设备、有事件无证据等状态。

Android：

- `./gradlew assembleDebug`
- 真机验证接入、心跳、事件上传和证据上传。
