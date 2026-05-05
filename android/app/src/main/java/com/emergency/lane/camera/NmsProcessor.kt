package com.emergency.lane.camera

import com.emergency.lane.domain.DetectionBox

object NmsProcessor {

    private val VEHICLE_CLASSES = setOf(2, 5, 7)
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
            dims[0] == 84 -> YoloOutputSpec(84, dims[1], YoloOutputLayout.CHANNELS_FIRST)
            dims[1] == 84 -> YoloOutputSpec(84, dims[0], YoloOutputLayout.BOXES_FIRST)
            else -> error("Unsupported YOLO output shape: ${shape.contentToString()}")
        }
    }

    private fun value(output: FloatArray, spec: YoloOutputSpec, boxIndex: Int, channelIndex: Int): Float {
        return when (spec.layout) {
            YoloOutputLayout.CHANNELS_FIRST -> output[channelIndex * spec.numBoxes + boxIndex]
            YoloOutputLayout.BOXES_FIRST -> output[boxIndex * spec.numChannels + channelIndex]
        }
    }

    fun parseYoloOutput(
        output: FloatArray,
        outputShape: IntArray,
        confidenceThreshold: Float = 0.5f
    ): List<DetectionBox> {
        val boxes = mutableListOf<DetectionBox>()
        val spec = outputSpec(outputShape)

        for (i in 0 until spec.numBoxes) {
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

        val interX1 = maxOf(ax1, bx1)
        val interY1 = maxOf(ay1, by1)
        val interX2 = minOf(ax2, bx2)
        val interY2 = minOf(ay2, by2)

        if (interX2 <= interX1 || interY2 <= interY1) return 0f

        val interArea = (interX2 - interX1) * (interY2 - interY1)
        val areaA = a.width * a.height
        val areaB = b.width * b.height
        return interArea / (areaA + areaB - interArea)
    }
}
