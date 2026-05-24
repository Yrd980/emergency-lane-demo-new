package com.emergency.lane.data.remote

import android.content.Context
import com.emergency.lane.data.local.SuspectedIncidentQueueRepository
import com.emergency.lane.data.local.LocalSuspectedIncidentEntity
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
    private val queue = SuspectedIncidentQueueRepository(context)
    private val settings = SettingsStore(context)
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    suspend fun uploadPendingSuspectedIncidents(): Int {
        var uploaded = 0
        val suspectedIncidents = queue.getPendingUploads()
        if (suspectedIncidents.isEmpty()) return 0

        val baseUrl = settings.baseUrl.first()
        if (baseUrl.isBlank()) return 0
        val client = HpApiClient(baseUrl)
        val authorization = authHeader()

        for (suspectedIncident in suspectedIncidents) {
            try {
                queue.markUploading(suspectedIncident.suspectedIncidentId)
                val payload = SuspectedIncidentUploadPayload(
                    suspected_incident_id = suspectedIncident.suspectedIncidentId,
                    device_id = suspectedIncident.deviceId,
                    start_time = suspectedIncident.startTime,
                    end_time = suspectedIncident.endTime,
                    duration_seconds = suspectedIncident.durationSeconds,
                    roi_id = suspectedIncident.roiId,
                    track_id = suspectedIncident.trackId,
                    vehicle_class = suspectedIncident.vehicleClass,
                    vehicle_box = parseVehicleBox(suspectedIncident.vehicleBoxJson),
                    confidence = suspectedIncident.confidence
                )
                val body = json.encodeToString(payload)
                    .toRequestBody("application/json".toMediaType())

                val resp = client.api.createSuspectedIncident(authorization, body)

                if (resp.isSuccessful) {
                    val result = resp.body()
                    if (result != null && (result.accepted || result.duplicate)) {
                        val evidenceFiles = queue.getEvidenceForSuspectedIncident(suspectedIncident.suspectedIncidentId)
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
                                    client.api.uploadEvidence(authorization, suspectedIncident.suspectedIncidentId, typePart, filePart)
                                }
                            }
                        }
                        queue.markUploaded(suspectedIncident.suspectedIncidentId)
                        uploaded++
                    } else if (resp.code() == 422) {
                        queue.markFailed(suspectedIncident.suspectedIncidentId, "422 Invalid data — will not retry")
                    } else {
                        queue.markFailed(suspectedIncident.suspectedIncidentId, "Upload response was incomplete")
                    }
                } else if (resp.code() in 500..599) {
                    queue.markFailed(suspectedIncident.suspectedIncidentId, "HTTP ${resp.code()}")
                } else if (resp.code() == 404) {
                    queue.markFailed(suspectedIncident.suspectedIncidentId, "Suspected incident 404 on evidence upload — retry suspectedIncident upload")
                } else {
                    queue.markFailed(suspectedIncident.suspectedIncidentId, "HTTP ${resp.code()}")
                }
            } catch (e: Exception) {
                queue.markFailed(suspectedIncident.suspectedIncidentId, e.message ?: "Unknown error")
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

    private suspend fun authHeader(): String? {
        val token = settings.authToken.first()
        return token.takeIf { it.isNotBlank() }?.let { "Bearer $it" }
    }
}
