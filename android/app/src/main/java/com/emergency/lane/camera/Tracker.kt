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
        val lostIds = activeTracks.filter { (_, t) ->
            nowMs - t.lastSeenMs > trackLostMs
        }.keys
        activeTracks -= lostIds

        if (detections.isEmpty()) return activeTracks.values.toList()

        val unmatchedDetections = detections.toMutableList()

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
            }
        }

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

    fun getAllTracks(): List<Track> = activeTracks.values.toList()

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
