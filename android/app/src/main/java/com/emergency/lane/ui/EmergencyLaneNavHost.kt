package com.emergency.lane.ui

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.emergency.lane.ui.detection.DetectionScreen
import com.emergency.lane.ui.calibration.CalibrationScreen
import com.emergency.lane.ui.queue.QueueScreen
import com.emergency.lane.ui.settings.SettingsScreen

@Composable
fun EmergencyLaneNavHost() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "detection") {
        composable("detection") { DetectionScreen(navController) }
        composable("calibration") { CalibrationScreen(navController) }
        composable("queue") { QueueScreen(navController) }
        composable("settings") { SettingsScreen(navController) }
    }
}
