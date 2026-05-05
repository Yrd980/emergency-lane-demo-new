package com.emergency.lane.ui.detection

import android.Manifest
import android.graphics.Paint
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.emergency.lane.camera.CameraController

@Composable
fun DetectionScreen(navController: NavController, viewModel: DetectionViewModel = viewModel()) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uiState by viewModel.uiState.collectAsState()

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) {
            viewModel.onCameraError("相机权限未授权，请在系统设置中开启")
        }
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Camera preview with detection overlay
        Box(modifier = Modifier.weight(1f)) {
            if (uiState.isPreviewActive) {
                AndroidView(
                    factory = { ctx ->
                        PreviewView(ctx).also { previewView ->
                            val controller = CameraController(context, lifecycleOwner)
                            controller.startCamera(previewView)
                            viewModel.cameraController = controller
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )

                // Detection overlay
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val paint = Paint().apply {
                        color = android.graphics.Color.RED
                        textSize = 36f
                        isAntiAlias = true
                    }

                    for (det in uiState.detections) {
                        // Bounding box
                        drawRect(
                            color = Color.Red,
                            topLeft = Offset(det.x, det.y),
                            size = Size(det.width, det.height),
                            style = Stroke(width = 3f)
                        )
                        // Label
                        val label = "${det.className} ${
                            String.format("%.2f", det.confidence)
                        }"
                        drawContext.canvas.nativeCanvas.drawText(
                            label,
                            det.x,
                            (det.y - 4f).coerceAtLeast(0f),
                            paint
                        )
                    }

                    // Draw track IDs
                    for (track in uiState.tracks) {
                        val box = track.lastBox
                        val paintTrack = Paint().apply {
                            color = if (track.insideRoi) android.graphics.Color.GREEN
                            else android.graphics.Color.YELLOW
                            textSize = 28f
                            isAntiAlias = true
                        }
                        val label = "${track.trackId}"
                        drawContext.canvas.nativeCanvas.drawText(
                            label,
                            box.x,
                            (box.y + box.height + 20f),
                            paintTrack
                        )
                    }
                }
            } else if (uiState.cameraError != null) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(uiState.cameraError!!, color = MaterialTheme.colorScheme.error)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) }) {
                        Text("重新授权")
                    }
                }
            }
        }

        // Prerequisites
        if (!uiState.roiConfigured) {
            Text("请先完成 ROI 标定", color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(horizontal = 8.dp))
        }
        if (!uiState.hpConfigured) {
            Text("请先配置 HP 地址", color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(horizontal = 8.dp))
        }

        // Model status
        when (val status = uiState.modelStatus) {
            is ModelLoadStatus.NotLoaded -> {}
            is ModelLoadStatus.Loading ->
                Text("加载模型中...", modifier = Modifier.padding(horizontal = 8.dp))
            is ModelLoadStatus.Ready -> {
                val fpsText = if (uiState.fps > 0) " | FPS: ${"%.1f".format(uiState.fps)}" else ""
                val infText = if (uiState.inferenceMs > 0) " | 推理: ${uiState.inferenceMs}ms" else ""
                Text(
                    "模型: ${status.version}$fpsText$infText",
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
            }
            is ModelLoadStatus.Failed ->
                Text(
                    "模型加载失败: ${status.error} — 可使用手动模拟",
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
        }

        // Controls row 1: Preview + Detection
        Row(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(onClick = { viewModel.startPreview() }) { Text("开始预览") }
            Button(onClick = { viewModel.stopPreview() }) { Text("停止预览") }
            Button(onClick = { navController.navigate("calibration") }) { Text("ROI 标定") }
        }

        // Controls row 2: Detection start/stop + model init
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
            Button(onClick = { viewModel.initDetection() }) { Text("加载模型") }
            if (uiState.modelStatus is ModelLoadStatus.Ready) {
                if (uiState.isDetecting) {
                    Button(onClick = { viewModel.stopDetection() }) { Text("停止检测") }
                } else {
                    Button(onClick = { viewModel.startDetection() }) { Text("开始检测") }
                }
            }
        }

        // Controls row 3: Manual event + nav
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
            Button(
                onClick = { viewModel.generateManualEvent() },
                enabled = uiState.canGenerateEvent
            ) { Text("生成模拟事件") }
            Spacer(modifier = Modifier.weight(1f))
            Button(onClick = { navController.navigate("settings") }) { Text("设置") }
            Button(onClick = { navController.navigate("queue") }) { Text("队列") }
        }

        // Status bar
        Row(modifier = Modifier.padding(8.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            if (uiState.lastEventId != null) {
                Text("最近事件: ${uiState.lastEventId}")
            }
            if (uiState.pendingUploadCount > 0) {
                Text("待上传: ${uiState.pendingUploadCount}")
            }
            if (uiState.isDetecting) {
                Text("检测中...", color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}
