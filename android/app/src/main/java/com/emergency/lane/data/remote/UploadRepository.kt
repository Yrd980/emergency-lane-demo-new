package com.emergency.lane.data.remote

import android.content.Context
import com.emergency.lane.data.local.EventQueueRepository
import com.emergency.lane.data.local.LocalEventEntity
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.domain.VehicleBox
import kotlinx.coroutines.flow.first
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.float
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class UploadRepository(private val context: Context) {
    private val queue = EventQueueRepository(context)
    private val settings = SettingsStore(context)
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    suspend fun uploadPendingEvents(): Int {
        var uploaded = 0
        val events = queue.getPendingUploads()
        if (events.isEmpty()) return 0

        val baseUrl = settings.baseUrl.first()
        if (baseUrl.isBlank()) return 0
        val client = HpApiClient(baseUrl)

        for (event in events) {
            try {
                queue.markUploading(event.eventId)
                val payload = EventUploadPayload(
                    event_id = event.eventId,
                    device_id = event.deviceId,
                    start_time = event.startTime,
                    end_time = event.endTime,
                    duration_seconds = event.durationSeconds,
                    roi_id = event.roiId,
                    track_id = event.trackId,
                    vehicle_class = event.vehicleClass,
                    vehicle_box = parseVehicleBox(event.vehicleBoxJson),
                    confidence = event.confidence
                )
                val body = json.encodeToString(payload)
                    .toRequestBody("application/json".toMediaType())

                val resp = client.api.createEvent(body)

                if (resp.isSuccessful) {
                    val result = resp.body()
                    if (result != null && (result.accepted || result.duplicate)) {
                        val evidenceFiles = queue.getEvidenceForEvent(event.eventId)
                        for (ev in evidenceFiles) {
                            if (ev.localPath.isNotBlank()) {
                                val file = File(ev.localPath)
                                if (file.exists()) {
                                    val filePart = MultipartBody.Part.createFormData(
                                        "file", file.name,
                                        file.asRequestBody(ev.mimeType.toMediaType())
                                    )
                                    val typePart = ev.evidenceType
                                        .toRequestBody("text/plain".toMediaType())
                                    client.api.uploadEvidence(event.eventId, typePart, filePart)
                                }
                            }
                        }
                        queue.markUploaded(event.eventId)
                        uploaded++
                    } else if (resp.code() == 422) {
                        queue.markFailed(event.eventId, "422 Invalid data — will not retry")
                    } else {
                        queue.markFailed(event.eventId, "Upload response was incomplete")
                    }
                } else if (resp.code() in 500..599) {
                    queue.markFailed(event.eventId, "HTTP ${resp.code()}")
                } else if (resp.code() == 404) {
                    queue.markFailed(event.eventId, "Event 404 on evidence upload — retry event upload")
                } else {
                    queue.markFailed(event.eventId, "HTTP ${resp.code()}")
                }
            } catch (e: Exception) {
                queue.markFailed(event.eventId, e.message ?: "Unknown error")
            }
        }
        return uploaded
    }

    private fun parseVehicleBox(raw: String): VehicleBox {
        return runCatching {
            val obj = json.decodeFromString<JsonObject>(raw)
            VehicleBox(
                x = obj.getValue("x").jsonPrimitive.float,
                y = obj.getValue("y").jsonPrimitive.float,
                width = obj.getValue("width").jsonPrimitive.float,
                height = obj.getValue("height").jsonPrimitive.float
            )
        }.getOrElse {
            VehicleBox(120f, 220f, 180f, 90f)
        }
    }
}
