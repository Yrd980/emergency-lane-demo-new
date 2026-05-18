package com.emergency.lane.ui.detection

import android.Manifest
import android.content.Intent
import android.graphics.Paint
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.emergency.lane.camera.CameraController
import com.emergency.lane.ui.theme.AegisBackground
import com.emergency.lane.ui.theme.AegisError
import com.emergency.lane.ui.theme.AegisErrorContainer
import com.emergency.lane.ui.theme.AegisOnPrimary
import com.emergency.lane.ui.theme.AegisOnSurface
import com.emergency.lane.ui.theme.AegisOnSurfaceVariant
import com.emergency.lane.ui.theme.AegisOutlineVariant
import com.emergency.lane.ui.theme.AegisPrimary
import com.emergency.lane.ui.theme.AegisSecondaryContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainerHigh
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow

@Composable
fun DetectionScreen(navController: NavController, viewModel: DetectionViewModel = viewModel()) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uiState by viewModel.uiState.collectAsState()

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) {
            viewModel.onCameraError("相机权限被拒绝，请在系统设置中开启。")
        }
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    DisposableEffect(Unit) {
        onDispose {
            viewModel.leaveScreen()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisBackground)
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
    ) {
        // Camera preview with detection overlay
        Box(modifier = Modifier.fillMaxWidth().height(300.dp)) {
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
                    val scaleX = if (uiState.frameWidth > 0) {
                        size.width / uiState.frameWidth.toFloat()
                    } else 1f
                    val scaleY = if (uiState.frameHeight > 0) {
                        size.height / uiState.frameHeight.toFloat()
                    } else 1f
                    val paint = Paint().apply {
                        color = android.graphics.Color.RED
                        textSize = 36f
                        isAntiAlias = true
                    }

                    for (det in uiState.detections) {
                        val x = det.x * scaleX
                        val y = det.y * scaleY
                        val width = det.width * scaleX
                        val height = det.height * scaleY
                        drawRect(
                            color = Color.Red,
                            topLeft = Offset(x, y),
                            size = Size(width, height),
                            style = Stroke(width = 3f)
                        )
                        val label = "${det.className} ${
                            String.format("%.2f", det.confidence)
                        }"
                        drawContext.canvas.nativeCanvas.drawText(
                            label, x, (y - 4f).coerceAtLeast(0f), paint
                        )
                    }

                    for (track in uiState.tracks) {
                        val box = track.lastBox
                        val x = box.x * scaleX
                        val y = box.y * scaleY
                        val height = box.height * scaleY
                        val paintTrack = Paint().apply {
                            color = if (track.insideRoi) android.graphics.Color.GREEN
                            else android.graphics.Color.YELLOW
                            textSize = 28f
                            isAntiAlias = true
                        }
                        drawContext.canvas.nativeCanvas.drawText(
                            "${track.trackId}", x, (y + height + 20f), paintTrack
                        )
                    }
                }
            } else if (uiState.cameraError != null) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("需要相机权限", fontSize = 20.sp, color = AegisOnSurface)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(uiState.cameraError!!, color = AegisOnSurfaceVariant, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) }) {
                            Text("授权")
                        }
                        Button(onClick = {
                            context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                data = Uri.parse("package:${context.packageName}")
                            })
                        }) {
                            Text("打开设置")
                        }
                    }
                }
            }
        }

        // Prerequisites
        if (!uiState.roiConfigured && uiState.modelStatus is ModelLoadStatus.Ready) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(AegisSecondaryContainer.copy(alpha = 0.15f))
                    .padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("⚠", fontSize = 20.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("未配置 ROI", fontWeight = FontWeight.SemiBold, color = AegisOnSurface)
                        Text("自动检测需要先完成 ROI 标定", fontSize = 14.sp, color = AegisOnSurfaceVariant)
                    }
                }
            }
        } else if (!uiState.roiConfigured) {
            Text("请先完成 ROI 标定", color = AegisError, modifier = Modifier.padding(horizontal = 8.dp))
        }
        if (!uiState.hpConfigured) {
            Text("请先配置 HP 后端地址", color = AegisError, modifier = Modifier.padding(horizontal = 8.dp))
        }

        // Model status
        when (val status = uiState.modelStatus) {
            is ModelLoadStatus.NotLoaded -> {}
            is ModelLoadStatus.Loading ->
                Text("模型加载中...", modifier = Modifier.padding(horizontal = 8.dp), color = AegisOnSurfaceVariant)
            is ModelLoadStatus.Ready -> {
                val fpsText = if (uiState.fps > 0) " | 帧率：${"%.1f".format(uiState.fps)}" else ""
                val infText = if (uiState.inferenceMs > 0) " | 推理：${uiState.inferenceMs}ms" else ""
                Text(
                    "模型：${status.version}$fpsText$infText",
                    color = AegisPrimary,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
            }
            is ModelLoadStatus.Failed ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(AegisErrorContainer.copy(alpha = 0.2f))
                        .padding(12.dp)
                ) {
                    Column {
                        Text("模型加载失败", fontWeight = FontWeight.SemiBold, color = AegisError)
                        Text(status.error, fontSize = 14.sp, color = AegisOnSurfaceVariant)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("仍可使用手动事件上报。", fontSize = 14.sp, color = AegisOnSurfaceVariant)
                    }
                }
        }

        DetectionGuide(uiState = uiState)

        // Main controls
        Row(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = {
                    if (uiState.isPreviewActive || uiState.isDetecting) {
                        viewModel.stopDetection()
                        viewModel.stopPreview()
                    } else {
                        viewModel.startDetectionFlow()
                    }
                },
                enabled = uiState.roiConfigured && uiState.hpConfigured,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (uiState.isPreviewActive || uiState.isDetecting) {
                        AegisSurfaceContainerHigh
                    } else {
                        AegisPrimary
                    },
                    contentColor = if (uiState.isPreviewActive || uiState.isDetecting) {
                        AegisOnSurface
                    } else {
                        AegisOnPrimary
                    }
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1.2f)
            ) {
                Text(
                    if (uiState.isPreviewActive || uiState.isDetecting) "停止相机" else "开始检测",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Button(
                onClick = { viewModel.generateManualEvent() },
                enabled = uiState.canGenerateEvent && uiState.isPreviewActive,
                colors = ButtonDefaults.buttonColors(containerColor = AegisSurfaceContainerHigh, contentColor = AegisOnSurface),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) { Text("手动上传", fontSize = 12.sp) }
        }

        if (!uiState.roiConfigured || !uiState.hpConfigured) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { navController.navigate("account") },
                    colors = ButtonDefaults.buttonColors(containerColor = AegisSurfaceContainerHigh, contentColor = AegisOnSurface),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f)
                ) { Text("打开账号", fontSize = 12.sp) }
            }
        }

        // Status bar
        Row(modifier = Modifier.padding(8.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            if (uiState.lastEventId != null) {
                Text("最近：${uiState.lastEventId}", color = AegisOnSurfaceVariant, fontSize = 12.sp)
            }
            if (uiState.pendingUploadCount > 0) {
                Text("待上传：${uiState.pendingUploadCount}", color = AegisOnSurfaceVariant, fontSize = 12.sp)
            }
            if (uiState.isDetecting) {
                Text("检测中...", color = AegisPrimary, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun DetectionGuide(uiState: DetectionUiState) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(AegisSurfaceContainerLow)
            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("检测", color = AegisOnSurface, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            Text(
                text = when {
                    !uiState.hpConfigured -> "请先设置后端地址，再返回此处。"
                    !uiState.roiConfigured -> "开始相机检测前，请先在账号页设置检测区域。"
                    uiState.isDetecting -> "相机正在运行。车辆框会被持续跟踪，满足 ROI 停留规则后上传。"
                    uiState.modelStatus is ModelLoadStatus.Ready -> "模型已加载。可开始检测，或创建一次手动上传。"
                    else -> "开始检测会打开相机并加载本地车辆模型。"
                },
                color = AegisOnSurfaceVariant,
                fontSize = 12.sp
            )
            Text(
                "规则：车辆置信度 >= 0.5，并在 ROI 内停留 10 秒后，进入前、峰值、离开后图片会进入队列。手动上传同样需要相机运行。",
                color = AegisOnSurfaceVariant,
                fontSize = 12.sp
            )
        }
    }
}
