package com.emergency.lane.data.local

import android.content.Context
import com.emergency.lane.domain.UploadState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

class EventQueueRepository(context: Context) {
    private val db = AppDatabase.getInstance(context)
    private val eventDao = db.localEventDao()
    private val evidenceDao = db.evidenceFileDao()

    private val _pendingCount = MutableStateFlow(0)
    val pendingCount: Flow<Int> = _pendingCount

    suspend fun enqueueEvent(event: LocalEventEntity, evidence: List<EvidenceFileEntity>) {
        eventDao.upsert(event)
        evidence.forEach { evidenceDao.insert(it) }
        refreshPendingCount()
    }

    suspend fun getPendingUploads(): List<LocalEventEntity> = eventDao.getPendingUploads()

    suspend fun getStats(): Map<String, Int> = mapOf(
        "queued" to eventDao.countByState(UploadState.QUEUED.name),
        "uploading" to eventDao.countByState(UploadState.UPLOADING.name),
        "uploaded" to eventDao.countByState(UploadState.UPLOADED.name),
        "failed" to eventDao.countByState(UploadState.FAILED.name),
        "local_created" to eventDao.countByState(UploadState.LOCAL_CREATED.name)
    )

    suspend fun markUploaded(eventId: String) {
        eventDao.updateState(eventId, UploadState.UPLOADED.name)
        evidenceDao.deleteByEvent(eventId)
        refreshPendingCount()
    }

    suspend fun markFailed(eventId: String, error: String) {
        eventDao.updateState(eventId, UploadState.FAILED.name, error)
        refreshPendingCount()
    }

    suspend fun getAll(): List<LocalEventEntity> = eventDao.getAll()

    suspend fun getEvidenceForEvent(eventId: String): List<EvidenceFileEntity> =
        evidenceDao.getByEvent(eventId)

    suspend fun getPendingCount(): Int =
        eventDao.countByState(UploadState.QUEUED.name) +
        eventDao.countByState(UploadState.FAILED.name)

    private suspend fun refreshPendingCount() {
        _pendingCount.value = eventDao.countByState(UploadState.QUEUED.name) +
                eventDao.countByState(UploadState.FAILED.name)
    }
}
