package com.emergency.lane.ui.feed

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.data.remote.HpApiClient
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class PatrolDashboardState(
    val activeTaskCount: Int = 0,
    val assignedTaskCount: Int = 0,
    val incidents: List<IncidentItem> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    val needsConfiguration: Boolean = false,
    val username: String = "",
    val backendUrl: String = ""
)

data class IncidentItem(
    val eventId: String,
    val taskId: String,
    val status: String,
    val title: String,
    val location: String,
    val detectedAgo: String,
    val detectedTime: String,
    val reviewPriority: String,
    val vehicleClass: String,
    val confidence: Double,
    val thumbnailUrl: String = ""
)

class PatrolDashboardViewModel(application: Application) : AndroidViewModel(application) {
    private val _uiState = MutableStateFlow(PatrolDashboardState())
    val uiState: StateFlow<PatrolDashboardState> = _uiState

    private val settingsStore = SettingsStore(application)
    private var syncJob: Job? = null

    init {
        refresh()
        startTaskSync()
    }

    fun refresh() {
        refresh(showLoading = true)
    }

    private fun startTaskSync() {
        if (syncJob != null) return
        syncJob = viewModelScope.launch {
            while (true) {
                delay(TASK_SYNC_INTERVAL_MS)
                refresh(showLoading = false)
            }
        }
    }

    private fun refresh(showLoading: Boolean) {
        viewModelScope.launch {
            loadTasks(showLoading)
        }
    }

    override fun onCleared() {
        syncJob?.cancel()
        super.onCleared()
    }

    private suspend fun loadTasks(showLoading: Boolean) {
        if (showLoading) {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
        }
        try {
            val baseUrl = settingsStore.baseUrl.first()
            if (baseUrl.isBlank()) {
                _uiState.value = PatrolDashboardState(
                    loading = false,
                    error = "Configure the HP backend address before loading tasks.",
                    needsConfiguration = true
                )
                return
            }
            val client = HpApiClient(baseUrl)
            val username = settingsStore.authUsername.first()
            val password = settingsStore.authPassword.first()
            val token = if (username.isNotBlank() && password.isNotBlank()) {
                val login = client.login(username, password).getOrThrow()
                settingsStore.saveAuthToken(login.token)
                login.token
            } else {
                val storedToken = settingsStore.authToken.first()
                if (storedToken.isBlank()) {
                    _uiState.value = PatrolDashboardState(
                        loading = false,
                        error = "Add HP username and password in Account before loading tasks.",
                        needsConfiguration = true,
                        backendUrl = baseUrl
                    )
                    return
                }
                storedToken
            }
            val result = client.getTasks(token, limit = 20)
            result.fold(
                onSuccess = { response ->
                    val items = response.items.map { api ->
                        IncidentItem(
                            eventId = api.eventId,
                            taskId = api.taskId,
                            status = api.status,
                            title = "${api.vehicleClass} 处置任务",
                            location = "设备：${api.deviceId}",
                            detectedAgo = api.status,
                            detectedTime = api.startTime.takeLast(8),
                            reviewPriority = api.reviewPriority ?: api.riskLevel,
                            vehicleClass = api.vehicleClass,
                            confidence = api.confidence,
                            thumbnailUrl = absoluteUrl(baseUrl, api.thumbnailUrl)
                        )
                    }
                    val activeCount = items.count { it.status != "completed" }
                    _uiState.value = PatrolDashboardState(
                        activeTaskCount = activeCount,
                        assignedTaskCount = response.total,
                        incidents = items,
                        loading = false,
                        username = username,
                        backendUrl = baseUrl
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        loading = false,
                        error = it.message,
                        username = username,
                        backendUrl = baseUrl
                    )
                }
            )
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(loading = false, error = e.message)
        }
    }

    fun acceptTask(taskId: String) {
        updateTask(taskId, complete = false)
    }

    fun completeTask(taskId: String) {
        updateTask(taskId, complete = true, note = "Completed")
    }

    private fun updateTask(taskId: String, complete: Boolean, note: String = "") {
        viewModelScope.launch {
            try {
                val baseUrl = settingsStore.baseUrl.first()
                val token = settingsStore.authToken.first()
                if (baseUrl.isBlank() || token.isBlank()) {
                    _uiState.value = _uiState.value.copy(
                        error = "Backend and login must be configured before updating tasks.",
                        needsConfiguration = true
                    )
                    return@launch
                }
                val client = HpApiClient(baseUrl)
                val result = if (complete) client.completeTask(token, taskId, note) else client.acceptTask(token, taskId)
                result.onSuccess { refresh() }
                result.onFailure { _uiState.value = _uiState.value.copy(error = it.message) }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = e.message)
            }
        }
    }

    private fun absoluteUrl(baseUrl: String, path: String): String {
        if (path.isBlank()) return ""
        if (path.startsWith("http://") || path.startsWith("https://")) return path
        return baseUrl.trimEnd('/') + "/" + path.trimStart('/')
    }

    private companion object {
        const val TASK_SYNC_INTERVAL_MS = 10_000L
    }
}
