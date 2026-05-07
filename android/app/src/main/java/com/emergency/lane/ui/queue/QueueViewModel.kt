package com.emergency.lane.ui.queue

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.DeviceRepository
import com.emergency.lane.data.local.EventQueueRepository
import com.emergency.lane.data.local.LocalEventEntity
import com.emergency.lane.data.remote.UploadWorker
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class QueueUiState(
    val events: List<LocalEventEntity> = emptyList(),
    val stats: Map<String, Int> = emptyMap(),
    val loading: Boolean = false,
    val error: String? = null,
    val actionMessage: String? = null
)

class QueueViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = EventQueueRepository(application)
    private val deviceRepo = DeviceRepository(application)
    private val _uiState = MutableStateFlow(QueueUiState())
    val uiState: StateFlow<QueueUiState> = _uiState

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            try {
                _uiState.value = QueueUiState(
                    events = repo.getAll(),
                    stats = repo.getStats(),
                    loading = false,
                    actionMessage = _uiState.value.actionMessage
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(loading = false, error = e.message)
            }
        }
    }

    fun retryEvent(eventId: String) {
        viewModelScope.launch {
            repo.retryEvent(eventId)
            UploadWorker.enqueue(getApplication())
            syncHeartbeat()
            refresh()
            _uiState.value = _uiState.value.copy(actionMessage = "Upload retry queued")
        }
    }

    fun retryAll() {
        viewModelScope.launch {
            repo.getPendingUploads().forEach { event ->
                repo.retryEvent(event.eventId)
            }
            UploadWorker.enqueue(getApplication())
            syncHeartbeat()
            refresh()
            _uiState.value = _uiState.value.copy(actionMessage = "Pending uploads queued")
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
}
