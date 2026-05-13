package com.emergency.lane.ui.queue

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.emergency.lane.data.local.EvidenceFileEntity
import com.emergency.lane.ui.theme.AegisBackground
import com.emergency.lane.ui.theme.AegisError
import com.emergency.lane.ui.theme.AegisOnPrimary
import com.emergency.lane.ui.theme.AegisOnSurface
import com.emergency.lane.ui.theme.AegisOnSurfaceVariant
import com.emergency.lane.ui.theme.AegisOutlineVariant
import com.emergency.lane.ui.theme.AegisPrimary
import com.emergency.lane.ui.theme.AegisSurfaceContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow
import com.emergency.lane.ui.theme.AegisErrorContainer
import com.emergency.lane.ui.theme.AegisPrimaryContainer

@Composable
fun QueueScreen(navController: NavController, viewModel: QueueViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val visibleStats = listOf(
        "queued" to (uiState.stats["queued"] ?: 0),
        "uploading" to (uiState.stats["uploading"] ?: 0),
        "failed" to (uiState.stats["failed"] ?: 0),
        "uploaded" to (uiState.stats["uploaded"] ?: 0)
    )
    val pendingCount = (uiState.stats["queued"] ?: 0) + (uiState.stats["failed"] ?: 0)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisBackground)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {

            Text(
                text = "上传队列",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = AegisOnSurface,
                letterSpacing = 0.sp
            )
            Button(
                onClick = { viewModel.refresh() },
                enabled = !uiState.uploading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainer,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("刷新", fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            visibleStats.forEach { (state, count) ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(AegisSurfaceContainerLow)
                        .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "$state: $count",
                        fontSize = 12.sp,
                        color = AegisOnSurfaceVariant
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (uiState.loading || uiState.uploading) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CircularProgressIndicator(
                    color = AegisPrimary,
                    modifier = Modifier.size(22.dp),
                    strokeWidth = 2.dp
                )
                if (uiState.uploading) {
                    Spacer(modifier = Modifier.size(8.dp))
                    Text("Uploading pending evidence...", color = AegisOnSurfaceVariant, fontSize = 12.sp)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        if (uiState.error != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(AegisErrorContainer.copy(alpha = 0.15f))
                    .padding(12.dp)
            ) {
                Text(
                    text = uiState.error ?: "Queue load failed",
                    color = AegisError,
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        if (uiState.actionMessage != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(AegisPrimaryContainer.copy(alpha = 0.12f))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(
                    text = uiState.actionMessage ?: "",
                    color = AegisOnSurface,
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.retryAll() },
                enabled = !uiState.uploading && pendingCount > 0,
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisPrimary,
                    contentColor = AegisOnPrimary,
                    disabledContainerColor = AegisSurfaceContainer,
                    disabledContentColor = AegisOnSurfaceVariant
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    if (uiState.uploading) "上传中..." else "Upload Pending",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Button(
                onClick = { navController.navigate("camera") },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainer,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                Text("打开相机", fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        val listModifier = Modifier
            .fillMaxWidth()
            .weight(1f)

        if (uiState.events.isEmpty()) {
            Box(
                modifier = listModifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(AegisSurfaceContainerLow)
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("暂无待上传项", color = AegisOnSurface, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    Text("New detections will appear here after capture.", color = AegisOnSurfaceVariant, fontSize = 12.sp)
                    Button(
                        onClick = { navController.navigate("camera") },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AegisPrimaryContainer,
                            contentColor = AegisOnPrimary
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("打开相机", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = listModifier
            ) {
                items(uiState.events) { item ->
                    val event = item.event
                    val canUpload = event.uploadState == "QUEUED" || event.uploadState == "FAILED"
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(AegisSurfaceContainerLow)
                            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                            .padding(12.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = event.eventId,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = AegisOnSurface
                            )
                            Text(
                                text = "Status: ${event.uploadState}  |  Attempts: ${event.uploadAttempts}  |  Class: ${event.vehicleClass}",
                                fontSize = 12.sp,
                                color = AegisOnSurfaceVariant
                            )
                            if (event.lastError.isNotBlank()) {
                                Text(
                                    text = "Error: ${event.lastError}",
                                    fontSize = 12.sp,
                                    color = AegisError
                                )
                            }
                            EvidenceStrip(item.evidence)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                TextButton(onClick = { navController.navigate("camera") }) {
                                    Text("相机", color = AegisPrimary)
                                }
                                TextButton(
                                    onClick = { viewModel.retryEvent(event.eventId) },
                                    enabled = !uiState.uploading && canUpload
                                ) {
                                    Text(
                                        when {
                                            uiState.uploading -> "Uploading"
                                            event.uploadState == "UPLOADED" -> "已上传"
                                            else -> "上传"
                                        },
                                        color = if (!canUpload || uiState.uploading) AegisOnSurfaceVariant else AegisPrimary
                                    )
                                }
                                TextButton(
                                    onClick = { viewModel.deleteEvent(event.eventId) },
                                    enabled = !uiState.uploading
                                ) {
                                    Text("删除", color = AegisError)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EvidenceStrip(evidence: List<EvidenceFileEntity>) {
    val visible = evidence
        .filter { it.localPath.isNotBlank() }
        .sortedBy { evidenceOrder(it.evidenceType) }

    if (visible.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(AegisSurfaceContainer)
                .padding(10.dp)
        ) {
            Text("暂无本地照片", color = AegisOnSurfaceVariant, fontSize = 12.sp)
        }
        return
    }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        visible.take(3).forEach { file ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(72.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(AegisSurfaceContainer),
                contentAlignment = Alignment.BottomStart
            ) {
                AsyncImage(
                    model = file.localPath,
                    contentDescription = file.evidenceType,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    modifier = Modifier
                        .background(AegisBackground.copy(alpha = 0.72f))
                        .padding(horizontal = 6.dp, vertical = 3.dp)
                ) {
                    Text(evidenceLabel(file.evidenceType), color = AegisOnSurface, fontSize = 10.sp)
                }
            }
        }
    }
}

private fun evidenceOrder(type: String): Int {
    return when (type) {
        "frame_peak" -> 0
        "frame_before" -> 1
        "frame_after" -> 2
        else -> 3
    }
}

private fun evidenceLabel(type: String): String {
    return when (type) {
        "frame_peak" -> "Peak"
        "frame_before" -> "Before"
        "frame_after" -> "After"
        else -> "Photo"
    }
}
