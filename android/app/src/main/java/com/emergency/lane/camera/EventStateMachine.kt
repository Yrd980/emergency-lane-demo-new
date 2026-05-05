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
        if (!GeometryUtils.isVehicleClass(track.className) || track.confidence < config.confidenceThreshold) {
            return UpdateResult(State.OUTSIDE_ROI, null, 0, false)
        }

        if (track.eventCreated) {
            return UpdateResult(State.EVENT_CREATED, track.roiEnterMs, track.roiDurationMs, false)
        }

        return when {
            !insideRoi -> UpdateResult(State.OUTSIDE_ROI, null, 0, false)

            insideRoi && track.roiEnterMs == null -> {
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
