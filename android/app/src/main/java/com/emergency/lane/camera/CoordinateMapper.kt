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
}
