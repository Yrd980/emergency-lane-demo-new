package com.emergency.lane.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class HealthResponse(val status: String)

@Serializable
data class DeviceRegisterRequest(
    @SerialName("device_id") val deviceId: String,
    @SerialName("device_name") val deviceName: String,
    @SerialName("app_version") val appVersion: String,
    @SerialName("model_version") val modelVersion: String
)

@Serializable
data class DeviceRegisterResponse(
    @SerialName("device_id") val deviceId: String,
    val registered: Boolean
)

@Serializable
data class HeartbeatRequest(
    @SerialName("device_id") val deviceId: String,
    @SerialName("battery_level") val batteryLevel: Float,
    @SerialName("thermal_state") val thermalState: String,
    val fps: Float,
    @SerialName("pending_upload_count") val pendingUploadCount: Int
)

@Serializable
data class HeartbeatResponse(val status: String, @SerialName("device_id") val deviceId: String)

@Serializable
data class EventCreateResponse(
    @SerialName("event_id") val eventId: String,
    val accepted: Boolean,
    val duplicate: Boolean = false
)

@Serializable
data class EventListResponse(
    val items: List<EventListItem>,
    val total: Int
)

@Serializable
data class EventListItem(
    @SerialName("event_id") val eventId: String,
    @SerialName("device_id") val deviceId: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_seconds") val durationSeconds: Double,
    @SerialName("vehicle_class") val vehicleClass: String,
    val confidence: Double,
    @SerialName("review_status") val reviewStatus: String,
    @SerialName("thumbnail_url") val thumbnailUrl: String = "",
    @SerialName("risk_level") val riskLevel: String? = null,
    @SerialName("review_priority_reason") val reviewPriorityReason: String? = null
)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val token: String,
    val user: AuthUser
)

@Serializable
data class AuthUser(
    val id: Int,
    val username: String,
    @SerialName("display_name") val displayName: String,
    val role: String,
    val permissions: List<String>
)

@Serializable
data class TaskListResponse(
    val items: List<TaskItem>,
    val total: Int
)

@Serializable
data class TaskItem(
    @SerialName("task_id") val taskId: String,
    @SerialName("event_id") val eventId: String,
    val status: String,
    val note: String = "",
    @SerialName("assigned_to_display_name") val assignedToDisplayName: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("accepted_at") val acceptedAt: String? = null,
    @SerialName("completed_at") val completedAt: String? = null,
    @SerialName("vehicle_class") val vehicleClass: String,
    val confidence: Double,
    @SerialName("start_time") val startTime: String,
    @SerialName("device_id") val deviceId: String,
    @SerialName("risk_level") val riskLevel: String,
    @SerialName("thumbnail_url") val thumbnailUrl: String = ""
)

@Serializable
data class CompleteTaskRequest(
    @SerialName("completed_note") val completedNote: String
)
