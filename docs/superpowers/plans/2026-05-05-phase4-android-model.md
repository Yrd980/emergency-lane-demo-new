# Phase 4: Android 模型接入 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Use TDD where practical for pure Kotlin/Java logic such as ROI point-in-polygon, IoU association, event state transitions, and upload queue behavior.

**Goal:** 在 Phase 3 Android 端基础上接入车辆检测模型，实现自动检测、跟踪、ROI 停留判定、自动事件生成和上传。

**Architecture:** TFLite 运行时通过 Google AI Edge LiteRT 加载 YOLOv8n 640×640 模型。CameraX ImageAnalysis 提供帧流 → 推理节流 → 预处理 (letterbox/normalize/quantize as tensor requires) → TFLite 推理 → NMS 后处理 → 坐标映射 → IoU 跟踪 → ROI 点内判定 → 事件状态机 → 复用 Phase 3 Room 队列上传。

**Tech Stack:** Phase 3 全部依赖 + Google AI Edge LiteRT (TFLite) 2.16 / 纯 Kotlin 几何和跟踪逻辑（无额外跟踪库）

**Depends on:** Phase 3 无模型闭环可用；HP 后端 Phase 2 API 可用。

**Out of Scope:** 车牌 OCR、云端训练、执法处罚、多摄像头融合。

**Model Asset Spec (locked):**
| 配置项 | 值 | 说明 |
|---|---|---|
| 运行时 | Google AI Edge LiteRT (TFLite) 2.16 | vivo X100 有良好的 TFLite GPU/NNAPI 委托支持 |
| 模型文件 | `app/src/main/assets/yolov8n_vehicle_640x640.tflite` | YOLOv8n TFLite 车辆检测；可为 float32 或 int8/uint8 量化 |
| 输入尺寸 | 读取 input tensor shape | 常见为 `[1,640,640,3]`，以模型实际 metadata/tensor 为准 |
| 输入类型 | 读取 input tensor dataType 和 quantizationParams | Float32 写归一化 float；量化模型按 scale/zeroPoint 写 byte |
| 输出格式 | 读取 output tensor shape | 常见 `[1,84,8400]` 或 `[1,8400,84]`，解析前必须判定布局 |
| 类别映射 | car=2, truck=7, bus=5, emergency_vehicle=-1 (用 COCO car/truck/bus) | 无专用 emergency_vehicle，用 car 近似 |
| 模型来源 | 从 Ultralytics YOLOv8n 导出为 TFLite，或使用预训练 TFLite 版本 | 不提交到 git（>5MB），通过文档/脚本说明获取方式 |

**Key Decisions (locked for this plan):**
| 决策 | 选择 | 理由 |
|---|---|---|
| ML 运行时 | Google AI Edge LiteRT (TFLite) | 最广泛的 Android 支持，vivo X100 GPU 委托可用 |
| 模型 | YOLOv8n TFLite 640×640 | 轻量，float32 先跑通，量化版本作为性能优化 |
| 跟踪算法 | IoU-based 简单关联 | 代码可控、可测试、不依赖 ByteTrack 等重依赖 |
| 判定点 | bbox 底边中心点 | 简单、稳定、适合应急车道场景（车辆底部接触地面） |
| 证据帧 | 仅 frame_peak | Phase 4 只保证触发帧；before/after 帧降级到 Phase 5 |

---

### Task 1: 模型资产与推理运行时

**Files:**
- Create: `android/app/src/main/assets/.gitkeep`
- Modify: `android/app/build.gradle.kts`
- Create: `android/app/src/main/java/com/emergency/lane/camera/ModelLoader.kt`
- Create: `android/app/src/main/java/com/emergency/lane/camera/InferenceEngine.kt`
- Create: `android/app/src/main/java/com/emergency/lane/domain/DetectionResult.kt`

- [ ] **Step 1: 添加 TFLite 依赖**

在 `app/build.gradle.kts` 的 `dependencies` 块追加：
```kotlin
// TFLite
implementation("com.google.ai.edge.litert:litert:2.16.0")
implementation("com.google.ai.edge.litert:litert-gpu:2.16.0")
```

- [ ] **Step 2: 定义检测结果数据类**

```kotlin
package com.emergency.lane.domain

data class DetectionBox(
    val x: Float, val y: Float,
    val width: Float, val height: Float,
    val className: String,
    val confidence: Float
)

data class FrameResult(
    val frameId: Long,
    val timestampMs: Long,
    val inferenceMs: Long,
    val detections: List<DetectionBox>
)
```

- [ ] **Step 3: 实现 ModelLoader**

```kotlin
package com.emergency.lane.camera

import android.content.Context
import com.google.ai.edge.litert.Interpreter
import com.google.ai.edge.litert.gpu.GpuDelegate
import java.nio.MappedByteBuffer
import java.io.FileInputStream
import java.nio.channels.FileChannel

data class ModelInfo(
    val version: String,
    val inputShape: IntArray,
    val inputDataType: String,
    val inputScale: Float,
    val inputZeroPoint: Int,
    val outputShape: IntArray,
    val outputDataType: String,
    val inputWidth: Int,
    val inputHeight: Int,
    val numClasses: Int = 80,
    val numBoxes: Int = 8400
)

sealed class ModelLoadResult {
    data class Loaded(val interpreter: Interpreter, val info: ModelInfo) : ModelLoadResult()
    data class Failed(val error: String) : ModelLoadResult()
}

class ModelLoader(private val context: Context) {

    fun load(modelPath: String = "yolov8n_vehicle_640x640.tflite"): ModelLoadResult {
        return try {
            val buf = loadModelFile(modelPath)
            val options = Interpreter.Options().apply {
                // Try GPU delegate first, fall back to CPU
                try {
                    addDelegate(GpuDelegate())
                } catch (_: Exception) {
                    setNumThreads(4)
                }
            }
            val interpreter = Interpreter(buf, options)
            val inputTensor = interpreter.getInputTensor(0)
            val outputTensor = interpreter.getOutputTensor(0)
            val inputShape = inputTensor.shape()
            val outputShape = outputTensor.shape()
            val inputQuant = inputTensor.quantizationParams()
            val info = ModelInfo(
                version = modelPath.removeSuffix(".tflite"),
                inputShape = inputShape,
                inputDataType = inputTensor.dataType().name,
                inputScale = inputQuant.scale,
                inputZeroPoint = inputQuant.zeroPoint,
                outputShape = outputShape,
                outputDataType = outputTensor.dataType().name,
                inputWidth = inputShape.getOrElse(2) { 640 },
                inputHeight = inputShape.getOrElse(1) { 640 },
                numBoxes = outputShape.maxOrNull() ?: 8400
            )
            ModelLoadResult.Loaded(interpreter, info)
        } catch (e: Exception) {
            ModelLoadResult.Failed(e.message ?: "Unknown model load error")
        }
    }

    private fun loadModelFile(path: String): MappedByteBuffer {
        context.assets.openFd(path).use { fd ->
            FileInputStream(fd.fileDescriptor).use { fis ->
                fis.channel.map(FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength)
            }
        }
    }
}
```

- [ ] **Step 4: 实现最小推理验证**

```kotlin
package com.emergency.lane.camera

import android.graphics.Bitmap
import com.google.ai.edge.litert.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
class InferenceEngine(
    private val interpreter: Interpreter,
    private val modelInfo: ModelInfo
) {

    private val inputWidth = modelInfo.inputWidth
    private val inputHeight = modelInfo.inputHeight
    private val outputSize = modelInfo.outputShape.fold(1) { acc, value -> acc * value }

    fun runInference(bitmap: Bitmap): Pair<FloatArray, Long> {
        val start = System.currentTimeMillis()

        // Preprocess: resize first; Task 2 replaces this with letterbox + metadata.
        val scaled = Bitmap.createScaledBitmap(bitmap, inputWidth, inputHeight, true)
        val isFloatInput = modelInfo.inputDataType == "FLOAT32"
        val bytesPerChannel = if (isFloatInput) 4 else 1
        val inputBuffer = ByteBuffer.allocateDirect(bytesPerChannel * inputWidth * inputHeight * 3)
            .order(ByteOrder.nativeOrder())
        val intValues = IntArray(inputWidth * inputHeight)
        scaled.getPixels(intValues, 0, inputWidth, 0, 0, inputWidth, inputHeight)
        for (pixel in intValues) {
            val channels = intArrayOf(
                (pixel shr 16) and 0xFF,
                (pixel shr 8) and 0xFF,
                pixel and 0xFF
            )
            for (channel in channels) {
                if (isFloatInput) {
                    inputBuffer.putFloat(channel / 255.0f)
                } else {
                    val quantized = (channel / 255.0f / modelInfo.inputScale + modelInfo.inputZeroPoint)
                        .toInt()
                        .coerceIn(0, 255)
                    inputBuffer.put(quantized.toByte())
                }
            }
        }

        // Run inference
        val output = FloatArray(outputSize)
        interpreter.run(inputBuffer, output)

        val elapsed = System.currentTimeMillis() - start
        return Pair(output, elapsed)
    }
}
```

- [ ] **Step 5: 加载失败降级 UI**

在 DetectionScreen 中添加模型状态显示：
```kotlin
// In DetectionUiState:
val modelStatus: ModelLoadStatus = ModelLoadStatus.NotLoaded

sealed class ModelLoadStatus {
    object NotLoaded : ModelLoadStatus()
    object Loading : ModelLoadStatus()
    data class Ready(val version: String) : ModelLoadStatus()
    data class Failed(val error: String) : ModelLoadStatus()
}
```

- [ ] **Step 6: 验证**

用一张测试图片调用推理，返回输出张量（可无检测框），不崩溃。日志中必须打印 input/output shape、dtype、quantizationParams。模型加载失败时显示错误但不阻塞手动模拟功能。

- [ ] **Step 7: Commit**

```bash
git add android/
git commit -m "feat(android): add TFLite model loader and inference engine"
```

---

### Task 2: 帧预处理和后处理

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/camera/FramePreprocessor.kt`
- Create: `android/app/src/main/java/com/emergency/lane/camera/NmsProcessor.kt`
- Create: `android/app/src/main/java/com/emergency/lane/camera/InferenceScheduler.kt`
- Create: `android/app/src/test/java/com/emergency/lane/camera/NmsProcessorTest.kt`

- [ ] **Step 1: 写 NMS 测试（TDD）**

```kotlin
package com.emergency.lane.camera

import org.junit.Assert.*
import org.junit.Test

class NmsProcessorTest {

    @Test
    fun `nms keeps highest confidence box and suppresses overlapping`() {
        val boxes = listOf(
            DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f),
            DetectionBox(105f, 205f, 180f, 90f, "car", 0.6f),  // high IoU, lower confidence
            DetectionBox(300f, 200f, 180f, 90f, "car", 0.8f)    // far away
        )
        val result = NmsProcessor.nms(boxes, iouThreshold = 0.45f, confidenceThreshold = 0.5f)
        assertEquals(2, result.size)
        assertTrue(result.any { it.confidence == 0.9f })
        assertTrue(result.any { it.confidence == 0.8f })
    }

    @Test
    fun `nms filters below confidence threshold`() {
        val boxes = listOf(
            DetectionBox(100f, 200f, 180f, 90f, "car", 0.4f),
            DetectionBox(300f, 200f, 180f, 90f, "car", 0.9f)
        )
        val result = NmsProcessor.nms(boxes, iouThreshold = 0.45f, confidenceThreshold = 0.5f)
        assertEquals(1, result.size)
        assertEquals(0.9f, result[0].confidence)
    }

    @Test
    fun `nms with empty input returns empty`() {
        val result = NmsProcessor.nms(emptyList(), iouThreshold = 0.45f, confidenceThreshold = 0.5f)
        assertTrue(result.isEmpty())
    }

    @Test
    fun `nms skips non-vehicle classes`() {
        val boxes = listOf(
            DetectionBox(100f, 200f, 180f, 90f, "person", 0.9f),
            DetectionBox(300f, 200f, 180f, 90f, "car", 0.8f)
        )
        val result = NmsProcessor.nms(boxes, iouThreshold = 0.45f, confidenceThreshold = 0.5f)
        assertEquals(1, result.size)
        assertEquals("car", result[0].className)
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd android && ./gradlew test
```
Expected: NmsProcessor 不存在，compile error.

- [ ] **Step 3: 实现 NMS 后处理**

```kotlin
package com.emergency.lane.camera

import com.emergency.lane.domain.DetectionBox
import kotlin.math.max
import kotlin.math.min

object NmsProcessor {

    // COCO class indices for vehicles
    private val VEHICLE_CLASSES = setOf(2, 5, 7)  // car, bus, truck
    private val CLASS_NAMES = mapOf(2 to "car", 5 to "bus", 7 to "truck")

    enum class YoloOutputLayout { CHANNELS_FIRST, BOXES_FIRST }

    data class YoloOutputSpec(
        val numChannels: Int,
        val numBoxes: Int,
        val layout: YoloOutputLayout
    )

    fun outputSpec(shape: IntArray): YoloOutputSpec {
        val dims = shape.filter { it > 1 }
        require(dims.size == 2) { "Unsupported YOLO output shape: ${shape.contentToString()}" }
        return when {
            dims[0] == 84 -> YoloOutputSpec(numChannels = 84, numBoxes = dims[1], layout = YoloOutputLayout.CHANNELS_FIRST)
            dims[1] == 84 -> YoloOutputSpec(numChannels = 84, numBoxes = dims[0], layout = YoloOutputLayout.BOXES_FIRST)
            else -> error("Unsupported YOLO output shape: ${shape.contentToString()}")
        }
    }

    private fun value(output: FloatArray, spec: YoloOutputSpec, boxIndex: Int, channelIndex: Int): Float {
        return when (spec.layout) {
            // [1, 84, 8400]: channel-major
            YoloOutputLayout.CHANNELS_FIRST -> output[channelIndex * spec.numBoxes + boxIndex]
            // [1, 8400, 84]: box-major
            YoloOutputLayout.BOXES_FIRST -> output[boxIndex * spec.numChannels + channelIndex]
        }
    }

    /**
     * Parse YOLOv8 output into DetectionBox list.
     * Supports both [1,84,8400] and [1,8400,84].
     * 84 channels: [cx, cy, w, h, ...80 class scores...].
     */
    fun parseYoloOutput(
        output: FloatArray,
        outputShape: IntArray,
        inputWidth: Int = 640,
        inputHeight: Int = 640,
        confidenceThreshold: Float = 0.5f
    ): List<DetectionBox> {
        val boxes = mutableListOf<DetectionBox>()
        val spec = outputSpec(outputShape)

        for (i in 0 until spec.numBoxes) {
            // Find max class score and index
            var maxScore = 0f
            var maxClassIdx = -1
            for (c in 4 until spec.numChannels) {
                val score = value(output, spec, i, c)
                if (score > maxScore) {
                    maxScore = score
                    maxClassIdx = c - 4
                }
            }

            if (maxScore < confidenceThreshold) continue
            if (maxClassIdx !in VEHICLE_CLASSES) continue

            val cx = value(output, spec, i, 0)
            val cy = value(output, spec, i, 1)
            val w = value(output, spec, i, 2)
            val h = value(output, spec, i, 3)

            boxes.add(DetectionBox(
                x = cx - w / 2,
                y = cy - h / 2,
                width = w,
                height = h,
                className = CLASS_NAMES[maxClassIdx] ?: "other_vehicle",
                confidence = maxScore
            ))
        }

        return boxes
    }

    fun nms(
        boxes: List<DetectionBox>,
        iouThreshold: Float = 0.45f,
        confidenceThreshold: Float = 0.5f
    ): List<DetectionBox> {
        val filtered = boxes.filter { it.confidence >= confidenceThreshold }
        if (filtered.isEmpty()) return emptyList()

        val sorted = filtered.sortedByDescending { it.confidence }.toMutableList()
        val kept = mutableListOf<DetectionBox>()

        while (sorted.isNotEmpty()) {
            val best = sorted.removeAt(0)
            kept.add(best)
            val toRemove = mutableListOf<DetectionBox>()
            for (box in sorted) {
                if (iou(best, box) > iouThreshold) {
                    toRemove.add(box)
                }
            }
            sorted.removeAll(toRemove)
        }
        return kept
    }

    fun iou(a: DetectionBox, b: DetectionBox): Float {
        val ax1 = a.x; val ay1 = a.y
        val ax2 = a.x + a.width; val ay2 = a.y + a.height
        val bx1 = b.x; val by1 = b.y
        val bx2 = b.x + b.width; val by2 = b.y + b.height

        val interX1 = max(ax1, bx1)
        val interY1 = max(ay1, by1)
        val interX2 = min(ax2, bx2)
        val interY2 = min(ay2, by2)

        if (interX2 <= interX1 || interY2 <= interY1) return 0f

        val interArea = (interX2 - interX1) * (interY2 - interY1)
        val areaA = a.width * a.height
        val areaB = b.width * b.height
        return interArea / (areaA + areaB - interArea)
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd android && ./gradlew test
```
Expected: All NMS tests PASS.

- [ ] **Step 5: 实现坐标映射**

```kotlin
package com.emergency.lane.camera

import com.emergency.lane.domain.DetectionBox

object CoordinateMapper {
    data class LetterboxMeta(
        val scale: Float,
        val padX: Float,
        val padY: Float,
        val originalWidth: Int,
        val originalHeight: Int
    )

    /**
     * Map detection boxes from model input space back to the preview frame.
     * This assumes preprocessing used letterbox resize. If preprocessing stretches
     * the frame instead, use a different mapper and document that decision.
     */
    fun mapToPreview(
        boxes: List<DetectionBox>,
        modelWidth: Int = 640,
        modelHeight: Int = 640,
        meta: LetterboxMeta
    ): List<DetectionBox> {
        return boxes.map { box ->
            val x = (box.x - meta.padX) / meta.scale
            val y = (box.y - meta.padY) / meta.scale
            val width = box.width / meta.scale
            val height = box.height / meta.scale
            box.copy(
                x = x.coerceIn(0f, meta.originalWidth.toFloat()),
                y = y.coerceIn(0f, meta.originalHeight.toFloat()),
                width = width.coerceAtLeast(0f),
                height = height.coerceAtLeast(0f)
            )
        }
    }
}
```

- [ ] **Step 6: 实现推理调度器**

```kotlin
package com.emergency.lane.camera

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class InferenceScheduler(
    private val engine: InferenceEngine,
    private val preprocessor: FramePreprocessor,
    private val targetFps: Int = 15
) {
    private val frameIntervalMs = 1000L / targetFps
    private var lastInferenceTime = 0L

    fun shouldRunInference(nowMs: Long): Boolean {
        return (nowMs - lastInferenceTime) >= frameIntervalMs
    }

    fun markInferenceDone(nowMs: Long) {
        lastInferenceTime = nowMs
    }
}
```

- [ ] **Step 7: Commit**

```bash
git add android/
git commit -m "feat(android): add NMS post-processor, coordinate mapper, and inference scheduler"
```

---

### Task 3: ROI 判定基础逻辑 (TDD)

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/domain/GeometryUtils.kt`
- Create: `android/app/src/test/java/com/emergency/lane/domain/GeometryUtilsTest.kt`

- [ ] **Step 1: 写 point-in-polygon 和判定点测试**

```kotlin
package com.emergency.lane.domain

import org.junit.Assert.*
import org.junit.Test

class GeometryUtilsTest {

    // A simple 4-point ROI covering roughly the right half of a 1280x720 frame
    private val sampleRoi = listOf(
        RoiPoint(820f, 210f),
        RoiPoint(1260f, 240f),
        RoiPoint(1270f, 710f),
        RoiPoint(620f, 710f)
    )

    @Test
    fun `point inside ROI returns true`() {
        val inside = RoiPoint(1000f, 500f)
        assertTrue(GeometryUtils.isPointInPolygon(inside, sampleRoi))
    }

    @Test
    fun `point outside ROI returns false`() {
        val outside = RoiPoint(100f, 500f)
        assertFalse(GeometryUtils.isPointInPolygon(outside, sampleRoi))
    }

    @Test
    fun `point on ROI boundary edge returns true`() {
        val onEdge = RoiPoint(820f, 210f)  // vertex
        assertTrue(GeometryUtils.isPointInPolygon(onEdge, sampleRoi))
    }

    @Test
    fun `empty ROI returns false`() {
        assertFalse(GeometryUtils.isPointInPolygon(RoiPoint(500f, 500f), emptyList()))
    }

    @Test
    fun `ROI with less than 3 points returns false`() {
        val twoPoints = listOf(RoiPoint(0f, 0f), RoiPoint(100f, 100f))
        assertFalse(GeometryUtils.isPointInPolygon(RoiPoint(50f, 50f), twoPoints))
    }

    @Test
    fun `bbox bottom center is correct`() {
        val box = DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)
        val point = GeometryUtils.bboxBottomCenter(box)
        assertEquals(100f + 90f, point.x, 0.01f)   // x + width/2
        assertEquals(200f + 90f, point.y, 0.01f)   // y + height
    }

    @Test
    fun `non-vehicle classes are filtered`() {
        assertTrue(GeometryUtils.isVehicleClass("car"))
        assertTrue(GeometryUtils.isVehicleClass("truck"))
        assertTrue(GeometryUtils.isVehicleClass("bus"))
        assertFalse(GeometryUtils.isVehicleClass("person"))
        assertFalse(GeometryUtils.isVehicleClass("bicycle"))
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd android && ./gradlew test --tests "*GeometryUtilsTest"
```

- [ ] **Step 3: 实现 GeometryUtils**

```kotlin
package com.emergency.lane.domain

object GeometryUtils {

    private val VEHICLE_CLASSES = setOf("car", "truck", "bus", "emergency_vehicle", "other_vehicle")

    fun isVehicleClass(className: String): Boolean = className in VEHICLE_CLASSES

    fun bboxBottomCenter(box: DetectionBox): RoiPoint {
        return RoiPoint(
            x = box.x + box.width / 2f,
            y = box.y + box.height
        )
    }

    /**
     * Ray-casting point-in-polygon test.
     * Returns false for fewer than 3 points.
     */
    fun isPointInPolygon(point: RoiPoint, polygon: List<RoiPoint>): Boolean {
        if (polygon.size < 3) return false
        if (polygon.any { p -> kotlin.math.abs(p.x - point.x) < 0.001f && kotlin.math.abs(p.y - point.y) < 0.001f }) {
            return true
        }
        for (i in polygon.indices) {
            val a = polygon[i]
            val b = polygon[(i + 1) % polygon.size]
            if (isPointOnSegment(point, a, b)) return true
        }

        var inside = false
        val n = polygon.size
        var j = n - 1

        for (i in 0 until n) {
            val pi = polygon[i]
            val pj = polygon[j]

            if ((pi.y > point.y) != (pj.y > point.y) &&
                point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x
            ) {
                inside = !inside
            }
            j = i
        }
        return inside
    }

    private fun isPointOnSegment(p: RoiPoint, a: RoiPoint, b: RoiPoint): Boolean {
        val cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y)
        if (kotlin.math.abs(cross) > 0.001f) return false
        val dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)
        if (dot < 0f) return false
        val squaredLen = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)
        return dot <= squaredLen
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd android && ./gradlew test --tests "*GeometryUtilsTest"
```
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add android/
git commit -m "feat(android): add point-in-polygon and vehicle class utilities (TDD)"
```

---

### Task 4: 轻量跟踪 (TDD)

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/camera/Tracker.kt`
- Create: `android/app/src/main/java/com/emergency/lane/domain/Track.kt`
- Create: `android/app/src/test/java/com/emergency/lane/camera/TrackerTest.kt`

- [ ] **Step 1: 定义 Track 数据类**

```kotlin
package com.emergency.lane.domain

data class Track(
    val trackId: String,
    val className: String,
    val firstSeenMs: Long,
    val lastSeenMs: Long,
    val lastBox: DetectionBox,
    val confidence: Float,
    val insideRoi: Boolean = false,
    val roiEnterMs: Long? = null,
    val roiDurationMs: Long = 0,
    val eventCreated: Boolean = false
)
```

- [ ] **Step 2: 写 Tracker 测试**

```kotlin
package com.emergency.lane.camera

import com.emergency.lane.domain.DetectionBox
import com.emergency.lane.domain.Track
import org.junit.Assert.*
import org.junit.Test

class TrackerTest {

    private val tracker = Tracker(trackLostMs = 2000)

    @Test
    fun `first detection creates new track`() {
        val boxes = listOf(DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f))
        val tracks = tracker.update(boxes, nowMs = 1000)
        assertEquals(1, tracks.size)
        assertEquals("car", tracks[0].className)
        assertEquals("track_0", tracks[0].trackId)
    }

    @Test
    fun `matching detection updates existing track`() {
        val box1 = DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)
        tracker.update(listOf(box1), nowMs = 1000)

        val box2 = DetectionBox(105f, 205f, 180f, 90f, "car", 0.85f)  // high IoU
        val tracks = tracker.update(listOf(box2), nowMs = 1200)

        assertEquals(1, tracks.size)
        assertEquals("track_0", tracks[0].trackId)
        assertEquals(1200, tracks[0].lastSeenMs)
    }

    @Test
    fun `track lost after timeout is removed`() {
        val box1 = DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)
        tracker.update(listOf(box1), nowMs = 1000)

        // No detection for > trackLostMs
        val tracks = tracker.update(emptyList(), nowMs = 3500)

        assertTrue(tracks.isEmpty())
    }

    @Test
    fun `brief gap does not lose track`() {
        val box1 = DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)
        tracker.update(listOf(box1), nowMs = 1000)
        tracker.update(emptyList(), nowMs = 1500)  // 500ms gap

        val box2 = DetectionBox(105f, 205f, 180f, 90f, "car", 0.85f)
        val tracks = tracker.update(listOf(box2), nowMs = 1800)

        assertEquals(1, tracks.size)
        assertEquals("track_0", tracks[0].trackId)
    }

    @Test
    fun `different class does not match existing track`() {
        tracker.update(listOf(DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)), nowMs = 1000)
        val tracks = tracker.update(
            listOf(DetectionBox(100f, 200f, 180f, 90f, "truck", 0.8f)),
            nowMs = 1200
        )
        assertEquals(2, tracks.size)
    }

    @Test
    fun `track ID is stable across multiple updates`() {
        for (i in 0..5) {
            val box = DetectionBox(100f + i * 2, 200f + i, 180f, 90f, "car", 0.9f)
            tracker.update(listOf(box), nowMs = 1000L + i * 200)
        }
        val tracks = tracker.update(
            listOf(DetectionBox(112f, 205f, 180f, 90f, "car", 0.88f)),
            nowMs = 2200
        )
        assertEquals(1, tracks.size)
        assertEquals("track_0", tracks[0].trackId)
    }
}
```

- [ ] **Step 3: 实现 Tracker**

```kotlin
package com.emergency.lane.camera

import com.emergency.lane.domain.DetectionBox
import com.emergency.lane.domain.Track

class Tracker(
    private val iouThreshold: Float = 0.3f,
    private val trackLostMs: Long = 2000
) {
    private var nextId = 0
    private val activeTracks = mutableMapOf<String, Track>()

    fun update(detections: List<DetectionBox>, nowMs: Long): List<Track> {
        // Remove lost tracks
        val lostIds = activeTracks.filter { (_, t) ->
            nowMs - t.lastSeenMs > trackLostMs
        }.keys
        activeTracks -= lostIds

        if (detections.isEmpty()) return activeTracks.values.toList()

        // Match detections to existing tracks by IoU (same class preferred)
        val unmatchedDetections = detections.toMutableList()
        val matchedTrackIds = mutableSetOf<String>()

        for ((trackId, track) in activeTracks) {
            val sameClass = unmatchedDetections.filter { it.className == track.className }
            val candidates = if (sameClass.isNotEmpty()) sameClass else unmatchedDetections

            val best = candidates.maxByOrNull { NmsProcessor.iou(it, track.lastBox) }
            if (best != null && NmsProcessor.iou(best, track.lastBox) >= iouThreshold) {
                activeTracks[trackId] = track.copy(
                    lastBox = best,
                    confidence = best.confidence,
                    lastSeenMs = nowMs
                )
                unmatchedDetections.remove(best)
                matchedTrackIds.add(trackId)
            }
        }

        // Create new tracks for unmatched detections
        for (detection in unmatchedDetections) {
            val newId = "track_${nextId++}"
            activeTracks[newId] = Track(
                trackId = newId,
                className = detection.className,
                firstSeenMs = nowMs,
                lastSeenMs = nowMs,
                lastBox = detection,
                confidence = detection.confidence
            )
        }

        return activeTracks.values.toList()
    }

    fun getTrack(trackId: String): Track? = activeTracks[trackId]

    fun updateRoiState(trackId: String, insideRoi: Boolean, roiEnterMs: Long?, durationMs: Long, eventCreated: Boolean) {
        activeTracks[trackId]?.let { track ->
            activeTracks[trackId] = track.copy(
                insideRoi = insideRoi,
                roiEnterMs = roiEnterMs,
                roiDurationMs = durationMs,
                eventCreated = eventCreated
            )
        }
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd android && ./gradlew test --tests "*TrackerTest"
```
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add android/
git commit -m "feat(android): add IoU-based tracker with TDD"
```

---

### Task 5: 自动事件状态机

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/camera/EventStateMachine.kt`
- Create: `android/app/src/test/java/com/emergency/lane/camera/EventStateMachineTest.kt`

- [ ] **Step 1: 写状态机测试**

```kotlin
package com.emergency.lane.camera

import com.emergency.lane.domain.DetectionBox
import com.emergency.lane.domain.Track
import org.junit.Assert.*
import org.junit.Test

class EventStateMachineTest {

    private val config = EventStateMachine.Config(
        occupationSeconds = 10,
        confidenceThreshold = 0.5f
    )
    private val machine = EventStateMachine(config)

    @Test
    fun `track entering ROI becomes candidate`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = false)
        val result = machine.update(track, insideRoi = true, nowMs = 10000)
        assertEquals(EventStateMachine.State.CANDIDATE, result.state)
        assertEquals(10000L, result.roiEnterMs)
    }

    @Test
    fun `candidate stays candidate under occupation threshold`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = true, roiEnterMs = 10000)
        val result = machine.update(track, insideRoi = true, nowMs = 15000) // 5s < 10s
        assertEquals(EventStateMachine.State.CANDIDATE, result.state)
        assertFalse(result.shouldCreateEvent)
    }

    @Test
    fun `candidate triggers event after occupation threshold`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = true, roiEnterMs = 10000)
        val result = machine.update(track, insideRoi = true, nowMs = 21000) // 11s >= 10s
        assertEquals(EventStateMachine.State.EVENT_CREATED, result.state)
        assertTrue(result.shouldCreateEvent)
    }

    @Test
    fun `track leaving ROI before threshold resets to outside`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = true, roiEnterMs = 10000)
        machine.update(track, insideRoi = true, nowMs = 12000)
        val result = machine.update(track, insideRoi = false, nowMs = 13000)
        assertEquals(EventStateMachine.State.OUTSIDE_ROI, result.state)
    }

    @Test
    fun `already created event does not trigger again`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = true, roiEnterMs = 10000, eventCreated = true)
        val result = machine.update(track, insideRoi = true, nowMs = 21000)
        assertFalse(result.shouldCreateEvent)
    }

    @Test
    fun `low confidence track does not trigger`() {
        val track = makeTrack("track_0", "car", 0.4f, insideRoi = true, roiEnterMs = 10000)
        val result = machine.update(track, insideRoi = true, nowMs = 21000)
        assertFalse(result.shouldCreateEvent)
    }

    @Test
    fun `non-vehicle class does not trigger`() {
        val track = makeTrack("track_0", "person", 0.9f, insideRoi = true, roiEnterMs = 10000)
        val result = machine.update(track, insideRoi = true, nowMs = 21000)
        assertEquals(EventStateMachine.State.OUTSIDE_ROI, result.state)
    }

    private fun makeTrack(
        id: String, className: String, confidence: Float,
        insideRoi: Boolean = false, roiEnterMs: Long? = null,
        eventCreated: Boolean = false
    ) = Track(
        trackId = id, className = className,
        firstSeenMs = 0, lastSeenMs = 0,
        lastBox = DetectionBox(100f, 200f, 180f, 90f, className, confidence),
        confidence = confidence, insideRoi = insideRoi,
        roiEnterMs = roiEnterMs, eventCreated = eventCreated
    )
}
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd android && ./gradlew test --tests "*EventStateMachineTest"
```

- [ ] **Step 3: 实现 EventStateMachine**

```kotlin
package com.emergency.lane.camera

import com.emergency.lane.domain.GeometryUtils
import com.emergency.lane.domain.Track

class EventStateMachine(private val config: Config = Config()) {

    data class Config(
        val occupationSeconds: Int = 10,
        val confidenceThreshold: Float = 0.5f
    )

    enum class State { OUTSIDE_ROI, CANDIDATE, EVENT_CREATED }

    data class UpdateResult(
        val state: State,
        val roiEnterMs: Long?,
        val durationMs: Long,
        val shouldCreateEvent: Boolean
    )

    fun update(track: Track, insideRoi: Boolean, nowMs: Long): UpdateResult {
        // Non-vehicle or low confidence — never trigger
        if (!GeometryUtils.isVehicleClass(track.className) || track.confidence < config.confidenceThreshold) {
            return UpdateResult(State.OUTSIDE_ROI, null, 0, false)
        }

        // Already created event — lock
        if (track.eventCreated) {
            return UpdateResult(State.EVENT_CREATED, track.roiEnterMs, track.roiDurationMs, false)
        }

        return when {
            !insideRoi -> UpdateResult(State.OUTSIDE_ROI, null, 0, false)

            insideRoi && track.roiEnterMs == null -> {
                // Just entered ROI
                UpdateResult(State.CANDIDATE, nowMs, 0, false)
            }

            insideRoi && track.roiEnterMs != null -> {
                val duration = nowMs - track.roiEnterMs!!
                if (duration >= config.occupationSeconds * 1000L) {
                    UpdateResult(State.EVENT_CREATED, track.roiEnterMs, duration, shouldCreateEvent = true)
                } else {
                    UpdateResult(State.CANDIDATE, track.roiEnterMs, duration, shouldCreateEvent = false)
                }
            }

            else -> UpdateResult(State.OUTSIDE_ROI, null, 0, false)
        }
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd android && ./gradlew test --tests "*EventStateMachineTest"
```
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add android/
git commit -m "feat(android): add event state machine with TDD"
```

---

### Task 6: 自动检测管线集成

**Files:**
- Modify: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionViewModel.kt`
- Modify: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionScreen.kt`

- [ ] **Step 1: 在 DetectionViewModel 中集成完整推理管线**

扩展现有 DetectionViewModel，添加推理管线：
```kotlin
// New fields in DetectionViewModel:
private var modelLoader: ModelLoader? = null
private var inferenceEngine: InferenceEngine? = null
private var tracker: Tracker? = null
private var stateMachine: EventStateMachine? = null
private var frameCounter = 0L

fun initDetection() {
    val loader = ModelLoader(getApplication())
    when (val result = loader.load()) {
        is ModelLoadResult.Loaded -> {
            inferenceEngine = InferenceEngine(result.interpreter)
            tracker = Tracker()
            stateMachine = EventStateMachine()
            _uiState.value = _uiState.value.copy(
                modelStatus = ModelLoadStatus.Ready(result.info.version)
            )
        }
        is ModelLoadResult.Failed -> {
            _uiState.value = _uiState.value.copy(
                modelStatus = ModelLoadStatus.Failed(result.error)
            )
        }
    }
    modelLoader = loader
}

fun processFrame(bitmap: Bitmap, previewWidth: Int, previewHeight: Int) {
    val engine = inferenceEngine ?: return
    val tkr = tracker ?: return
    val sm = stateMachine ?: return

    viewModelScope.launch(Dispatchers.Default) {
        try {
            val (rawOutput, inferenceMs) = engine.runInference(bitmap)
            val boxes = NmsProcessor.parseYoloOutput(rawOutput)
            val mapped = CoordinateMapper.mapToPreview(boxes, previewWidth = previewWidth, previewHeight = previewHeight)
            val afterNms = NmsProcessor.nms(mapped)

            val nowMs = System.currentTimeMillis()
            val tracks = tkr.update(afterNms, nowMs)

            // Update ROI state for each track
            val roiConfig = roiStore.roiConfig.first()
            for (track in tracks) {
                val insideRoi = if (roiConfig != null && roiConfig.isValid()) {
                    val bottomCenter = GeometryUtils.bboxBottomCenter(track.lastBox)
                    GeometryUtils.isPointInPolygon(bottomCenter, roiConfig.points)
                } else false

                val result = sm.update(track, insideRoi, nowMs)
                tkr.updateRoiState(track.trackId, insideRoi, result.roiEnterMs, result.durationMs, track.eventCreated)

                if (result.shouldCreateEvent) {
                    createAutoEvent(track, result)
                }
            }

            _uiState.value = _uiState.value.copy(
                detections = afterNms,
                tracks = tkr.getAllTracks(),
                fps = if (inferenceMs > 0) 1000f / inferenceMs else 0f,
                inferenceMs = inferenceMs
            )
            frameCounter++
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(inferenceError = e.message)
        }
    }
}

private suspend fun createAutoEvent(track: Track, result: EventStateMachine.UpdateResult) {
    val deviceId = settingsStore.deviceId.first()
    val roiConfig = roiStore.roiConfig.first()

    val event = LocalEventEntity(
        eventId = EventFactory.createAutoEventId(),
        deviceId = deviceId,
        startTime = java.time.Instant.ofEpochMilli(result.roiEnterMs!!).toString(),
        endTime = java.time.Instant.ofEpochMilli(System.currentTimeMillis()).toString(),
        durationSeconds = result.durationMs / 1000.0,
        roiId = roiConfig?.roiId ?: "roi_default",
        trackId = track.trackId,
        vehicleClass = track.className,
        vehicleBoxJson = "{\"x\":${track.lastBox.x},\"y\":${track.lastBox.y},\"width\":${track.lastBox.width},\"height\":${track.lastBox.height}}",
        confidence = track.confidence.toDouble(),
        gpsJson = "null",
        uploadState = UploadState.QUEUED.name,
        createdAt = java.time.Instant.now().toString()
    )

    // Capture frame_peak
    var evidencePath = ""
    try {
        val bitmap = cameraController?.captureFrame()
        if (bitmap != null) {
            evidencePath = saveBitmapToCache(bitmap, "${event.eventId}_frame_peak.jpg")
        }
    } catch (_: Exception) {}

    val evidence = EvidenceFileEntity(
        eventId = event.eventId,
        evidenceType = "frame_peak",
        localPath = evidencePath,
        mimeType = "image/jpeg"
    )

    eventQueue.enqueueEvent(event, listOf(evidence))
    UploadWorker.enqueue(getApplication())

    _uiState.value = _uiState.value.copy(
        lastEventId = event.eventId,
        pendingUploadCount = eventQueue.getPendingUploads().size
    )
}
```

- [ ] **Step 2: 在 DetectionScreen 中添加检测框覆盖层**

在相机预览上方叠加 Canvas 绘制检测框和 track ID：
```kotlin
// Add overlay Canvas after the AndroidView preview:
Canvas(modifier = Modifier.fillMaxSize()) {
    uiState.detections.forEach { det ->
        val box = det
        // Draw bounding box
        drawRect(
            color = Color.Red,
            topLeft = Offset(box.x, box.y),
            size = androidx.compose.ui.geometry.Size(box.width, box.height),
            style = Stroke(width = 3f)
        )
        // Draw label
        drawContext.canvas.nativeCanvas.drawText(
            "${box.className} ${"%.2f".format(box.confidence)}",
            box.x, box.y - 4f,
            android.graphics.Paint().apply {
                color = android.graphics.Color.RED
                textSize = 36f
            }
        )
    }
}

// Show model status
when (val status = uiState.modelStatus) {
    is ModelLoadStatus.Failed ->
        Text("模型加载失败: ${status.error} — 可使用手动模拟", color = MaterialTheme.colorScheme.error)
    is ModelLoadStatus.Ready ->
        Text("模型: ${status.version} | FPS: ${"%.1f".format(uiState.fps)} | 推理: ${uiState.inferenceMs}ms")
    else -> {}
}
```

- [ ] **Step 3: 验证**

在 vivo X100 上运行，确认：检测框叠加正确、track ID 显示稳定、ROI 内持续 10s 后自动生成事件。

- [ ] **Step 4: Commit**

```bash
git add android/
git commit -m "feat(android): integrate detection pipeline with auto event creation"
```

---

### Task 7: 性能与降级

**Files:**
- Modify: `android/app/src/main/java/com/emergency/lane/camera/InferenceScheduler.kt`
- Modify: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionViewModel.kt`

- [ ] **Step 1: 采集推理指标**

在 DetectionViewModel 中维护滑动窗口指标：
```kotlin
private val recentInferenceMs = ArrayDeque<Long>(20)

fun processFrame(bitmap: Bitmap, previewWidth: Int, previewHeight: Int) {
    // ... existing code ...
    recentInferenceMs.addLast(inferenceMs)
    if (recentInferenceMs.size > 20) recentInferenceMs.removeFirst()

    val avgMs = if (recentInferenceMs.isNotEmpty()) recentInferenceMs.average().toLong() else 0L
    _uiState.value = _uiState.value.copy(
        avgInferenceMs = avgMs,
        fps = if (avgMs > 0) 1000f / avgMs else 0f
    )
}
```

- [ ] **Step 2: 动态降级**

```kotlin
fun maybeDegrade(): Int {
    val avgMs = _uiState.value.avgInferenceMs
    return when {
        avgMs > 150 -> 3   // Very slow: 3 FPS
        avgMs > 80  -> 5   // Slow: 5 FPS
        avgMs > 50  -> 10  // Moderate: 10 FPS
        else -> 15          // Normal: 15 FPS
    }
}
```

- [ ] **Step 3: 心跳集成模型指标**

更新心跳上报，添加实际 FPS 和待上传数量：
```kotlin
// In DeviceRepository.startHeartbeat():
HeartbeatRequest(
    deviceId = deviceId,
    batteryLevel = getBatteryLevel(),
    thermalState = getThermalState(),
    fps = detectionViewModel?.uiState?.value?.fps ?: 0f,
    pendingUploadCount = eventQueueRepository.getPendingUploads().size
)
```

- [ ] **Step 4: 5 分钟运行记录**

运行 App 检测模式 5 分钟，记录平均 FPS、推理耗时、温度变化。结果输出到 logcat:
```
E/LaneDetect: 5min report: avgFPS=14.2, avgInferenceMs=42, peakInferenceMs=68, thermal=normal
```

- [ ] **Step 5: Commit**

```bash
git add android/
git commit -m "feat(android): add performance metrics and dynamic FPS degradation"
```

---

### Task 8: 自动检测验收

- [ ] **Step 1: HP 端启动**

```bash
cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
cd frontend && bun run dev --host 0.0.0.0
```

- [ ] **Step 2: Android 端启动**

加载模型，完成 ROI 标定，确认检测框显示和模型版本。

- [ ] **Step 3: 短暂进入测试**

让样本短暂经过 ROI（<10s），确认不生成事件。

- [ ] **Step 4: 持续占用测试**

在 ROI 内停留 >10s，确认自动生成事件并上传到 Web。

- [ ] **Step 5: 重复触发测试**

同一轨迹持续停留，Web 不出现重复事件（每条 track 只触发一次）。

- [ ] **Step 6: 离线补传测试**

断网 → 事件进队列 → 恢复 → Web 出现。

- [ ] **Step 7: Web 复核**

确认 1 条自动事件、驳回 1 条。重复上传不覆盖复核状态。

- [ ] **Step 8: 记录 5 分钟指标到验收文档**

- [ ] **Step 9: Commit (if docs updated)**

```bash
git add docs/
git commit -m "docs: add Phase 4 auto-detection verification results"
```
