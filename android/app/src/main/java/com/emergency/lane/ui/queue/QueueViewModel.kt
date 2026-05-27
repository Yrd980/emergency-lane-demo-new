package com.emergency.lane.ui.queue

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.DeviceRepository
import com.emergency.lane.data.local.EvidenceFileEntity
import com.emergency.lane.data.local.SuspectedIncidentQueueRepository
import com.emergency.lane.data.local.LocalSuspectedIncidentEntity
import com.emergency.lane.data.remote.UploadRepository
import com.emergency.lane.data.remote.UploadWorker
import com.emergency.lane.domain.UploadState
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class QueueUiState(
    val suspectedIncidents: List<QueuedSuspectedIncidentItem> = emptyList(),
    val stats: Map<String, Int> = emptyMap(),
    val loading: Boolean = false,
    val uploading: Boolean = false,
    val error: String? = null,
    val actionMessage: String? = null
)

data class QueuedSuspectedIncidentItem(
    val suspectedIncident: LocalSuspectedIncidentEntity,
    val evidence: List<EvidenceFileEntity>
)

class QueueViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = SuspectedIncidentQueueRepository(application)
    private val deviceRepo = DeviceRepository(application)
    private val uploadRepo = UploadRepository(application)
    private val _uiState = MutableStateFlow(QueueUiState())
    val uiState: StateFlow<QueueUiState> = _uiState

    init {
        observeQueue()
    }

    private fun observeQueue() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            repo.observeAll()
                .combine(repo.observeEvidence()) { suspectedIncidents, evidenceFiles ->
                    val evidenceBySuspectedIncident = evidenceFiles.groupBy { it.suspectedIncidentId }
                    suspectedIncidents.map { suspectedIncident ->
                        QueuedSuspectedIncidentItem(
                            suspectedIncident = suspectedIncident,
                            evidence = evidenceBySuspectedIncident[suspectedIncident.suspectedIncidentId].orEmpty()
                        )
                    } to statsFrom(suspectedIncidents)
                }
                .catch { e ->
                    _uiState.value = _uiState.value.copy(loading = false, error = e.message)
                }
                .collect { (items, stats) ->
                    _uiState.value = _uiState.value.copy(
                        suspectedIncidents = items,
                        stats = stats,
                        loading = false,
                        error = null
                    )
                }
        }
    }

    fun refresh(showLoading: Boolean = true) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = showLoading, error = null)
            try {
                _uiState.value = QueueUiState(
                    suspectedIncidents = repo.getAll().map { suspectedIncident ->
                        QueuedSuspectedIncidentItem(
                            suspectedIncident = suspectedIncident,
                            evidence = repo.getEvidenceForSuspectedIncident(suspectedIncident.suspectedIncidentId)
                        )
                    },
                    stats = repo.getStats(),
                    loading = false,
                    uploading = _uiState.value.uploading,
                    actionMessage = _uiState.value.actionMessage
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(loading = false, error = e.message)
            }
        }
    }

    fun retrySuspectedIncident(suspectedIncidentId: String) {
        viewModelScope.launch {
            if (_uiState.value.uploading) return@launch
            _uiState.value = _uiState.value.copy(
                uploading = true,
                error = null,
                actionMessage = "Uploading $suspectedIncidentId..."
            )
            try {
                repo.retrySuspectedIncident(suspectedIncidentId)
                val uploaded = uploadRepo.uploadPendingSuspectedIncidents()
                syncHeartbeat()
                refresh()
                val pending = repo.getPendingCount()
                if (pending > 0) {
                    UploadWorker.enqueue(getApplication())
                }
                _uiState.value = _uiState.value.copy(
                    uploading = false,
                    actionMessage = uploadMessage(uploaded, pending)
                )
            } catch (e: Exception) {
                UploadWorker.enqueue(getApplication())
                syncHeartbeat()
                refresh()
                _uiState.value = _uiState.value.copy(
                    uploading = false,
                    error = e.message,
                    actionMessage = "Upload failed. Background retry queued."
                )
            }
        }
    }

    fun retryAll() {
        viewModelScope.launch {
            if (_uiState.value.uploading) return@launch
            val pendingBefore = repo.getPendingCount()
            if (pendingBefore == 0) {
                _uiState.value = _uiState.value.copy(actionMessage = "No pending uploads")
                return@launch
            }
            _uiState.value = _uiState.value.copy(
                uploading = true,
                error = null,
                actionMessage = "Uploading $pendingBefore pending item(s)..."
            )
            try {
                repo.getPendingUploads().forEach { suspectedIncident ->
                    repo.retrySuspectedIncident(suspectedIncident.suspectedIncidentId)
                }
                val uploaded = uploadRepo.uploadPendingSuspectedIncidents()
                syncHeartbeat()
                refresh()
                val pending = repo.getPendingCount()
                if (pending > 0) {
                    UploadWorker.enqueue(getApplication())
                }
                _uiState.value = _uiState.value.copy(
                    uploading = false,
                    actionMessage = uploadMessage(uploaded, pending)
                )
            } catch (e: Exception) {
                UploadWorker.enqueue(getApplication())
                syncHeartbeat()
                refresh()
                _uiState.value = _uiState.value.copy(
                    uploading = false,
                    error = e.message,
                    actionMessage = "Upload failed. Background retry queued."
                )
            }
        }
    }

    fun deleteSuspectedIncident(suspectedIncidentId: String) {
        viewModelScope.launch {
            repo.deleteSuspectedIncident(suspectedIncidentId)
            syncHeartbeat()
            refresh()
            _uiState.value = _uiState.value.copy(actionMessage = "Deleted $suspectedIncidentId")
        }
    }

    private suspend fun syncHeartbeat() {
        deviceRepo.sendHeartbeatOnce(
            pendingProvider = { repo.getPendingCount() }
        )
    }

    private fun uploadMessage(uploaded: Int, pending: Int): String {
        return when {
            uploaded > 0 && pending == 0 -> "Uploaded $uploaded item(s). Queue clear."
            uploaded > 0 -> "Uploaded $uploaded item(s). $pending still pending."
            pending > 0 -> "No upload completed. $pending item(s) still pending, background retry queued."
            else -> "No pending uploads"
        }
    }

    private fun statsFrom(suspectedIncidents: List<LocalSuspectedIncidentEntity>): Map<String, Int> {
        return mapOf(
            "queued" to suspectedIncidents.count { it.uploadState == UploadState.QUEUED.name },
            "uploading" to suspectedIncidents.count { it.uploadState == UploadState.UPLOADING.name },
            "uploaded" to suspectedIncidents.count { it.uploadState == UploadState.UPLOADED.name },
            "failed" to suspectedIncidents.count { it.uploadState == UploadState.FAILED.name },
            "local_created" to suspectedIncidents.count { it.uploadState == UploadState.LOCAL_CREATED.name }
        )
    }
}
