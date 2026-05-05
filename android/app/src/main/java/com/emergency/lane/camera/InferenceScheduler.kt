package com.emergency.lane.camera

class InferenceScheduler(
    targetFps: Int = 15
) {
    private var frameIntervalMs = 1000L / targetFps.coerceAtLeast(1)
    private var lastInferenceTime = 0L

    fun shouldRunInference(nowMs: Long): Boolean {
        return (nowMs - lastInferenceTime) >= frameIntervalMs
    }

    fun markInferenceDone(nowMs: Long) {
        lastInferenceTime = nowMs
    }

    fun updateTargetFps(fps: Int) {
        frameIntervalMs = 1000L / fps.coerceIn(1, 30)
    }
}
