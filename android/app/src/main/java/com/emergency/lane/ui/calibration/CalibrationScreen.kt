package com.emergency.lane.ui.calibration

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.emergency.lane.ui.theme.AegisBackground
import com.emergency.lane.ui.theme.AegisOnPrimary
import com.emergency.lane.ui.theme.AegisOnSurface
import com.emergency.lane.ui.theme.AegisOnSurfaceVariant
import com.emergency.lane.ui.theme.AegisPrimary
import com.emergency.lane.ui.theme.AegisPrimaryContainer
import com.emergency.lane.ui.theme.AegisSecondary
import com.emergency.lane.ui.theme.AegisSurfaceContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainerHigh
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow

@Composable
fun CalibrationScreen(
    navController: NavController,
    viewModel: CalibrationViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(AegisBackground)) {
        // Drawing area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(AegisSurfaceContainerLow)
                .pointerInput(Unit) {
                    detectTapGestures { offset ->
                        viewModel.addPoint(offset.x, offset.y)
                    }
                }
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                // Draw polygon edges
                if (uiState.points.size >= 2) {
                    val path = Path().apply {
                        moveTo(uiState.points.first().x, uiState.points.first().y)
                        uiState.points.drop(1).forEach { p -> lineTo(p.x, p.y) }
                        if (uiState.points.size >= 3) close()
                    }
                    drawPath(path, AegisPrimary, style = Stroke(width = 4f, cap = StrokeCap.Round))
                }
                // Draw points
                uiState.points.forEach { p ->
                    drawCircle(AegisSecondary, radius = 12f, center = Offset(p.x, p.y))
                    drawCircle(AegisBackground, radius = 10f, center = Offset(p.x, p.y))
                    drawCircle(AegisSecondary, radius = 6f, center = Offset(p.x, p.y))
                }
            }
        }

        // Controls
        Row(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.save() },
                enabled = uiState.points.size >= 4,
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisPrimary,
                    contentColor = AegisOnPrimary
                ),
                shape = RoundedCornerShape(8.dp)
            ) { Text("Save (${uiState.points.size} pts)", fontSize = 12.sp) }
            Button(
                onClick = { viewModel.undoLastPoint() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainerHigh,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp)
            ) { Text("Undo", fontSize = 12.sp) }
            Button(
                onClick = { viewModel.clearAll() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainerHigh,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp)
            ) { Text("Clear", fontSize = 12.sp) }
            Button(
                onClick = { viewModel.resetRoi() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainerHigh,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp)
            ) { Text("Reset", fontSize = 12.sp) }
            Button(
                onClick = { navController.popBackStack() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainerHigh,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp)
            ) { Text("Back", fontSize = 12.sp) }
        }

        uiState.message?.let {
            Text(
                it,
                modifier = Modifier.padding(8.dp),
                color = AegisOnSurfaceVariant,
                fontSize = 14.sp
            )
        }
    }
}
