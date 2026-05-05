package com.emergency.lane.domain

object RuntimeMetrics {
    @Volatile var fps: Float = 0f
    @Volatile var avgInferenceMs: Long = 0L
}
