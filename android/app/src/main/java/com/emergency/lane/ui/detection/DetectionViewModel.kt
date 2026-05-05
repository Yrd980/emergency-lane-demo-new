package com.emergency.lane.ui.detection

import android.app.Application
import android.graphics.Bitmap
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.camera.CameraController
import com.emergency.lane.data.local.EventQueueRepository
import com.emergency.lane.data.local.RoiStore
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.data.remote.UploadWorker
import com.emergency.lane.domain.EventFactory
import com.emergency.lane.domain.isValid
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream

data class DetectionUiState(
    val isPreviewActive: Boolean = false,
    val lastEventId: String? = null,
    val pendingUploadCount: Int = 0,
    val cameraError: String? = null,
    val canGenerateEvent: Boolean = false,
    val roiConfigured: Boolean = false,
    val hpConfigured: Boolean = false
)

class DetectionViewModel(application: Application) : AndroidViewModel(application) {
    private val _uiState = MutableStateFlow(DetectionUiState())
    val uiState: StateFlow<DetectionUiState> = _uiState

    private val settingsStore = SettingsStore(application)
    private val roiStore = RoiStore(application)
    private val eventQueue = EventQueueRepository(application)

    var cameraController: CameraController? = null

    init {
        viewModelScope.launch {
            combine(
                settingsStore.baseUrl,
                roiStore.roiConfig
            ) { url, roi ->
                url.isNotBlank() to (roi != null && roi.isValid())
            }.collect { (hasUrl, hasRoi) ->
                _uiState.value = _uiState.value.copy(
                    hpConfigured = hasUrl,
                    roiConfigured = hasRoi,
                    canGenerateEvent = hasUrl && hasRoi
                )
            }
        }
    }

    fun startPreview() { _uiState.value = _uiState.value.copy(isPreviewActive = true) }
    fun stopPreview() { _uiState.value = _uiState.value.copy(isPreviewActive = false) }

    fun onCameraError(msg: String) {
        _uiState.value = _uiState.value.copy(cameraError = msg)
    }
    fun clearCameraError() { _uiState.value = _uiState.value.copy(cameraError = null) }

    fun generateManualEvent() {
        if (!_uiState.value.canGenerateEvent) return
        viewModelScope.launch {
            val deviceId = settingsStore.deviceId.first()
            val (event, evidence) = EventFactory.createManualEvent(deviceId)

            var evidenceWithPath = evidence
            try {
                val bitmap = cameraController?.captureFrame()
                if (bitmap != null) {
                    val path = saveBitmapToCache(bitmap, "${event.eventId}_frame_peak.jpg")
                    evidenceWithPath = evidence.copy(localPath = path)
                }
            } catch (_: Exception) {}

            eventQueue.enqueueEvent(event, listOf(evidenceWithPath))
            _uiState.value = _uiState.value.copy(
                lastEventId = event.eventId,
                pendingUploadCount = eventQueue.getPendingCount()
            )

            UploadWorker.enqueue(getApplication())
        }
    }

    private fun saveBitmapToCache(bitmap: Bitmap, filename: String): String {
        val dir = getApplication<Application>().cacheDir
        val file = File(dir, filename)
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
        }
        return file.absolutePath
    }
}
