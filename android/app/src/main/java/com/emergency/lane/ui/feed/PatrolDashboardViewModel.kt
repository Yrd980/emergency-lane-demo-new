package com.emergency.lane.ui.feed

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.data.remote.EventListItem
import com.emergency.lane.data.remote.HpApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class PatrolDashboardState(
    val activeTaskCount: Int = 3,
    val todayCaseCount: Int = 42,
    val caseChangePercent: Int = 12,
    val incidents: List<IncidentItem> = demoIncidents,
    val loading: Boolean = false,
    val error: String? = null
)

data class IncidentItem(
    val eventId: String,
    val title: String,
    val location: String,
    val detectedAgo: String,
    val detectedTime: String,
    val riskLevel: String, // "critical" | "urgent" | "normal"
    val vehicleClass: String,
    val confidence: Double,
    val thumbnailUrl: String = ""
)

private val demoIncidents = listOf(
    IncidentItem(
        eventId = "EVT-2026-0507-001",
        title = "Lane Violation: Stopped Vehicle",
        location = "M25 Northbound / P11-04",
        detectedAgo = "2m ago",
        detectedTime = "14:32:05",
        riskLevel = "critical",
        vehicleClass = "car",
        confidence = 0.96
    ),
    IncidentItem(
        eventId = "EVT-2026-0507-002",
        title = "Foreign Object on Carriageway",
        location = "A1(M) South / KM 12.4",
        detectedAgo = "8m ago",
        detectedTime = "14:26:12",
        riskLevel = "urgent",
        vehicleClass = "truck",
        confidence = 0.89
    )
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
                    // No backend configured, use demo data
                    _uiState.value = PatrolDashboardState(loading = false)
                    return@launch
                }
                val client = HpApiClient(baseUrl)
                val result = client.getEvents(status = null, limit = 20)
                result.fold(
                    onSuccess = { response ->
                        val items = response.items.map { api ->
                            IncidentItem(
                                eventId = api.eventId,
                                title = "${api.vehicleClass.replaceFirstChar { it.uppercase() }} Detection",
                                location = "Device: ${api.deviceId}",
                                detectedAgo = "${api.durationSeconds.toInt()}s ago",
                                detectedTime = api.startTime.takeLast(8),
                                riskLevel = api.riskLevel ?: "normal",
                                vehicleClass = api.vehicleClass,
                                confidence = api.confidence
                            )
                        }
                        val highRiskCount = items.count { it.riskLevel == "critical" }
                        _uiState.value = PatrolDashboardState(
                            activeTaskCount = highRiskCount.coerceAtLeast(response.items.size),
                            todayCaseCount = response.total,
                            incidents = items.ifEmpty { demoIncidents },
                            loading = false
                        )
                    },
                    onFailure = {
                        // Backend unreachable, use demo data
                        _uiState.value = PatrolDashboardState(loading = false)
                    }
                )
            } catch (_: Exception) {
                _uiState.value = PatrolDashboardState(loading = false)
            }
        }
    }
}
