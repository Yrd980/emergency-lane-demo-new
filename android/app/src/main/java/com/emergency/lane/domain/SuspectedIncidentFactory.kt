package com.emergency.lane.domain

import com.emergency.lane.data.local.EvidenceFileEntity
import com.emergency.lane.data.local.LocalSuspectedIncidentEntity
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

object SuspectedIncidentFactory {
    private var manualSeq = 0
    private var autoSeq = 0

    fun createAutoSuspectedIncidentId(): String {
        autoSeq++
        val now = LocalDateTime.now()
        val fmt = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
        return "evt_${now.format(fmt)}_a%03d".format(autoSeq)
    }

    fun createManualSuspectedIncident(
        deviceId: String,
        roiId: String = "roi_default",
        vehicleClass: String = "car"
    ): Pair<LocalSuspectedIncidentEntity, EvidenceFileEntity> {
        manualSeq++
        val now = LocalDateTime.now()
        val fmt = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
        val suspectedIncidentId = "evt_${now.format(fmt)}_m%03d".format(manualSeq)
        val startTime = now.toString()
        val endTime = now.plusSeconds(12).toString()

        val vehicleBox = VehicleBox(120f, 220f, 180f, 90f)

        val suspectedIncident = LocalSuspectedIncidentEntity(
            suspectedIncidentId = suspectedIncidentId,
            deviceId = deviceId,
            startTime = startTime,
            endTime = endTime,
            durationSeconds = 12.0,
            roiId = roiId,
            trackId = "manual_track_%03d".format(manualSeq),
            vehicleClass = vehicleClass,
            vehicleBoxJson = "{\"x\":120,\"y\":220,\"width\":180,\"height\":90}",
            confidence = 0.86,
            gpsJson = "null",
            uploadState = UploadState.QUEUED.name,
            createdAt = now.toString()
        )

        val evidence = EvidenceFileEntity(
            suspectedIncidentId = suspectedIncidentId,
            evidenceType = "frame_peak",
            localPath = "",
            mimeType = "image/jpeg"
        )

        return Pair(suspectedIncident, evidence)
    }
}
