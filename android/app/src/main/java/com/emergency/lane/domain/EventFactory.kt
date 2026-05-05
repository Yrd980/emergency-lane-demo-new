package com.emergency.lane.domain

import com.emergency.lane.data.local.EvidenceFileEntity
import com.emergency.lane.data.local.LocalEventEntity
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

object EventFactory {
    private var manualSeq = 0
    private var autoSeq = 0

    fun createAutoEventId(): String {
        autoSeq++
        val now = LocalDateTime.now()
        val fmt = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
        return "evt_${now.format(fmt)}_a%03d".format(autoSeq)
    }

    fun createManualEvent(
        deviceId: String,
        roiId: String = "roi_default",
        vehicleClass: String = "car"
    ): Pair<LocalEventEntity, EvidenceFileEntity> {
        manualSeq++
        val now = LocalDateTime.now()
        val fmt = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
        val eventId = "evt_${now.format(fmt)}_m%03d".format(manualSeq)
        val startTime = now.toString()
        val endTime = now.plusSeconds(12).toString()

        val vehicleBox = VehicleBox(120f, 220f, 180f, 90f)

        val event = LocalEventEntity(
            eventId = eventId,
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
            eventId = eventId,
            evidenceType = "frame_peak",
            localPath = "",
            mimeType = "image/jpeg"
        )

        return Pair(event, evidence)
    }
}
