package com.emergency.lane.data.remote

import com.emergency.lane.domain.VehicleBox
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class SuspectedIncidentUploadPayload(
    val suspected_incident_id: String,
    val device_id: String,
    val start_time: String,
    val end_time: String,
    val duration_seconds: Double,
    val roi_id: String,
    val track_id: String,
    val vehicle_class: String,
    val vehicle_box: VehicleBox,
    val confidence: Double,
    val gps_location: JsonObject? = null
)
