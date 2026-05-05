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
