package com.emergency.lane.camera

class InferenceScheduler(
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

    fun updateTargetFps(fps: Int) {
        // used by degradation logic
    }
}
