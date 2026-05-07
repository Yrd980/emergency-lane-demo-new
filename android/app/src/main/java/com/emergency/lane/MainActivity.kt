package com.emergency.lane

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.emergency.lane.ui.EmergencyLaneNavHost
import com.emergency.lane.ui.theme.AegisTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContent {
            AegisTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    EmergencyLaneNavHost()
                }
            }
        }
    }
}
