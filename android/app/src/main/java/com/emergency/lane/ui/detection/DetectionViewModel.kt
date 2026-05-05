package com.emergency.lane.ui.detection

import androidx.lifecycle.ViewModel
import com.emergency.lane.camera.CameraController
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class DetectionUiState(
    val isPreviewActive: Boolean = false,
    val lastEventId: String? = null,
    val pendingUploadCount: Int = 0,
    val cameraError: String? = null
)

class DetectionViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(DetectionUiState())
    val uiState: StateFlow<DetectionUiState> = _uiState

    var cameraController: CameraController? = null

    fun startPreview() { _uiState.value = _uiState.value.copy(isPreviewActive = true) }
    fun stopPreview() { _uiState.value = _uiState.value.copy(isPreviewActive = false) }

    fun onCameraError(msg: String) {
        _uiState.value = _uiState.value.copy(cameraError = msg)
    }
    fun clearCameraError() { _uiState.value = _uiState.value.copy(cameraError = null) }
}
