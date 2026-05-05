# Phase 5: 演示打磨与验收 — 实现设计

## 目标

把 Phase 2 HP 电脑端、Phase 3 Android 无模型闭环、Phase 4 自动模型链路整理成一套可重复演示、可验收、可排查的首版系统。

本阶段不追求新增大功能，重点是稳定运行、清晰演示路径、错误提示、模拟数据、验收记录和已知限制。

## 范围

包含：

- 一键或少步骤启动 HP 后端和 Web。
- 模拟数据注入脚本或操作说明。
- Android 与 HP 局域网联调步骤。
- 演示脚本：在线事件、复核、离线补传、重复上传幂等。
- 错误提示和空状态补齐。
- 验收清单和运行记录。
- 已知限制文档。

不包含：

- 大规模并发压测。
- 账号权限体系。
- WebSocket 实时推送。
- 执法系统对接。
- 长期无人值守部署。

## 演示拓扑

```text
vivo X100 Android App
  - CameraX 预览
  - ROI 标定
  - 模型或手动模拟事件
  - 本地队列和补传

        HTTP JSON / multipart
                |
                v

HP 电脑
  - FastAPI backend :8000
  - SQLite data/app.db
  - evidence files data/evidence/
  - Vite React Web :5173
```

HP 和 vivo X100 必须在同一局域网，或由手机热点/路由器连通。

## 启动契约

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

Web 访问：

- HP 本机：`http://localhost:5173`
- 手机同网访问：`http://<hp-lan-ip>:5173`

Android Base URL：

- `http://<hp-lan-ip>:8000`

## 模拟数据

模拟数据用于在 Android 未连接或现场不方便触发车辆时展示 HP 端。

**现状（Phase 2 seed）:** `backend/seed_data.py` 已有 2 设备 + 10 事件，覆盖 pending/confirmed/rejected 和 car/truck/bus，但**不含证据文件**。

**Phase 5 增强后：**

- 2 台设备（已有）：vivo_x100_001, vivo_x100_002。
- 10 条事件（已有）：3 confirmed, 2 rejected, 5 pending。
- 4 条事件带 `frame_peak` 证据图（新增）：evt_seed_01, evt_seed_02, evt_seed_04, evt_seed_09。
- 证据图优先使用标准库生成或内嵌最小 JPEG，避免为演示数据新增后端依赖。若已存在 Pillow，可生成带检测框、ROI 边界、事件 ID 的更可读图片。

注入方式：`uv run python seed_data.py`，走 HTTP API 保证数据符合真实上传契约。

## 演示流程

### 流程 1: HP 端数据展示

```text
启动后端
  -> 启动 Web
  -> 注入模拟数据
  -> 打开概览页
  -> 打开事件列表
  -> 按状态筛选
  -> 打开事件详情
  -> 查看证据图
```

### 流程 2: Android 在线上传

```text
Android 配置 HP Base URL
  -> 连接测试成功
  -> 设备注册
  -> Web 设备页看到在线设备
  -> Android 完成 ROI 标定
  -> 生成事件
  -> Web 列表出现 pending 事件
```

### 流程 3: 人工复核

```text
打开事件详情
  -> 查看结构化字段和证据
  -> 确认一条事件
  -> 驳回一条事件
  -> 返回列表按状态筛选
  -> 概览统计随之变化
```

### 流程 4: 离线补传

```text
断开 HP 后端或局域网
  -> Android 生成事件
  -> 事件留在本地 failed/queued
  -> 恢复 HP 后端或局域网
  -> Android 重试上传
  -> Web 出现补传事件
```

### 流程 5: 重复上传幂等

```text
Android 对同一 event_id 重试上传
  -> 后端返回 duplicate:true
  -> Web 不出现重复事件
  -> 已复核事件不被覆盖为 pending
```

## 错误与空状态

HP Web 需要覆盖：

- 后端不可用。
- 事件列表为空。
- 证据图缺失。
- 事件详情 404。
- 复核失败。
- 设备列表为空。

Android 需要覆盖：

- 相机权限未授权。
- HP 地址为空或格式错误。
- `/api/health` 不通。
- 设备未注册。
- ROI 未标定。
- 模型加载失败。
- 上传失败但已入队。

错误提示应说明“当前状态”和“下一步动作”，避免只显示原始异常。

## 验收记录

验收记录建议字段：

```markdown
# 首版验收记录

- 日期：
- HP 电脑局域网 IP：
- Android 设备：
- 后端启动命令：
- Web 启动命令：
- Android 构建版本：
- 模型版本：
- 验收人：

## API 验收

...

## Web 验收

...

## Android 验收

...

## 端到端验收

...

## 已知限制

...
```

## 完成定义

- 后端测试通过。
- 前端 build 通过。
- HP Web 可完成概览、列表、详情、复核、设备查看。
- Android 可完成连接、ROI、事件生成、上传、离线补传。
- 至少一条事件从 Android 生成并在 Web 确认。
- 至少一条事件从 Android 生成并在 Web 驳回。
- 重复上传不会产生重复记录或覆盖复核结论。
- 运行文档写明实际 IP、命令、限制和排障入口。
