# Phase 4: Android 模型接入 — 实现设计

## 目标

在 Phase 3 无模型闭环基础上接入端侧车辆检测模型，完成“相机帧 -> 推理 -> 跟踪 -> ROI 判定 -> 自动生成疑似占用事件 -> 上传 HP 电脑”的自动检测链路。

本阶段关注端侧可运行、可观察、可降级，不承诺达到执法级精度。

## 范围

包含：

- 端侧模型资产加载。
- 相机帧预处理和推理调度。
- 车辆检测框叠加显示。
- 轻量跟踪。
- ROI 多边形内判定。
- 停留时长阈值触发事件。
- 自动证据帧选择。
- 推理 FPS、耗时、温度状态展示。
- 模型失败时降级到手动模拟模式。

不包含：

- 手机端车牌 OCR。
- 云端模型训练平台。
- 执法级自动处罚。
- 多摄像头融合。
- 24 小时无人值守承诺。

## 模型方案

**默认选择：** 运行时 Google AI Edge LiteRT (TFLite)，模型优先使用 YOLOv8n 640×640 车辆检测版本。模型输入类型、量化参数和输出布局必须在运行时读取并记录，不能只按文件名假定。

- 模型文件：`app/src/main/assets/yolov8n_vehicle_640x640.tflite`，若使用量化版本可在文件名中追加 `int8` 或 `uint8`，但运行时仍以 tensor metadata 为准。
- 输入：优先 640×640×3 RGB；实际 dtype 以 `interpreter.getInputTensor(0)` 为准，支持 Float32 或 UInt8/Int8 量化输入。
- 输出：常见 YOLOv8 TFLite 输出为 `[1, 84, 8400]` 或 `[1, 8400, 84]`；解析前必须检查 shape，按布局选择索引方式。
- 类别：car (2), truck (7), bus (5)，无单独 emergency_vehicle 类别 — 用 car 近似。
- GPU 委托优先，CPU (4线程) 降级。
- 模型来源：从 Ultralytics YOLOv8n 导出 TFLite，或使用预训练 TFLite 版本；大模型文件不纳入 git，通过文档或脚本说明获取方式。

## 推理管线

```text
CameraX ImageAnalysis
  -> 帧率节流
  -> 图像旋转/缩放/归一化
  -> 模型推理
  -> NMS 后处理
  -> 坐标映射到预览画面
  -> 检测框叠加
  -> Tracker 更新
  -> ROI 判定
  -> 事件状态机
```

推理线程不得阻塞 UI 线程。若上一帧推理未完成，新帧可以丢弃。

## 检测结果结构

```json
{
  "frame_id": 1024,
  "timestamp_ms": 1710000000000,
  "inference_ms": 42,
  "detections": [
    {
      "class_name": "car",
      "confidence": 0.86,
      "box": {"x": 120, "y": 220, "width": 180, "height": 90}
    }
  ]
}
```

坐标约定：输出给 UI、跟踪和 ROI 判定的 `box` 必须统一映射到预览画面坐标系。预处理若使用 letterbox，映射回预览时必须减去 padding 后再除以缩放比例；不能用简单 X/Y 独立缩放替代。

## 轻量跟踪

使用 IoU-based 简单关联，纯 Kotlin 实现无额外依赖。

轨迹字段：

```json
{
  "track_id": "track_42",
  "class_name": "car",
  "first_seen_ms": 1710000000000,
  "last_seen_ms": 1710000001200,
  "last_box": {"x": 120, "y": 220, "width": 180, "height": 90},
  "confidence": 0.86,
  "inside_roi": true,
  "roi_enter_ms": 1710000000200,
  "roi_duration_ms": 10000,
  "event_created": false
}
```

关联规则建议：

- 同类别优先。
- IoU 超过阈值后关联到已有轨迹。
- 短时间漏检不删除轨迹。
- 丢失超过 `track_lost_seconds` 后结束轨迹。
- 单条轨迹一次 ROI 停留只生成一个事件。

## ROI 判定

默认判定点：

```text
bbox 底边中心点 = (x + width / 2, y + height)
```

如果判定点在 ROI 多边形内，则该轨迹处于应急车道区域。后续可以扩展为 bbox 与 ROI 面积交并比，但本阶段保持点内判定，便于稳定调试。

## 事件状态机

```text
outside_roi
  -> candidate
  -> event_created
  -> queued
  -> uploaded
```

触发条件：

- `class_name` 属于车辆类别。
- `confidence >= confidence_threshold`，默认 0.5。
- 轨迹进入 ROI。
- `roi_duration_ms >= occupation_seconds * 1000`，默认 10 秒。
- 当前轨迹尚未生成事件。

事件结束时间：

- 首选车辆离开 ROI 的时刻。
- 若轨迹丢失，使用 `last_seen_ms`。
- 若触发后立即上传，可先用触发时刻加当前 ROI 持续时间，后续补齐不是 Phase 4 必需项。

## 证据选择

每条自动事件至少保存：

- `frame_peak`：置信度最高或 ROI 停留触发时的画面。

建议保存：

- `frame_before`：触发前约 3 秒。
- `frame_after`：触发后约 3 秒。

关键帧应叠加：

- ROI 边界。
- 检测框。
- `track_id`。
- 事件 ID。
- 时间戳。
- 置信度。

## 配置项

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| model_path | bundled asset | 模型文件路径 |
| model_version | asset metadata | 上报到 HP 端 |
| inference_fps | 15 | 目标推理帧率 |
| confidence_threshold | 0.5 | 检测过滤阈值 |
| nms_threshold | 0.45 | 后处理阈值 |
| occupation_seconds | 10 | ROI 持续触发阈值 |
| track_lost_seconds | 2 | 轨迹丢失容忍 |
| thermal_degrade_enabled | true | 发热降级开关 |

## 性能与降级

目标：

- vivo X100 上推理稳定 12-18 FPS。
- UI 预览保持流畅。
- 上传不阻塞推理。

降级：

- 平均推理耗时过高时降低 `inference_fps`。
- 温度状态升高时降低推理频率。
- 模型加载失败时禁止自动检测，保留 Phase 3 手动模拟入口。
- 证据视频占用过高时只上传关键帧。

## 验收标准

- App 能显示模型版本和加载状态。
- 模型加载失败时有明确提示且 App 不崩溃。
- 预览画面能叠加车辆检测框和置信度。
- ROI 内车辆持续超过阈值后自动生成事件。
- 短暂经过 ROI 不生成事件。
- 同一轨迹不重复生成多条事件。
- 自动事件能上传到 HP Web 并显示证据图。
- 断网自动事件进入本地队列，恢复后补传。
- 心跳上报实际 FPS、温度状态和待上传数量。
- 在 vivo X100 上记录至少 5 分钟运行的平均 FPS、推理耗时和发热现象。

## 风险与对策

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| 模型格式不兼容 | 无法加载 | 先用最小 demo 加载模型，再接入业务链路 |
| 坐标映射错误 | ROI 判定错误 | 建立调试模式显示原始框和映射框 |
| 跟踪 ID 抖动 | 重复事件或漏事件 | 增加丢失容忍和单轨迹触发锁 |
| 发热降频 | FPS 下降 | 动态降低推理帧率和输入尺寸 |
| 误报较多 | 复核压力增加 | 提高阈值，保留人工复核作为最终结论 |
