# 首版验收记录 — Phase 5

- **日期:** [填写]
- **HP 电脑局域网 IP:** [填写]
- **Android 设备:** vivo X100 (V2309A, Android 16)
- **后端启动命令:** `cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Web 启动命令:** `cd frontend && bun run dev --host 0.0.0.0`
- **Android 构建命令:** `cd android && ./gradlew assembleDebug`
- **Android 构建版本:** 0.1.0
- **模型版本:** yolov8n-vehicle-640x640 (Phase 4) / manual-sim-0.1.0 (Phase 3 fallback)
- **仓库路径:** `emergency-lane-demo-new`
- **验收人:** [填写]

---

## 基线检查

| 项目 | 命令 | 结果 |
|---|---|---|
| 后端测试 | `uv run pytest` | [x] 全部通过，实际数量：25 |
| 前端构建 | `bun run build` | [x] 通过 |
| Android 构建 | `./gradlew assembleDebug` | [x] 通过 |
| 种子数据 | `uv run python seed_data.py` | [x] 2 devices + 10 events + 4 evidence |

---

## API 验收

| 端点 | 方法 | 验证内容 | 结果 |
|---|---|---|---|
| /api/health | GET | 返回 status: ok | [x] |
| /api/devices | GET | 返回设备列表 | [x] |
| /api/events | GET | 支持 status/device_id/分页筛选 | [x] |
| /api/events/:id | GET | 返回事件详情含证据 | [x] |
| /api/events/:id/review | PATCH | 更新复核状态 | [x] |
| /api/stats/overview | GET | 返回统计数字 | [x] |

---

## Web 验收

| 页面 | 验证内容 | 结果 |
|---|---|---|
| Dashboard | 统计卡、近期事件、5s 轮询 | [x] |
| EventList | 筛选、分页、空状态 | [x] |
| EventDetail | 结构化字段、证据图、复核面板 | [x] |
| DeviceStatus | 设备卡片、在线状态 | [x] |
| 错误状态 | 后端不可用时各页面有 ErrorBanner + 重试 | [ ] |
| 空状态 | 无事件/无设备时显示 EmptyState | [ ] |

---

## Android 验收

| 功能 | 验证内容 | 结果 |
|---|---|---|
| 相机预览 | 不拉伸、方向正确、启停正常 | [ ] |
| ROI 标定 | 4 点保存、撤销、重启恢复 | [ ] |
| 连接测试 | 错误地址失败提示、正确地址成功 | [ ] |
| 设备注册 | Web 端可见设备 + 在线状态 | [ ] |
| 手动事件 | 生成后 Web 列表出现 pending 事件 | [ ] |
| 自动检测 | Phase 4: 检测框叠加、10s 触发、不重复 | [ ] |
| 错误状态 | 相机权限、HP 不通、ROI 未标定、模型失败 | [ ] |

---

## 端到端验收

| 流程 | 验证内容 | 结果 |
|---|---|---|
| 在线闭环 | Android 生成 → Web 复核 → 统计变化 | [ ] |
| 离线补传 | 断网生成 → 恢复 → Web 出现 | [ ] |
| 重复幂等 | 同一 event_id 重试 → 无重复 → 复核不覆盖 | [ ] |

## 性能记录 (Phase 4)

| 指标 | 值 |
|---|---|
| 5 分钟平均 FPS | [填写] |
| 5 分钟平均推理耗时 | [填写] ms |
| 温度状态变化 | [填写] |
| 最多同时跟踪数 | [填写] |

---

## 已知限制

1. 模型精度为演示级，未在真实应急车道场景训练 — 误报和漏报率未评估
2. 证据帧仅 frame_peak — before/after 帧未实现
3. 跟踪为 IoU-based 简单关联，遮挡或交叉场景可能 ID 抖动
4. 无 WebSocket 实时推送 — 需手动刷新页面查看新事件
5. CORS 全开 (`allow_origins=["*"]`) — 仅适合局域网演示
6. 时区硬编码 UTC+8 — 未使用 UTC 存储
7. 长期无人值守运行未验证 — 资源泄漏和稳定性未评估
8. 无账号权限 — 任何能访问 HP:8000 的设备都可注册和上传
9. 证据图过大未压缩 — 可能影响上传速度
10. Android 重试使用 WorkManager EXPONENTIAL backoff — 最大重试次数未限制

---

## 排障入口

| 问题 | 检查命令 |
|---|---|
| 后端无法启动 | `cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000` 查看 stderr |
| Web 白屏 | 浏览器 F12 → Console / Network |
| 测试失败 | `cd backend && uv run pytest -v` |
| Android 崩溃 | `adb logcat \| grep -E "AndroidRuntime\|LaneDetect"` |
| 设备不出现 | `curl http://<hp-ip>:8000/api/devices` 检查 JSON |
| 事件不上传 | Android logcat 搜 `UploadWorker` / `HpApiClient` |
| 证据不显示 | `ls backend/data/evidence/` 确认文件存在 |
| 手机连不上 | 检查同一 WiFi、防火墙、`ip addr` |
