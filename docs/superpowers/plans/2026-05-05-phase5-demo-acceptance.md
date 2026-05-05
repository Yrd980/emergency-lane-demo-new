# Phase 5: 演示打磨与验收 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This phase is stabilization-heavy: prefer small, verifiable edits and keep feature scope frozen unless a failing acceptance item requires a code change.

**Goal:** 固化首版可重复演示流程，补齐模拟数据（含证据图）、Web/Android 错误和空状态 UI、运行文档和验收记录，使 HP 端和 vivo X100 端能完成完整闭环展示。

**Architecture:** 对 Phase 2-4 现有代码做增量改动 — Web 端添加 ErrorBanner/EmptyState 组件，Android 端补齐错误提示 UI，seed 脚本增加证据图片生成和上传。不改动核心业务逻辑和 API 契约。

**Tech Stack:** Phase 2-4 现有技术栈，无新增依赖。

**Depends on:** Phase 2 HP 端可运行；Phase 3 Android 无模型闭环可运行；Phase 4 自动模型链路至少能生成自动事件或明确降级到手动模拟。

**Pre-Flight Audit (from Phase 2 current state):**
| 检查项 | 状态 | 说明 |
|---|---|---|
| `backend/seed_data.py` | ✅ 存在 | 2 devices + 10 events, 覆盖 pending/confirmed/rejected, car/truck/bus |
| 证据图片 (frame_peak) | ❌ 缺失 | seed 脚本不生成任何证据文件 — 需补至少 3 条事件的 JPEG 证据 |
| `uv run pytest` | 25 passed | Phase 2 修复后的状态 |
| `bun run build` | 通过 | 40 modules, 247KB JS |
| Web 错误状态 | 部分 | 后端不可用时 fetch 抛异常但无用户友好提示 |
| Web 空状态 | 缺失 | 无事件/无设备时列表空白，无引导信息 |

---

### Task 1: 当前状态取证

**Files:**
- None created; this task is read-only audit.

- [ ] **Step 1: 检查 Git 状态**

```bash
git status --short
```
记录未提交改动。已知：`frontend/tsconfig.tsbuildinfo` 有未提交变更（构建产物，可忽略）。你的本地可能有 Phase 2 代码审查修复未提交（backend/ 下 8 个文件）。

- [ ] **Step 2: 运行后端测试**

```bash
cd backend && uv sync && uv run pytest
```
Expected: 25 passed. 如果不是，记录失败原因并在继续前修复。

- [ ] **Step 3: 验证前端构建**

```bash
cd frontend && bun install && bun run build
```
Expected: BUILD SUCCESS. 无 TypeScript 错误。

- [ ] **Step 4: 审计 seed 脚本证据覆盖**

```bash
grep -c 'evidence\|frame_peak\|multipart\|jpeg\|jpg\|png' backend/seed_data.py
```
Expected output: `0`（当前无证据上传逻辑 — Task 3 将补上）。

- [ ] **Step 5: 记录基线**

将 Step 2-4 的结果记入验收文档的状态基线部分。

---

### Task 2: HP 启动检查与局域网连通

**Files:**
- None (verification only).

- [ ] **Step 1: 启动后端**

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- [ ] **Step 2: 验证 /api/health**

```bash
curl http://localhost:8000/api/health
```
Expected: `{"status":"ok"}`.

- [ ] **Step 3: 启动前端**

```bash
cd frontend
bun run dev --host 0.0.0.0
```

- [ ] **Step 4: 记录 HP 局域网 IP**

```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```
记下可被 vivo X100 访问的局域网 IP（例如 `192.168.1.20`）。

- [ ] **Step 5: 手机浏览器连通验证**

用 vivo X100 Chrome 打开 `http://<hp-lan-ip>:5173`。确认 Dashboard 页面可加载。

---

### Task 3: 种子数据增强 — 证据图片

**Files:**
- Modify: `backend/seed_data.py`

**当前状态:** seed_data.py 创建 2 设备 + 10 事件（3 confirmed, 2 rejected, 5 pending），但**不上传任何证据文件**。Web 事件详情页的证据区域显示为空。

**目标:** 为前 4 条事件生成简单 JPEG 占位图并通过 `/api/events/{event_id}/evidence` 上传。

- [ ] **Step 1: 生成 JPEG 占位图函数**

在 `backend/seed_data.py` 顶部添加：

```python
import io
import struct
import zlib


def make_jpeg_bytes(width=640, height=360, text="EMERGENCY LANE"):
    """Generate a minimal valid JPEG with text overlay."""
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new("RGB", (width, height), color=(40, 40, 40))
    draw = ImageDraw.Draw(img)
    # Draw ROI-like polygon
    draw.polygon([(420, 100), (620, 110), (630, 350), (320, 350)], outline=(0, 255, 255), width=3)
    # Draw vehicle box
    draw.rectangle([(300, 150), (480, 280)], outline=(255, 0, 0), width=2)
    draw.text((310, 130), "car 0.86", fill=(255, 0, 0))
    draw.text((20, 20), text, fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()
```

如果 Pillow 不可用（不在依赖中），使用纯标准库生成最小 JPEG：

```python
def make_jpeg_bytes_minimal():
    """Generate a minimal 1x1 JPEG using pure stdlib."""
    # Minimal JPEG: SOI, APP0 (JFIF), DQT, SOF0 (1x1 grayscale), DHT, SOS, ECS, EOI
    chunks = [
        b'\xff\xd8',  # SOI
        b'\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00',  # APP0
        b'\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342',  # DQT
        b'\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00',  # SOF0 (1x1)
        b'\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b',  # DHT
        b'\xff\xda\x00\x08\x01\x01\x00\x00?\x00\x7f\x00\x9f\xff\xd9',  # SOS + ECS + EOI
    ]
    return b''.join(chunks)
```

选择：如 Pillow 不可用则用最小 JPEG。优先检查现有依赖。

- [ ] **Step 2: 添加证据上传函数**

```python
def upload_evidence(event_id, evidence_type, filename, file_bytes, mime_type="image/jpeg"):
    import io
    url = f"{BASE}/events/{event_id}/evidence"
    files = {"file": (filename, io.BytesIO(file_bytes), mime_type)}
    data = {"evidence_type": evidence_type}
    r = requests.post(url, data=data, files=files)
    print(f"POST evidence {event_id}/{evidence_type}: {r.status_code} {r.json() if r.headers.get('content-type','').startswith('application/json') else r.text}")
```

- [ ] **Step 3: 为部分事件上传证据**

在种子数据末尾添加：

```python
# Upload evidence for first 4 events (covering all 3 review statuses)
evidence_events = ["evt_seed_01", "evt_seed_02", "evt_seed_04", "evt_seed_09"]
# evt_seed_01: confirmed, evt_seed_02: rejected, evt_seed_04: confirmed, evt_seed_09: confirmed

try:
    from PIL import Image
    jpeg_bytes = make_jpeg_bytes
except ImportError:
    jpeg_bytes = make_jpeg_bytes_minimal
    print("WARNING: Pillow not available — using 1x1 placeholder JPEG")

for eid in evidence_events:
    img = jpeg_bytes()
    upload_evidence(eid, "frame_peak", "frame_peak.jpg", img if isinstance(img, bytes) else img)
```

- [ ] **Step 4: 运行验证**

```bash
cd backend && uv run python seed_data.py
```
确认 4 条证据上传均返回 200。打开 Web 事件详情页，验证前 4 条事件的证据图可显示。

- [ ] **Step 5: 验证概览页和列表**

Dashboard 统计数字正确。EventList 筛选 pending/confirmed/rejected 各返回对应数量。详情页证据区有图片。

- [ ] **Step 6: Commit**

```bash
git add backend/seed_data.py
git commit -m "feat(seed): add evidence image generation and upload for demo data"
```

---

### Task 4: Web 错误和空状态补齐

**Files:**
- Create: `frontend/src/components/ErrorBanner.tsx`
- Create: `frontend/src/components/EmptyState.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/pages/EventList.tsx`
- Modify: `frontend/src/pages/EventDetail.tsx`
- Modify: `frontend/src/pages/DeviceStatus.tsx`
- Modify: `frontend/src/components/ReviewPanel.tsx`

- [ ] **Step 1: 创建 ErrorBanner 组件**

```tsx
// frontend/src/components/ErrorBanner.tsx
interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
      <div className="flex items-center gap-3">
        <span className="text-red-600 font-medium">错误</span>
        <span className="text-red-700 text-sm">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 EmptyState 组件**

```tsx
// frontend/src/components/EmptyState.tsx
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function EmptyState({ icon = "📋", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-4xl mb-4">{icon}</span>
      <p className="text-lg font-medium text-gray-500">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      {action && (
        action.href ? (
          <a href={action.href} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            {action.label}
          </a>
        ) : (
          <button onClick={action.onClick} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 3: 为 Dashboard 添加错误和加载状态**

在 `Dashboard.tsx` 中：
```tsx
// Add to the hook or component:
const [error, setError] = useState<string | null>(null);

// In usePolling callback:
try {
  const data = await getStats();
  setStats(data);
  setError(null);
} catch (e) {
  setError(e instanceof Error ? e.message : "获取统计数据失败");
}

// In JSX, before the StatCards:
{error && <ErrorBanner message={error} onRetry={fetchStats} />}
```

- [ ] **Step 4: 为 EventList 添加空状态和错误**

```tsx
// After loading and when events.length === 0:
{!loading && events.length === 0 && !error && (
  <EmptyState
    icon="🔍"
    title="暂无事件"
    description={status ? `没有 "${status}" 状态的事件` : "还没有收到任何事件数据"}
  />
)}

{error && <ErrorBanner message={error} onRetry={fetchEvents} />}
```

- [ ] **Step 5: 为 EventDetail 添加 404 和证据缺失状态**

```tsx
// 404 state:
{error && error.includes("404") && (
  <EmptyState
    icon="🚫"
    title="事件不存在"
    description="该事件可能已被删除，或 ID 不正确"
    action={{ label: "返回事件列表", href: "/events" }}
  />
)}

// Missing evidence:
{event && event.evidence_files.length === 0 && (
  <div className="text-gray-400 text-sm p-4 border border-dashed border-gray-300 rounded">
    暂无证据文件 — 该事件可能尚未完成证据上传
  </div>
)}
```

- [ ] **Step 6: 为 DeviceStatus 添加空状态和错误**

```tsx
{!loading && devices.length === 0 && !error && (
  <EmptyState
    icon="📱"
    title="暂无设备"
    description="还没有设备注册到系统"
  />
)}
{error && <ErrorBanner message={error} onRetry={fetchDevices} />}
```

- [ ] **Step 7: ReviewPanel 复核失败保留输入**

```tsx
// In ReviewPanel.tsx:
const [submitError, setSubmitError] = useState<string | null>(null);

async function handleReview(newStatus: "confirmed" | "rejected") {
  setSubmitting(true);
  setSubmitError(null);
  try {
    await reviewEvent(eventId, { review_status: newStatus, operator_note: note });
    onReviewed();
  } catch (e) {
    setSubmitError(e instanceof Error ? e.message : "复核提交失败");
    // Keep note text — don't clear
  } finally {
    setSubmitting(false);
  }
}

// In JSX:
{submitError && (
  <div className="text-red-600 text-sm mb-2">
    {submitError} — 请重试或检查后端状态
  </div>
)}
```

- [ ] **Step 8: 验证所有错误/空状态**

逐一触发：停止后端 → 各页面确认有 ErrorBanner → 恢复后端 → 重试按钮可用 → 空数据库 → 清空事件和设备 → 确认 EmptyState 显示。

- [ ] **Step 9: Commit**

```bash
git add frontend/
git commit -m "feat(web): add ErrorBanner, EmptyState components and error handling to all pages"
```

---

### Task 5: Android 错误状态补齐

**Files:**
- Modify: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionScreen.kt`
- Modify: `android/app/src/main/java/com/emergency/lane/ui/calibration/CalibrationScreen.kt`
- Modify: `android/app/src/main/java/com/emergency/lane/ui/settings/SettingsScreen.kt`
- Modify: `android/app/src/main/java/com/emergency/lane/ui/queue/QueueScreen.kt`

- [ ] **Step 1: 相机权限拒绝状态**

在 `DetectionScreen.kt` 已部分实现（Phase 3 Task 2）。补充完整覆盖：

```kotlin
// Show when permission permanently denied:
if (!uiState.hasCameraPermission && uiState.permissionChecked) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("相机权限未授权", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(8.dp))
        Text("请在系统设置中开启相机权限后重试", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = {
            context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${context.packageName}")
            })
        }) {
            Text("打开设置")
        }
    }
}
```

- [ ] **Step 2: HP 地址错误状态**

在 `SettingsScreen.kt` 中已基本实现（Phase 3 Task 4）。补充 URL 格式校验：

```kotlin
// Validate URL format before test:
fun validateUrl(url: String): String? {
    if (url.isBlank()) return "请输入 HP 后端地址"
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "地址必须以 http:// 或 https:// 开头"
    }
    return null
}

// In test connection button:
val urlError = validateUrl(baseUrl)
if (urlError != null) {
    viewModel.setError(urlError)
    return
}
```

- [ ] **Step 3: ROI 未标定状态**

在 `DetectionScreen.kt` Phase 3 已有前置校验。增强提示：

```kotlin
if (!uiState.roiConfigured && uiState.modelStatus is ModelLoadStatus.Ready) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("⚠", style = MaterialTheme.typography.headlineSmall)
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text("尚未配置 ROI 区域", style = MaterialTheme.typography.titleSmall)
                Text("自动检测需要先标定应急车道区域", style = MaterialTheme.typography.bodySmall)
            }
            Spacer(modifier = Modifier.weight(1f))
            Button(onClick = { /* navigate to calibration */ }) { Text("去标定") }
        }
    }
}
```

- [ ] **Step 4: 模型加载失败降级入口**

在 `DetectionScreen.kt` Phase 4 已有状态显示。确保手动模拟按钮仍然可用：

```kotlin
when (uiState.modelStatus) {
    is ModelLoadStatus.Failed -> {
        Card(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("模型加载失败", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.error)
                Text((uiState.modelStatus as ModelLoadStatus.Failed).error, style = MaterialTheme.typography.bodySmall)
                Spacer(modifier = Modifier.height(8.dp))
                Text("已切换到手动模拟模式。自动检测不可用，但您可以手动生成事件。", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
    else -> {}
}
// Manual event button must stay enabled regardless of model status
```

- [ ] **Step 5: 上传失败队列状态**

在 `QueueScreen.kt` Phase 3 已有实现。增强重试反馈：

```kotlin
// Show toast/snackbar on retry result:
val snackbarHostState = remember { SnackbarHostState() }
Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
    // ... existing content ...
    TextButton(onClick = {
        viewModel.retryEvent(event.eventId)
        coroutineScope.launch { snackbarHostState.showSnackbar("已加入上传队列") }
    }) { Text("重试") }
}
```

- [ ] **Step 6: Commit**

```bash
git add android/
git commit -m "feat(android): add error states for camera permission, network, ROI, model, and upload"
```

---

### Task 6: 在线闭环验收

**Files:**
- Update only docs (acceptance record).

- [ ] **Step 1: 配置 Android**

填写 `http://<hp-lan-ip>:8000`，连接测试成功。

- [ ] **Step 2: 设备注册**

Web `/devices` 出现 vivo X100，`is_online: true`。

- [ ] **Step 3: ROI 标定**

完成至少 4 点 ROI 保存，检测页可见 ROI 多边形。

- [ ] **Step 4: 生成事件**

手动（Phase 3）或自动（Phase 4）生成一条事件并上传。

- [ ] **Step 5: Web 复核**

在 Web 详情页确认该事件，备注"演示确认"，保存成功。

- [ ] **Step 6: 第二条事件**

生成第二条事件并在 Web 驳回，备注"演示驳回"。列表筛选 `rejected` 可查到。

- [ ] **Step 7: 记录**

每步的通过/失败/备注写入验收文档 Task 8。

---

### Task 7: 离线和幂等验收

- [ ] **Step 1: 离线生成**

停止后端（Ctrl+C）或断开 WiFi，Android 生成事件。确认事件进入队列（`failed` 或 `queued`）。

- [ ] **Step 2: 恢复补传**

恢复后端，Android 重试上传，Web `/events` 出现事件。

- [ ] **Step 3: 重复上传幂等**

对同一 `event_id` 手动重试上传，后端返回 `duplicate: true`。Web 不出现重复事件。

- [ ] **Step 4: 复核不覆盖**

对已在 Step 5 确认的事件重复上传，确认 `review_status` 仍为 `confirmed`，`operator_note` 不变。

---

### Task 8: 验收文档

**Files:**
- Create: `docs/acceptance-phase5.md`

- [ ] **Step 1: 创建验收文档模板（预填已知信息）**

```markdown
# 首版验收记录 — Phase 5

- **日期:** [填写]
- **HP 电脑局域网 IP:** [填写]
- **Android 设备:** vivo X100
- **后端启动命令:** `cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Web 启动命令:** `cd frontend && bun run dev --host 0.0.0.0`
- **Android 构建命令:** `cd android && ./gradlew assembleDebug`
- **Android 构建版本:** 0.1.0
- **模型版本:** yolov8n-640-int8 (Phase 4) / manual-sim-0.1.0 (Phase 3 fallback)
- **仓库路径:** `emergency-lane-demo-new`
- **验收人:** [填写]

---

## 基线检查

| 项目 | 命令 | 结果 |
|---|---|---|
| 后端测试 | `uv run pytest` | [ ] 25 passed |
| 前端构建 | `bun run build` | [ ] 通过 |
| Android 构建 | `./gradlew assembleDebug` | [ ] 通过 |
| 种子数据 | `uv run python seed_data.py` | [ ] 2 devices + 10 events + 4 evidence |

---

## API 验收

| 端点 | 方法 | 验证内容 | 结果 |
|---|---|---|---|
| /api/health | GET | 返回 status: ok | [ ] |
| /api/devices | GET | 返回设备列表 | [ ] |
| /api/events | GET | 支持 status/device_id/分页筛选 | [ ] |
| /api/events/:id | GET | 返回事件详情含证据 | [ ] |
| /api/events/:id/review | PATCH | 更新复核状态 | [ ] |
| /api/stats/overview | GET | 返回统计数字 | [ ] |

---

## Web 验收

| 页面 | 验证内容 | 结果 |
|---|---|---|
| Dashboard | 统计卡、近期事件、5s 轮询 | [ ] |
| EventList | 筛选、分页、空状态 | [ ] |
| EventDetail | 结构化字段、证据图、复核面板 | [ ] |
| DeviceStatus | 设备卡片、在线状态 | [ ] |
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
| Android 崩溃 | `adb logcat | grep -E "AndroidRuntime|LaneDetect"` |
| 设备不出现 | `curl http://<hp-ip>:8000/api/devices` 检查 JSON |
| 事件不上传 | Android logcat 搜 `UploadWorker` / `HpApiClient` |
| 证据不显示 | `ls backend/data/evidence/` 确认文件存在 |
| 手机连不上 | 检查同一 WiFi、防火墙、`ip addr` |
```

- [ ] **Step 2: 填入实际执行结果**

完成 Task 6 和 Task 7 的验证后，逐一勾选复选框。

- [ ] **Step 3: 检查文档一致性**

确认文档中的所有命令与实际一致（后端启动、前端启动、Android 构建）。不写未实现的承诺。

- [ ] **Step 4: Commit**

```bash
git add docs/acceptance-phase5.md
git commit -m "docs: add Phase 5 acceptance record with pre-filled baseline"
```
