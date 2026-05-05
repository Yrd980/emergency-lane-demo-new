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

    fun mapStretchedInputToFrame(
        boxes: List<DetectionBox>,
        originalWidth: Int,
        originalHeight: Int,
        modelWidth: Int = 640,
        modelHeight: Int = 640
    ): List<DetectionBox> {
        val scaleX = originalWidth.toFloat() / modelWidth.toFloat()
        val scaleY = originalHeight.toFloat() / modelHeight.toFloat()
        return boxes.map { box ->
            val x = (box.x * scaleX).coerceIn(0f, originalWidth.toFloat())
            val y = (box.y * scaleY).coerceIn(0f, originalHeight.toFloat())
            val right = ((box.x + box.width) * scaleX).coerceIn(0f, originalWidth.toFloat())
            val bottom = ((box.y + box.height) * scaleY).coerceIn(0f, originalHeight.toFloat())
            box.copy(
                x = x,
                y = y,
                width = (right - x).coerceAtLeast(0f),
                height = (bottom - y).coerceAtLeast(0f)
            )
        }
    }
}
