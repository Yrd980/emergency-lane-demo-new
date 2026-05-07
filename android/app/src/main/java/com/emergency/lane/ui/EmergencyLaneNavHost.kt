package com.emergency.lane.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Sensors
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.emergency.lane.ui.calibration.CalibrationScreen
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.ui.detection.DetectionScreen
import com.emergency.lane.ui.feed.PatrolDashboardScreen
import com.emergency.lane.ui.login.LoginScreen
import com.emergency.lane.ui.queue.QueueScreen
import com.emergency.lane.ui.settings.SettingsScreen
import com.emergency.lane.ui.theme.AegisBackground
import com.emergency.lane.ui.theme.AegisOnPrimaryContainer
import com.emergency.lane.ui.theme.AegisOnSurface
import com.emergency.lane.ui.theme.AegisOnSurfaceVariant
import com.emergency.lane.ui.theme.AegisOutlineVariant
import com.emergency.lane.ui.theme.AegisPrimary
import com.emergency.lane.ui.theme.AegisPrimaryContainer
import com.emergency.lane.ui.theme.AegisSurface
import com.emergency.lane.ui.theme.AegisSurfaceContainerHigh
import com.emergency.lane.ui.theme.AegisSurfaceContainerHighest
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)

private val bottomNavItems = listOf(
    BottomNavItem("feed", "Feed", Icons.Default.Sensors),
    BottomNavItem("alerts", "Alerts", Icons.Default.Warning),
    BottomNavItem("camera", "Camera", Icons.Default.PhotoCamera),
    BottomNavItem("account", "Device", Icons.Default.PhoneAndroid)
)

@Composable
fun EmergencyLaneNavHost() {
    val context = LocalContext.current
    val settingsStore = remember { SettingsStore(context) }
    val baseUrl by settingsStore.baseUrl.collectAsState(initial = "")
    val username by settingsStore.authUsername.collectAsState(initial = "")
    val password by settingsStore.authPassword.collectAsState(initial = "")
    val isConfigured = baseUrl.isNotBlank() && username == SettingsStore.DEFAULT_PATROL_USERNAME && password.isNotBlank()

    if (!isConfigured) {
        LoginScreen()
        return
    }

    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    val currentRoute = currentDestination?.route

    val showBars = currentRoute in listOf("feed", "alerts", "camera", "account")

    Scaffold(
        modifier = Modifier.background(AegisBackground),
        containerColor = AegisBackground,
        topBar = {
            if (showBars) {
                AegisTopBar(navController)
            }
        },
        bottomBar = {
            if (showBars) {
                AegisBottomBar(navController, currentDestination)
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "feed",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("feed") { PatrolDashboardScreen(navController) }
            composable("alerts") { QueueScreen(navController) }
            composable("camera") { DetectionScreen(navController) }
            composable("account") { SettingsScreen(navController) }
            composable("detection") { DetectionScreen(navController) }
            composable("calibration") { CalibrationScreen(navController) }
        }
    }
}

@Composable
private fun AegisTopBar(navController: NavController) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .background(AegisSurfaceContainerLow)
            .padding(horizontal = 24.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Aegis Traffic",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = AegisPrimary,
            letterSpacing = (-0.2).sp
        )

        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Notifications,
                contentDescription = "Notifications",
                tint = AegisPrimary,
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { navController.navigate("alerts") }
            )
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Settings",
                tint = AegisPrimary,
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { navController.navigate("account") }
            )
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(AegisSurfaceContainerHighest)
                    .border(1.dp, AegisOutlineVariant, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Profile",
                    tint = AegisOnSurfaceVariant,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
private fun AegisBottomBar(navController: NavController, currentDestination: androidx.navigation.NavDestination?) {
    NavigationBar(
        containerColor = AegisSurfaceContainerHigh,
        contentColor = AegisOnSurface,
        tonalElevation = 0.dp,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
    ) {
        bottomNavItems.forEach { item ->
            val selected = currentDestination?.hierarchy?.any { it.route == item.route } == true
            NavigationBarItem(
                selected = selected,
                onClick = {
                    navController.navigate(item.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label,
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        letterSpacing = 0.24.sp
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = AegisOnPrimaryContainer,
                    selectedTextColor = AegisOnPrimaryContainer,
                    unselectedIconColor = AegisOnSurfaceVariant,
                    unselectedTextColor = AegisOnSurfaceVariant,
                    indicatorColor = AegisPrimaryContainer
                )
            )
        }
    }
}
