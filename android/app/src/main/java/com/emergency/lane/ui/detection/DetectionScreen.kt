package com.emergency.lane.ui.detection

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.view.PreviewView
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
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
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
        // Camera preview
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

        // Controls
        Row(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(onClick = { viewModel.startPreview() }) { Text("开始预览") }
            Button(onClick = { viewModel.stopPreview() }) { Text("停止预览") }
            Button(onClick = { navController.navigate("calibration") }) { Text("ROI 标定") }
        }

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
        }
    }
}
