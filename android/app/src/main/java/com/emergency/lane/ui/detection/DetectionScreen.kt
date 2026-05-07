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
import androidx.compose.material3.TextButton
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
import com.emergency.lane.ui.theme.AegisSurfaceContainer
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
            viewModel.onCameraError("Camera permission denied. Enable in system settings.")
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
                    Text("Camera Permission Required", fontSize = 20.sp, color = AegisOnSurface)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(uiState.cameraError!!, color = AegisOnSurfaceVariant, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) }) {
                            Text("Grant")
                        }
                        Button(onClick = {
                            context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                data = Uri.parse("package:${context.packageName}")
                            })
                        }) {
                            Text("Open Settings")
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
                        Text("ROI Not Configured", fontWeight = FontWeight.SemiBold, color = AegisOnSurface)
                        Text("Auto detection requires ROI calibration", fontSize = 14.sp, color = AegisOnSurfaceVariant)
                    }
                    Button(
                        onClick = { navController.navigate("calibration") },
                        colors = ButtonDefaults.buttonColors(containerColor = AegisPrimary, contentColor = AegisOnPrimary)
                    ) { Text("Calibrate") }
                }
            }
        } else if (!uiState.roiConfigured) {
            Text("Complete ROI calibration first", color = AegisError, modifier = Modifier.padding(horizontal = 8.dp))
        }
        if (!uiState.hpConfigured) {
            Text("Configure HP address first", color = AegisError, modifier = Modifier.padding(horizontal = 8.dp))
        }

        // Model status
        when (val status = uiState.modelStatus) {
            is ModelLoadStatus.NotLoaded -> {}
            is ModelLoadStatus.Loading ->
                Text("Loading model...", modifier = Modifier.padding(horizontal = 8.dp), color = AegisOnSurfaceVariant)
            is ModelLoadStatus.Ready -> {
                val fpsText = if (uiState.fps > 0) " | FPS: ${"%.1f".format(uiState.fps)}" else ""
                val infText = if (uiState.inferenceMs > 0) " | Inference: ${uiState.inferenceMs}ms" else ""
                Text(
                    "Model: ${status.version}$fpsText$infText",
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
                        Text("Model Load Failed", fontWeight = FontWeight.SemiBold, color = AegisError)
                        Text(status.error, fontSize = 14.sp, color = AegisOnSurfaceVariant)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Manual event reporting remains available.", fontSize = 14.sp, color = AegisOnSurfaceVariant)
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
                    viewModel.leaveScreen()
                    navController.navigate("feed") {
                        popUpTo("feed") { inclusive = false }
                        launchSingleTop = true
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = AegisSurfaceContainerHigh, contentColor = AegisOnSurface),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) { Text("Back", fontSize = 12.sp) }
            Button(
                onClick = { viewModel.startDetectionFlow() },
                enabled = uiState.roiConfigured && uiState.hpConfigured,
                colors = ButtonDefaults.buttonColors(containerColor = AegisPrimary, contentColor = AegisOnPrimary),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1.4f)
            ) { Text(if (uiState.isDetecting) "Detecting" else "Start Detection", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.generateManualEvent() },
                enabled = uiState.canGenerateEvent && uiState.isPreviewActive,
                colors = ButtonDefaults.buttonColors(containerColor = AegisSurfaceContainerHigh, contentColor = AegisOnSurface),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) { Text("Manual Upload", fontSize = 12.sp) }
            Button(
                onClick = { viewModel.stopDetection(); viewModel.stopPreview() },
                enabled = uiState.isPreviewActive || uiState.isDetecting,
                colors = ButtonDefaults.buttonColors(containerColor = AegisSurfaceContainerHigh, contentColor = AegisOnSurface),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) { Text("Stop Camera", fontSize = 12.sp) }
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            TextButton(onClick = { navController.navigate("calibration") }, modifier = Modifier.weight(1f)) {
                Text("Calibrate ROI", color = AegisPrimary, fontSize = 12.sp)
            }
            TextButton(onClick = { navController.navigate("account") }, modifier = Modifier.weight(1f)) {
                Text("Settings", color = AegisPrimary, fontSize = 12.sp)
            }
            TextButton(onClick = { navController.navigate("alerts") }, modifier = Modifier.weight(1f)) {
                Text("Queue", color = AegisPrimary, fontSize = 12.sp)
            }
        }

        // Status bar
        Row(modifier = Modifier.padding(8.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            if (uiState.lastEventId != null) {
                Text("Last: ${uiState.lastEventId}", color = AegisOnSurfaceVariant, fontSize = 12.sp)
            }
            if (uiState.pendingUploadCount > 0) {
                Text("Pending: ${uiState.pendingUploadCount}", color = AegisOnSurfaceVariant, fontSize = 12.sp)
            }
            if (uiState.isDetecting) {
                Text("Detecting...", color = AegisPrimary, fontSize = 12.sp)
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
            Text("Detection", color = AegisOnSurface, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            Text(
                text = when {
                    !uiState.hpConfigured -> "Set backend URL first, then return here."
                    !uiState.roiConfigured -> "Calibrate ROI first. Events are created only when a vehicle stays inside ROI long enough."
                    uiState.isDetecting -> "Camera is running. Vehicle boxes are tracked and uploaded after the ROI dwell rule is met."
                    uiState.modelStatus is ModelLoadStatus.Ready -> "Model is loaded. Start detection or create one manual upload."
                    else -> "Start Detection opens the camera and loads the local vehicle model."
                },
                color = AegisOnSurfaceVariant,
                fontSize = 12.sp
            )
            Text(
                "Rule: vehicle confidence >= 0.5, inside ROI for 10s, then before/peak/after images are queued. Manual upload also needs the camera running.",
                color = AegisOnSurfaceVariant,
                fontSize = 12.sp
            )
        }
    }
}
