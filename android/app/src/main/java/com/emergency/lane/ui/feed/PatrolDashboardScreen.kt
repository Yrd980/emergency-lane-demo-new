package com.emergency.lane.ui.feed

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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ImageNotSupported
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.emergency.lane.ui.theme.AegisBackground
import com.emergency.lane.ui.theme.AegisError
import com.emergency.lane.ui.theme.AegisOnPrimary
import com.emergency.lane.ui.theme.AegisOnSurface
import com.emergency.lane.ui.theme.AegisOnSurfaceVariant
import com.emergency.lane.ui.theme.AegisOutlineVariant
import com.emergency.lane.ui.theme.AegisPrimary
import com.emergency.lane.ui.theme.AegisPrimaryContainer
import com.emergency.lane.ui.theme.AegisSecondaryContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainerHigh
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow

@Composable
fun PatrolDashboardScreen(
    navController: NavController,
    viewModel: PatrolDashboardViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisBackground)
            .navigationBarsPadding()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "Patrol Tasks",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AegisOnSurface,
                    letterSpacing = 0.sp
                )
                Text(
                    text = if (state.username.isBlank()) {
                        "Tasks assigned from the web console appear here after the account is connected."
                    } else {
                        "Signed in as ${state.username}. Assigned tasks sync from the backend."
                    },
                    fontSize = 12.sp,
                    color = AegisOnSurfaceVariant
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatusCard(
                    modifier = Modifier.weight(1f),
                    label = "Open",
                    value = state.activeTaskCount.toString(),
                    valueColor = AegisPrimary,
                    showStatusDot = state.activeTaskCount > 0
                )
                StatusCard(
                    modifier = Modifier.weight(1f),
                    label = "Assigned",
                    value = state.todayCaseCount.toString(),
                    valueColor = AegisOnSurface
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { viewModel.refresh() },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AegisSurfaceContainerHigh,
                        contentColor = AegisOnSurface
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Refresh", fontSize = 12.sp)
                }
                Button(
                    onClick = { navController.navigate("account") },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (state.needsConfiguration) AegisPrimary else AegisSurfaceContainer,
                        contentColor = if (state.needsConfiguration) AegisOnPrimary else AegisOnSurface
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Account", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (state.loading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = AegisPrimary)
                }
            }
        } else if (state.error != null) {
            item {
                StatePanel(
                    title = if (state.needsConfiguration) "Account setup needed" else "Task sync failed",
                    message = state.error ?: "Unable to load tasks.",
                    tone = "error",
                    primaryLabel = if (state.needsConfiguration) "Open Account" else "Retry",
                    onPrimary = {
                        if (state.needsConfiguration) navController.navigate("account") else viewModel.refresh()
                    }
                )
            }
        } else if (state.incidents.isEmpty()) {
            item {
                StatePanel(
                    title = "No assigned tasks",
                    message = "Web dispatch has not assigned anything to this patrol account yet.",
                    tone = "idle",
                    primaryLabel = "Check Again",
                    onPrimary = { viewModel.refresh() }
                )
            }
        }

        if (state.incidents.isNotEmpty()) {
            item {
                Text(
                    text = "Assigned Cases",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AegisOnSurface
                )
            }
        }

        items(state.incidents) { incident ->
            IncidentCard(
                incident = incident,
                onAccept = { viewModel.acceptTask(incident.taskId) },
                onComplete = { viewModel.completeTask(incident.taskId) },
                onOpenEvidence = { navController.navigate("camera") },
                onNavigate = { navController.navigate("camera") }
            )
        }

        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

@Composable
private fun StatePanel(
    title: String,
    message: String,
    tone: String,
    primaryLabel: String,
    onPrimary: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(AegisSurfaceContainerLow)
            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = if (tone == "error") Icons.Default.Warning else Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = if (tone == "error") AegisError else AegisPrimary,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(title, color = AegisOnSurface, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
            Text(message, color = AegisOnSurfaceVariant, fontSize = 12.sp)
            Button(
                onClick = onPrimary,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (tone == "error") AegisPrimary else AegisSurfaceContainerHigh,
                    contentColor = if (tone == "error") AegisOnPrimary else AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(primaryLabel, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun StatusCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    valueColor: Color,
    showStatusDot: Boolean = false
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(AegisSurfaceContainerLow)
            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Column {
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = AegisOnSurfaceVariant,
                letterSpacing = 0.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = value,
                    fontSize = 30.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = valueColor,
                    letterSpacing = 0.sp
                )
                if (showStatusDot) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(AegisPrimaryContainer)
                    )
                }
            }
        }
    }
}

@Composable
private fun IncidentCard(
    incident: IncidentItem,
    onAccept: () -> Unit,
    onComplete: () -> Unit,
    onOpenEvidence: () -> Unit,
    onNavigate: () -> Unit
) {
    val isHighRisk = incident.riskLevel == "high" || incident.riskLevel == "critical"
    val badgeColor = if (isHighRisk) AegisSecondaryContainer else AegisSurfaceContainerHigh
    val badgeText = if (isHighRisk) "HIGH RISK" else "NORMAL"

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(AegisSurfaceContainerLow)
            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(156.dp)
                    .background(AegisSurfaceContainer)
            ) {
                if (incident.thumbnailUrl.isBlank()) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.ImageNotSupported,
                            contentDescription = null,
                            tint = AegisOnSurfaceVariant,
                            modifier = Modifier.size(30.dp)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("No image evidence", fontSize = 12.sp, color = AegisOnSurfaceVariant)
                    }
                } else {
                    AsyncImage(
                        model = incident.thumbnailUrl,
                        contentDescription = "Evidence image",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(badgeColor)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = badgeText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = AegisOnSurface,
                        letterSpacing = 0.sp
                    )
                }
            }

            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = incident.title,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = AegisOnSurface
                    )
                    Text(
                        text = "${incident.location} · ${incident.status.uppercase()} · ${incident.detectedTime}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = AegisOnSurfaceVariant
                    )
                    Text(
                        text = "Confidence ${"%.0f".format(incident.confidence * 100)}%",
                        fontSize = 12.sp,
                        color = AegisOnSurfaceVariant
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            when (incident.status) {
                                "completed" -> {}
                                "accepted" -> onComplete()
                                else -> onAccept()
                            }
                        },
                        enabled = incident.status != "completed",
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AegisPrimary,
                            contentColor = AegisOnPrimary
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = when (incident.status) {
                                "accepted" -> "Complete"
                                "completed" -> "Completed"
                                else -> "Accept"
                            },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    IconButton(
                        onClick = onOpenEvidence,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(AegisSurfaceContainerHigh)
                            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    ) {
                        Icon(
                            imageVector = Icons.Default.ImageNotSupported,
                            contentDescription = "Open detection",
                            tint = AegisOnSurface,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    IconButton(
                        onClick = onNavigate,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(AegisSurfaceContainerHigh)
                            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Navigation,
                            contentDescription = "Open detection",
                            tint = AegisOnSurface,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}
