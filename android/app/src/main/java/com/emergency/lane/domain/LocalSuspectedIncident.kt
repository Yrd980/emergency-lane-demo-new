package com.emergency.lane.domain

import kotlinx.serialization.Serializable

enum class UploadState { LOCAL_CREATED, QUEUED, UPLOADING, UPLOADED, FAILED }

@Serializable
data class VehicleBox(val x: Float, val y: Float, val width: Float, val height: Float)

@Serializable
data class GpsLocation(val latitude: Double, val longitude: Double)
