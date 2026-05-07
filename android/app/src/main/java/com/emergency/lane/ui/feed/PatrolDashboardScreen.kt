package com.emergency.lane.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Emergency
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.Videocam
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.emergency.lane.ui.theme.AegisBackground
import com.emergency.lane.ui.theme.AegisError
import com.emergency.lane.ui.theme.AegisOnPrimary
import com.emergency.lane.ui.theme.AegisOnSecondaryContainer
import com.emergency.lane.ui.theme.AegisOnSurface
import com.emergency.lane.ui.theme.AegisOnSurfaceVariant
import com.emergency.lane.ui.theme.AegisOnTertiaryContainer
import com.emergency.lane.ui.theme.AegisOutlineVariant
import com.emergency.lane.ui.theme.AegisPrimary
import com.emergency.lane.ui.theme.AegisPrimaryContainer
import com.emergency.lane.ui.theme.AegisSecondary
import com.emergency.lane.ui.theme.AegisSecondaryContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainerHigh
import com.emergency.lane.ui.theme.AegisSurfaceContainerHighest
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow
import com.emergency.lane.ui.theme.AegisTertiary
import com.emergency.lane.ui.theme.AegisTertiaryContainer
import com.emergency.lane.ui.theme.AegisOnTertiary
import com.emergency.lane.ui.theme.AegisOnSecondary

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
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Status Summary Header
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                StatusCard(
                    modifier = Modifier.weight(1f),
                    label = "Active Tasks",
                    value = state.activeTaskCount.toString().padStart(2, '0'),
                    valueColor = AegisPrimary,
                    showStatusDot = true
                )
                StatusCard(
                    modifier = Modifier.weight(1f),
                    label = "Today's Cases",
                    value = state.todayCaseCount.toString(),
                    valueColor = AegisOnSurface,
                    badge = "+${state.caseChangePercent}%",
                    badgeColor = AegisSecondaryContainer
                )
            }
        }

        // Map Integration
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(128.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(AegisSurfaceContainer)
                    .border(1.dp, AegisOutlineVariant.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            ) {
                // Grid pattern background
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(
                                    AegisSurfaceContainer,
                                    AegisSurfaceContainerHigh,
                                    AegisSurfaceContainer
                                )
                            )
                        )
                )
                // Glass panel location chip
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(16.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(AegisSurfaceContainer.copy(alpha = 0.8f))
                        .border(
                            0.5.dp,
                            Color.White.copy(alpha = 0.05f),
                            RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Navigation,
                            contentDescription = null,
                            tint = AegisSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Nearest: M4 J12 - 1.2km",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = AegisOnSurface
                        )
                    }
                }
            }
        }

        // Incident Feed Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Incident Alerts",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AegisOnSurface,
                    letterSpacing = (-0.2).sp
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(AegisPrimary.copy(alpha = 0.1f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Live Feed",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = AegisPrimary,
                        letterSpacing = 0.24.sp
                    )
                }
            }
        }

        // Loading / Error states
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
        } else if (state.error != null && state.incidents.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(AegisSurfaceContainerLow)
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = state.error ?: "Unable to load incidents",
                        color = AegisError,
                        fontSize = 14.sp
                    )
                }
            }
        }

        // Incident Cards
        items(state.incidents) { incident ->
            IncidentCard(incident = incident)
        }

        // Bottom spacing for nav bar
        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}

@Composable
private fun StatusCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    valueColor: Color,
    showStatusDot: Boolean = false,
    badge: String? = null,
    badgeColor: Color = Color.Transparent
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(AegisSurfaceContainerLow)
            .border(0.5.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = AegisOnSurfaceVariant,
                letterSpacing = 0.24.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = value,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = valueColor,
                    letterSpacing = (-0.64).sp
                )
                if (showStatusDot) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(AegisPrimaryContainer)
                            .align(Alignment.Bottom)
                            .padding(bottom = 8.dp)
                    )
                }
                if (badge != null) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = badge,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = badgeColor,
                        modifier = Modifier.align(Alignment.Bottom).padding(bottom = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun IncidentCard(incident: IncidentItem) {
    val isCritical = incident.riskLevel == "critical"
    val badgeColor = if (isCritical) AegisSecondaryContainer else AegisTertiaryContainer
    val badgeTextColor = if (isCritical) AegisOnSecondaryContainer else AegisOnTertiaryContainer

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(AegisSurfaceContainerLow)
            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
    ) {
        Column {
            // Image section with gradient overlay
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                AegisSurfaceContainerHigh,
                                AegisSurfaceContainer,
                                AegisSurfaceContainerLow
                            )
                        )
                    )
            ) {
                // Badge at top-right
                Row(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(badgeColor)
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isCritical) Icons.Default.Warning else Icons.Default.Emergency,
                        contentDescription = null,
                        tint = badgeTextColor,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (isCritical) "CRITICAL" else "URGENT",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeTextColor,
                        letterSpacing = 0.24.sp
                    )
                }

                // Location label at bottom
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    AegisBackground.copy(alpha = 0.8f)
                                )
                            )
                        )
                        .padding(8.dp)
                ) {
                    Text(
                        text = incident.location,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = AegisOnSurface
                    )
                }
            }

            // Content section
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = incident.title,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = AegisOnSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Detected ${incident.detectedAgo} • ${incident.detectedTime}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = AegisOnSurfaceVariant
                        )
                    }
                    IconButton(
                        onClick = {},
                        modifier = Modifier.size(24.dp)
                    ) {
                        Text(
                            text = "⋮",
                            fontSize = 20.sp,
                            color = AegisPrimary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Action buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {},
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AegisPrimary,
                            contentColor = AegisOnPrimary
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "Accept Task",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    IconButton(
                        onClick = {},
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(AegisSurfaceContainerHigh)
                            .border(
                                1.dp,
                                AegisOutlineVariant.copy(alpha = 0.3f),
                                RoundedCornerShape(8.dp)
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Videocam,
                            contentDescription = "Video",
                            tint = AegisOnSurface,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    IconButton(
                        onClick = {},
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(AegisSurfaceContainerHigh)
                            .border(
                                1.dp,
                                AegisOutlineVariant.copy(alpha = 0.3f),
                                RoundedCornerShape(8.dp)
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Navigation,
                            contentDescription = "Navigate",
                            tint = AegisOnSurface,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}
