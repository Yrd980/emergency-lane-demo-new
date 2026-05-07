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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
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
        "failed" to (uiState.stats["failed"] ?: 0),
        "uploaded" to (uiState.stats["uploaded"] ?: 0)
    )

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
                text = "Upload Queue",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = AegisOnSurface,
                letterSpacing = 0.sp
            )
            Button(
                onClick = { viewModel.refresh() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainer,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Refresh", fontSize = 12.sp)
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

        if (uiState.loading) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(color = AegisPrimary)
            }
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
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisPrimary,
                    contentColor = AegisOnPrimary
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                Text("Upload Pending", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            Button(
                onClick = { navController.navigate("map") },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainer,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                Text("Open Detection", fontSize = 12.sp)
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
                    Text("No queued uploads", color = AegisOnSurface, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    Text("New detections will appear here after capture.", color = AegisOnSurfaceVariant, fontSize = 12.sp)
                    Button(
                        onClick = { navController.navigate("map") },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AegisPrimaryContainer,
                            contentColor = AegisOnPrimary
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Go to Detection", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = listModifier
            ) {
                items(uiState.events) { event ->
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
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                TextButton(onClick = { navController.navigate("map") }) {
                                    Text("Detection", color = AegisPrimary)
                                }
                                TextButton(onClick = { viewModel.retryEvent(event.eventId) }) {
                                    Text("Retry", color = AegisPrimary)
                                }
                                TextButton(onClick = { viewModel.deleteEvent(event.eventId) }) {
                                    Text("Delete", color = AegisError)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
