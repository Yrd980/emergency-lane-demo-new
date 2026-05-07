package com.emergency.lane.ui.queue

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.DeviceRepository
import com.emergency.lane.data.local.EvidenceFileEntity
import com.emergency.lane.data.local.EventQueueRepository
import com.emergency.lane.data.local.LocalEventEntity
import com.emergency.lane.data.remote.UploadRepository
import com.emergency.lane.data.remote.UploadWorker
import com.emergency.lane.domain.UploadState
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class QueueUiState(
    val events: List<QueuedEventItem> = emptyList(),
    val stats: Map<String, Int> = emptyMap(),
    val loading: Boolean = false,
    val uploading: Boolean = false,
    val error: String? = null,
    val actionMessage: String? = null
)

data class QueuedEventItem(
    val event: LocalEventEntity,
    val evidence: List<EvidenceFileEntity>
)

class QueueViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = EventQueueRepository(application)
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
                .combine(repo.observeEvidence()) { events, evidenceFiles ->
                    val evidenceByEvent = evidenceFiles.groupBy { it.eventId }
                    events.map { event ->
                        QueuedEventItem(
                            event = event,
                            evidence = evidenceByEvent[event.eventId].orEmpty()
                        )
                    } to statsFrom(events)
                }
                .catch { e ->
                    _uiState.value = _uiState.value.copy(loading = false, error = e.message)
                }
                .collect { (items, stats) ->
                    _uiState.value = _uiState.value.copy(
                        events = items,
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
                    events = repo.getAll().map { event ->
                        QueuedEventItem(
                            event = event,
                            evidence = repo.getEvidenceForEvent(event.eventId)
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

    fun retryEvent(eventId: String) {
        viewModelScope.launch {
            if (_uiState.value.uploading) return@launch
            _uiState.value = _uiState.value.copy(
                uploading = true,
                error = null,
                actionMessage = "Uploading $eventId..."
            )
            try {
                repo.retryEvent(eventId)
                val uploaded = uploadRepo.uploadPendingEvents()
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
                repo.getPendingUploads().forEach { event ->
                    repo.retryEvent(event.eventId)
                }
                val uploaded = uploadRepo.uploadPendingEvents()
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

    fun deleteEvent(eventId: String) {
        viewModelScope.launch {
            repo.deleteEvent(eventId)
            syncHeartbeat()
            refresh()
            _uiState.value = _uiState.value.copy(actionMessage = "Deleted $eventId")
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

    private fun statsFrom(events: List<LocalEventEntity>): Map<String, Int> {
        return mapOf(
            "queued" to events.count { it.uploadState == UploadState.QUEUED.name },
            "uploading" to events.count { it.uploadState == UploadState.UPLOADING.name },
            "uploaded" to events.count { it.uploadState == UploadState.UPLOADED.name },
            "failed" to events.count { it.uploadState == UploadState.FAILED.name },
            "local_created" to events.count { it.uploadState == UploadState.LOCAL_CREATED.name }
        )
    }
}
