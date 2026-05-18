package com.emergency.lane.data.local

import android.content.Context
import com.emergency.lane.domain.UploadState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

class SuspectedIncidentQueueRepository(context: Context) {
    private val db = AppDatabase.getInstance(context)
    private val suspectedIncidentDao = db.localSuspectedIncidentDao()
    private val evidenceDao = db.evidenceFileDao()

    private val _pendingCount = MutableStateFlow(0)
    val pendingCount: Flow<Int> = _pendingCount

    suspend fun enqueueSuspectedIncident(suspectedIncident: LocalSuspectedIncidentEntity, evidence: List<EvidenceFileEntity>) {
        suspectedIncidentDao.upsert(suspectedIncident)
        evidence.forEach { evidenceDao.insert(it) }
        refreshPendingCount()
    }

    suspend fun getPendingUploads(): List<LocalSuspectedIncidentEntity> = suspectedIncidentDao.getPendingUploads()

    suspend fun getStats(): Map<String, Int> = mapOf(
        "queued" to suspectedIncidentDao.countByState(UploadState.QUEUED.name),
        "uploading" to suspectedIncidentDao.countByState(UploadState.UPLOADING.name),
        "uploaded" to suspectedIncidentDao.countByState(UploadState.UPLOADED.name),
        "failed" to suspectedIncidentDao.countByState(UploadState.FAILED.name),
        "local_created" to suspectedIncidentDao.countByState(UploadState.LOCAL_CREATED.name)
    )

    suspend fun markUploaded(suspectedIncidentId: String) {
        suspectedIncidentDao.setState(suspectedIncidentId, UploadState.UPLOADED.name)
        evidenceDao.deleteBySuspectedIncident(suspectedIncidentId)
        refreshPendingCount()
    }

    suspend fun markUploading(suspectedIncidentId: String) {
        suspectedIncidentDao.setState(suspectedIncidentId, UploadState.UPLOADING.name)
        refreshPendingCount()
    }

    suspend fun markFailed(suspectedIncidentId: String, error: String) {
        suspectedIncidentDao.setState(suspectedIncidentId, UploadState.FAILED.name, error)
        refreshPendingCount()
    }

    suspend fun retrySuspectedIncident(suspectedIncidentId: String) {
        suspectedIncidentDao.resetToQueued(suspectedIncidentId)
        refreshPendingCount()
    }

    suspend fun deleteSuspectedIncident(suspectedIncidentId: String) {
        evidenceDao.deleteBySuspectedIncident(suspectedIncidentId)
        suspectedIncidentDao.delete(suspectedIncidentId)
        refreshPendingCount()
    }

    suspend fun getAll(): List<LocalSuspectedIncidentEntity> = suspectedIncidentDao.getAll()

    fun observeAll(): Flow<List<LocalSuspectedIncidentEntity>> = suspectedIncidentDao.observeAll()

    fun observeEvidence(): Flow<List<EvidenceFileEntity>> = evidenceDao.observeAll()

    suspend fun getEvidenceForSuspectedIncident(suspectedIncidentId: String): List<EvidenceFileEntity> =
        evidenceDao.getBySuspectedIncident(suspectedIncidentId)

    suspend fun getPendingCount(): Int =
        suspectedIncidentDao.countByState(UploadState.QUEUED.name) +
        suspectedIncidentDao.countByState(UploadState.FAILED.name)

    private suspend fun refreshPendingCount() {
        _pendingCount.value = suspectedIncidentDao.countByState(UploadState.QUEUED.name) +
                suspectedIncidentDao.countByState(UploadState.FAILED.name)
    }
}
