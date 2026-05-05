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
