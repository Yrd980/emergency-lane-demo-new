package com.emergency.lane.ui.calibration

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.local.RoiStore
import com.emergency.lane.domain.RoiConfig
import com.emergency.lane.domain.RoiPoint
import com.emergency.lane.domain.isValid
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class CalibrationUiState(
    val points: List<RoiPoint> = emptyList(),
    val isSaved: Boolean = false,
    val message: String? = null
)

class CalibrationViewModel(application: Application) : AndroidViewModel(application) {
    private val roiStore = RoiStore(application)
    private val _uiState = MutableStateFlow(CalibrationUiState())
    val uiState: StateFlow<CalibrationUiState> = _uiState

    init {
        viewModelScope.launch {
            roiStore.roiConfig.collect { config ->
                if (config != null && config.points.isNotEmpty()) {
                    _uiState.value = _uiState.value.copy(points = config.points, isSaved = true)
                }
            }
        }
    }

    fun addPoint(x: Float, y: Float) {
        _uiState.value = _uiState.value.copy(
            points = _uiState.value.points + RoiPoint(x, y),
            isSaved = false,
            message = null
        )
    }

    fun undoLastPoint() {
        val pts = _uiState.value.points
        if (pts.isNotEmpty()) {
            _uiState.value = _uiState.value.copy(
                points = pts.dropLast(1),
                isSaved = false
            )
        }
    }

    fun clearAll() {
        _uiState.value = _uiState.value.copy(points = emptyList(), isSaved = false)
    }

    fun save() {
        val config = RoiConfig(
            points = _uiState.value.points,
            updatedAt = java.time.Instant.now().toString()
        )
        viewModelScope.launch {
            if (config.isValid()) {
                roiStore.save(config)
                _uiState.value = _uiState.value.copy(isSaved = true, message = "ROI 已保存 (${config.points.size} 点)")
            } else {
                _uiState.value = _uiState.value.copy(message = "至少需要 4 个点才能保存")
            }
        }
    }

    fun resetRoi() {
        viewModelScope.launch {
            roiStore.clear()
            _uiState.value = CalibrationUiState()
        }
    }
}
