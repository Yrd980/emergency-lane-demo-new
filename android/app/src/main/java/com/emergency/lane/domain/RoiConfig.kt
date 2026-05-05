package com.emergency.lane.domain

import kotlinx.serialization.Serializable

@Serializable
data class RoiPoint(val x: Float, val y: Float)

@Serializable
data class RoiConfig(
    val roiId: String = "roi_default",
    val frameWidth: Int = 1280,
    val frameHeight: Int = 720,
    val points: List<RoiPoint> = emptyList(),
    val updatedAt: String = ""
)

fun RoiConfig.isValid(): Boolean = points.size >= 4
