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
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
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
import com.emergency.lane.ui.theme.AegisSurfaceContainerHigh
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow

@Composable
fun QueueScreen(navController: NavController, viewModel: QueueViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisBackground)
            .padding(16.dp)
    ) {
        Text(
            text = "Upload Queue",
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            color = AegisOnSurface,
            letterSpacing = (-0.2).sp
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            uiState.stats.forEach { (state, count) ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(AegisSurfaceContainer)
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

        Button(
            onClick = { viewModel.retryAll() },
            colors = ButtonDefaults.buttonColors(
                containerColor = AegisPrimary,
                contentColor = AegisOnPrimary
            ),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Retry All Failed", fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(uiState.events) { event ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(AegisSurfaceContainerLow)
                        .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column {
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
                            TextButton(onClick = {
                                viewModel.retryEvent(event.eventId)
                                coroutineScope.launch {
                                    // Snackbar removed — use Toast or inline feedback
                                }
                            }) {
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
