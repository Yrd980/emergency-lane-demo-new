package com.emergency.lane.ui.feed

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.data.remote.HpApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class PatrolDashboardState(
    val activeTaskCount: Int = 0,
    val todayCaseCount: Int = 0,
    val caseChangePercent: Int = 0,
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
    val riskLevel: String, // "critical" | "urgent" | "normal"
    val vehicleClass: String,
    val confidence: Double,
    val thumbnailUrl: String = ""
)

class PatrolDashboardViewModel(application: Application) : AndroidViewModel(application) {
    private val _uiState = MutableStateFlow(PatrolDashboardState())
    val uiState: StateFlow<PatrolDashboardState> = _uiState

    private val settingsStore = SettingsStore(application)

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            try {
                val baseUrl = settingsStore.baseUrl.first()
                if (baseUrl.isBlank()) {
                    _uiState.value = PatrolDashboardState(
                        loading = false,
                        error = "Configure the HP backend address before loading tasks.",
                        needsConfiguration = true
                    )
                    return@launch
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
                        return@launch
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
                                title = "${api.vehicleClass.replaceFirstChar { it.uppercase() }} Patrol Task",
                                location = "Device: ${api.deviceId}",
                                detectedAgo = api.status,
                                detectedTime = api.startTime.takeLast(8),
                                riskLevel = api.riskLevel,
                                vehicleClass = api.vehicleClass,
                                confidence = api.confidence,
                                thumbnailUrl = absoluteUrl(baseUrl, api.thumbnailUrl)
                            )
                        }
                        val activeCount = items.count { it.status != "completed" }
                        _uiState.value = PatrolDashboardState(
                            activeTaskCount = activeCount,
                            todayCaseCount = response.total,
                            incidents = items,
                            loading = false,
                            username = username,
                            backendUrl = baseUrl
                        )
                    },
                    onFailure = {
                        _uiState.value = PatrolDashboardState(
                            loading = false,
                            error = it.message,
                            username = username,
                            backendUrl = baseUrl
                        )
                    }
                )
            } catch (e: Exception) {
                _uiState.value = PatrolDashboardState(loading = false, error = e.message)
            }
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
}
