package com.emergency.lane.ui.queue

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.local.EventQueueRepository
import com.emergency.lane.data.local.LocalEventEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class QueueUiState(
    val events: List<LocalEventEntity> = emptyList(),
    val stats: Map<String, Int> = emptyMap()
)

class QueueViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = EventQueueRepository(application)
    private val _uiState = MutableStateFlow(QueueUiState())
    val uiState: StateFlow<QueueUiState> = _uiState

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = QueueUiState(
                events = repo.getAll(),
                stats = repo.getStats()
            )
        }
    }

    fun retryEvent(eventId: String) {
        viewModelScope.launch {
            repo.markFailed(eventId, "")  // Reset to QUEUED for retry
            refresh()
        }
    }

    fun retryAll() {
        viewModelScope.launch {
            repo.getPendingUploads().forEach { event ->
                if (event.uploadState == "FAILED") {
                    repo.markFailed(event.eventId, "")
                }
            }
            refresh()
        }
    }

    fun deleteEvent(eventId: String) {
        viewModelScope.launch {
            repo.markUploaded(eventId)
            refresh()
        }
    }
}
