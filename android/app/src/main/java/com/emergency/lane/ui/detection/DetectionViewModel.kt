package com.emergency.lane.ui.detection

import android.app.Application
import android.graphics.Bitmap
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.camera.CameraController
import com.emergency.lane.camera.CoordinateMapper
import com.emergency.lane.camera.SuspectedIncidentStateMachine
import com.emergency.lane.camera.InferenceEngine
import com.emergency.lane.camera.InferenceScheduler
import com.emergency.lane.camera.ModelLoadResult
import com.emergency.lane.camera.ModelLoader
import com.emergency.lane.camera.NmsProcessor
import com.emergency.lane.camera.Tracker
import com.emergency.lane.data.local.EvidenceFileEntity
import com.emergency.lane.data.local.SuspectedIncidentQueueRepository
import com.emergency.lane.data.local.LocalSuspectedIncidentEntity
import com.emergency.lane.data.local.RoiStore
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.data.remote.UploadWorker
import com.emergency.lane.domain.DetectionBox
import com.emergency.lane.domain.SuspectedIncidentFactory
import com.emergency.lane.domain.GeometryUtils
import com.emergency.lane.domain.RoiConfig
import com.emergency.lane.domain.RuntimeMetrics
import com.emergency.lane.domain.Track
import com.emergency.lane.domain.UploadState
import com.emergency.lane.domain.isValid
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.time.Instant

sealed class ModelLoadStatus {
    object NotLoaded : ModelLoadStatus()
    object Loading : ModelLoadStatus()
    data class Ready(val version: String) : ModelLoadStatus()
    data class Failed(val error: String) : ModelLoadStatus()
}

data class DetectionUiState(
    val isPreviewActive: Boolean = false,
    val lastSuspectedIncidentId: String? = null,
    val pendingUploadCount: Int = 0,
    val cameraError: String? = null,
    val canGenerateSuspectedIncident: Boolean = false,
    val roiConfigured: Boolean = false,
    val hpConfigured: Boolean = false,
    // Model detection
    val modelStatus: ModelLoadStatus = ModelLoadStatus.NotLoaded,
    val isDetecting: Boolean = false,
    val detections: List<DetectionBox> = emptyList(),
    val tracks: List<Track> = emptyList(),
    val frameWidth: Int = 0,
    val frameHeight: Int = 0,
    val fps: Float = 0f,
    val inferenceMs: Long = 0,
    val avgInferenceMs: Long = 0,
    val inferenceError: String? = null
)

class DetectionViewModel(application: Application) : AndroidViewModel(application) {
    private val _uiState = MutableStateFlow(DetectionUiState())
    val uiState: StateFlow<DetectionUiState> = _uiState

    private val settingsStore = SettingsStore(application)
    private val roiStore = RoiStore(application)
    private val suspectedIncidentQueue = SuspectedIncidentQueueRepository(application)

    var cameraController: CameraController? = null

    // Detection pipeline
    private var modelLoader: ModelLoader? = null
    private var inferenceEngine: InferenceEngine? = null
    private var tracker: Tracker? = null
    private var stateMachine: SuspectedIncidentStateMachine? = null
    private var scheduler: InferenceScheduler? = null
    private var frameCounter = 0L

    // Performance tracking
    private val recentInferenceMs = ArrayDeque<Long>(20)
    private val recentFrames = ArrayDeque<Bitmap>(6)

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
                    canGenerateSuspectedIncident = hasUrl && hasRoi
                )
            }
        }
    }

    fun startPreview() { _uiState.value = _uiState.value.copy(isPreviewActive = true) }
    fun stopPreview() {
        _uiState.value = _uiState.value.copy(isPreviewActive = false, isDetecting = false)
        cameraController?.release()
        cameraController = null
    }

    fun onCameraError(msg: String) {
        _uiState.value = _uiState.value.copy(cameraError = msg)
    }
    fun clearCameraError() { _uiState.value = _uiState.value.copy(cameraError = null) }

    // -- Model detection --

    fun initDetection() {
        if (_uiState.value.modelStatus is ModelLoadStatus.Loading) return
        _uiState.value = _uiState.value.copy(modelStatus = ModelLoadStatus.Loading)

        val loader = ModelLoader(getApplication())
        modelLoader = loader
        when (val result = loader.load()) {
            is ModelLoadResult.Loaded -> {
                inferenceEngine = InferenceEngine(result.interpreter, result.info)
                tracker = Tracker()
                stateMachine = SuspectedIncidentStateMachine()
                scheduler = InferenceScheduler(15)
                _uiState.value = _uiState.value.copy(
                    modelStatus = ModelLoadStatus.Ready(result.info.version)
                )
            }
            is ModelLoadResult.Failed -> {
                _uiState.value = _uiState.value.copy(
                    modelStatus = ModelLoadStatus.Failed(result.error)
                )
            }
        }
    }

    fun startDetectionFlow() {
        if (!_uiState.value.isPreviewActive) startPreview()
        if (_uiState.value.modelStatus !is ModelLoadStatus.Ready) {
            initDetection()
        }
        if (_uiState.value.modelStatus is ModelLoadStatus.Ready) {
            startDetection()
        }
    }

    fun startDetection() {
        if (_uiState.value.modelStatus !is ModelLoadStatus.Ready) return
        if (_uiState.value.isDetecting) return
        _uiState.value = _uiState.value.copy(isDetecting = true)

        viewModelScope.launch(Dispatchers.Default) {
            while (isActive && _uiState.value.isDetecting) {
                val nowMs = System.currentTimeMillis()
                val sched = scheduler
                if (sched == null || !sched.shouldRunInference(nowMs)) {
                    delay(10)
                    continue
                }

                try {
                    val bitmap = cameraController?.captureFrame()
                    if (bitmap == null) {
                        delay(50)
                        continue
                    }
                    processFrame(bitmap)
                    sched.markInferenceDone(System.currentTimeMillis())
                } catch (_: Exception) {
                    delay(100)
                }
            }
        }
    }

    fun stopDetection() {
        _uiState.value = _uiState.value.copy(isDetecting = false)
    }

    fun leaveScreen() {
        stopDetection()
        stopPreview()
    }

    private suspend fun processFrame(bitmap: Bitmap) {
        val engine = inferenceEngine ?: return
        val tkr = tracker ?: return
        val sm = stateMachine ?: return

        try {
            rememberFrame(bitmap)
            val (rawOutput, inferenceMs) = engine.runInference(bitmap)
            val boxes = NmsProcessor.parseYoloOutput(
                rawOutput, engine.modelInfo.outputShape
            )
            val afterNms = CoordinateMapper.mapStretchedInputToFrame(
                NmsProcessor.nms(boxes),
                originalWidth = bitmap.width,
                originalHeight = bitmap.height,
                modelWidth = engine.modelInfo.inputWidth,
                modelHeight = engine.modelInfo.inputHeight
            )

            val nowMs = System.currentTimeMillis()
            val tracks = tkr.update(afterNms, nowMs)

            // Update ROI state for each track
            val roiConfig = roiStore.roiConfig.first()
            for (track in tracks) {
                val insideRoi = if (roiConfig != null && roiConfig.isValid()) {
                    val bottomCenter = GeometryUtils.bboxBottomCenter(track.lastBox)
                    GeometryUtils.isPointInPolygon(bottomCenter, roiConfig.points)
                } else false

                val result = sm.update(track, insideRoi, nowMs)
                tkr.updateRoiState(
                    track.trackId, insideRoi, result.roiEnterMs,
                    result.durationMs, result.shouldCreateSuspectedIncident
                )

                if (result.shouldCreateSuspectedIncident) {
                    createAutoSuspectedIncident(track, result)
                }
            }

            // Performance metrics
            recentInferenceMs.addLast(inferenceMs)
            if (recentInferenceMs.size > 20) recentInferenceMs.removeFirst()
            val avgMs = if (recentInferenceMs.isNotEmpty())
                recentInferenceMs.average().toLong() else 0L
            scheduler?.updateTargetFps(maybeDegradeFps(avgMs))

            _uiState.value = _uiState.value.copy(
                detections = afterNms,
                tracks = tkr.getAllTracks(),
                frameWidth = bitmap.width,
                frameHeight = bitmap.height,
                fps = if (avgMs > 0) 1000f / avgMs else 0f,
                inferenceMs = inferenceMs,
                avgInferenceMs = avgMs,
                inferenceError = null
            )
            RuntimeMetrics.fps = _uiState.value.fps
            RuntimeMetrics.avgInferenceMs = avgMs
            frameCounter++
        } catch (e: Exception) {
            _uiState.value = _uiState.value.copy(inferenceError = e.message)
        }
    }

    private suspend fun createAutoSuspectedIncident(track: Track, result: SuspectedIncidentStateMachine.UpdateResult) {
        val deviceId = settingsStore.deviceId.first()
        val roiConfig = roiStore.roiConfig.first()

        val suspectedIncidentId = SuspectedIncidentFactory.createAutoSuspectedIncidentId()
        val now = Instant.now()

        val suspectedIncident = LocalSuspectedIncidentEntity(
            suspectedIncidentId = suspectedIncidentId,
            deviceId = deviceId,
            startTime = Instant.ofEpochMilli(result.roiEnterMs!!).toString(),
            endTime = now.toString(),
            durationSeconds = result.durationMs / 1000.0,
            roiId = roiConfig?.roiId ?: "roi_default",
            trackId = track.trackId,
            vehicleClass = track.className,
            vehicleBoxJson = "{\"x\":${track.lastBox.x},\"y\":${track.lastBox.y},\"width\":${track.lastBox.width},\"height\":${track.lastBox.height}}",
            confidence = track.confidence.toDouble(),
            gpsJson = "null",
            uploadState = UploadState.QUEUED.name,
            createdAt = now.toString()
        )

        val evidenceFiles = mutableListOf<EvidenceFileEntity>()
        try {
            recentFrames.firstOrNull()?.let { before ->
                val path = saveBitmapToCache(before, "${suspectedIncidentId}_frame_before.jpg")
                evidenceFiles.add(evidenceFile(suspectedIncidentId, "frame_before", path))
            }
            val bitmap = cameraController?.captureFrame()
            if (bitmap != null) {
                val peakPath = saveBitmapToCache(bitmap, "${suspectedIncidentId}_frame_peak.jpg")
                evidenceFiles.add(evidenceFile(suspectedIncidentId, "frame_peak", peakPath))
            }
            delay(250)
            val after = cameraController?.captureFrame()
            if (after != null) {
                val afterPath = saveBitmapToCache(after, "${suspectedIncidentId}_frame_after.jpg")
                evidenceFiles.add(evidenceFile(suspectedIncidentId, "frame_after", afterPath))
            }
        } catch (_: Exception) {}

        if (evidenceFiles.none { it.evidenceType == "frame_peak" }) {
            evidenceFiles.add(evidenceFile(suspectedIncidentId, "frame_peak", ""))
        }

        suspectedIncidentQueue.enqueueSuspectedIncident(suspectedIncident, evidenceFiles)
        UploadWorker.enqueue(getApplication())

        _uiState.value = _uiState.value.copy(
            lastSuspectedIncidentId = suspectedIncidentId,
            pendingUploadCount = suspectedIncidentQueue.getPendingCount()
        )
    }

    fun maybeDegradeFps(avgMs: Long = _uiState.value.avgInferenceMs): Int {
        return when {
            avgMs > 150 -> 3
            avgMs > 80  -> 5
            avgMs > 50  -> 10
            else -> 15
        }
    }

    // -- Manual suspectedIncident --

    fun generateManualSuspectedIncident() {
        if (!_uiState.value.canGenerateSuspectedIncident) return
        viewModelScope.launch {
            val deviceId = settingsStore.deviceId.first()
            val (suspectedIncident, evidence) = SuspectedIncidentFactory.createManualSuspectedIncident(deviceId)

            val evidenceFiles = mutableListOf<EvidenceFileEntity>()
            try {
                recentFrames.firstOrNull()?.let { before ->
                    val path = saveBitmapToCache(before, "${suspectedIncident.suspectedIncidentId}_frame_before.jpg")
                    evidenceFiles.add(evidenceFile(suspectedIncident.suspectedIncidentId, "frame_before", path))
                }
                val bitmap = cameraController?.captureFrame()
                if (bitmap != null) {
                    val path = saveBitmapToCache(bitmap, "${suspectedIncident.suspectedIncidentId}_frame_peak.jpg")
                    evidenceFiles.add(evidence.copy(localPath = path))
                } else {
                    evidenceFiles.add(evidence)
                }
                delay(250)
                val after = cameraController?.captureFrame()
                if (after != null) {
                    val path = saveBitmapToCache(after, "${suspectedIncident.suspectedIncidentId}_frame_after.jpg")
                    evidenceFiles.add(evidenceFile(suspectedIncident.suspectedIncidentId, "frame_after", path))
                }
            } catch (_: Exception) {}

            if (evidenceFiles.isEmpty()) {
                evidenceFiles.add(evidence)
            }

            suspectedIncidentQueue.enqueueSuspectedIncident(suspectedIncident, evidenceFiles)
            _uiState.value = _uiState.value.copy(
                lastSuspectedIncidentId = suspectedIncident.suspectedIncidentId,
                pendingUploadCount = suspectedIncidentQueue.getPendingCount()
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

    private fun rememberFrame(bitmap: Bitmap) {
        recentFrames.addLast(bitmap.copy(Bitmap.Config.ARGB_8888, false))
        while (recentFrames.size > 6) {
            recentFrames.removeFirst().recycle()
        }
    }

    private fun evidenceFile(suspectedIncidentId: String, evidenceType: String, localPath: String): EvidenceFileEntity {
        return EvidenceFileEntity(
            suspectedIncidentId = suspectedIncidentId,
            evidenceType = evidenceType,
            localPath = localPath,
            mimeType = "image/jpeg"
        )
    }

    override fun onCleared() {
        super.onCleared()
        leaveScreen()
        while (recentFrames.isNotEmpty()) {
            recentFrames.removeFirst().recycle()
        }
        inferenceEngine?.close()
    }
}
