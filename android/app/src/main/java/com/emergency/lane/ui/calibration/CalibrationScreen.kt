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
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController

@Composable
fun CalibrationScreen(
    navController: NavController,
    viewModel: CalibrationViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        // Drawing area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Color.DarkGray)
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
                    drawPath(path, Color.Cyan, style = Stroke(width = 4f, cap = StrokeCap.Round))
                }
                // Draw points
                uiState.points.forEach { p ->
                    drawCircle(Color.Yellow, radius = 12f, center = Offset(p.x, p.y))
                    drawCircle(Color.Black, radius = 10f, center = Offset(p.x, p.y))
                    drawCircle(Color.Yellow, radius = 6f, center = Offset(p.x, p.y))
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
                enabled = uiState.points.size >= 4
            ) { Text("保存 (${uiState.points.size} 点)") }
            Button(onClick = { viewModel.undoLastPoint() }) { Text("撤销") }
            Button(onClick = { viewModel.clearAll() }) { Text("清空") }
            Button(onClick = { viewModel.resetRoi() }) { Text("重置") }
            Button(onClick = { navController.popBackStack() }) { Text("返回") }
        }

        uiState.message?.let {
            Text(it, modifier = Modifier.padding(8.dp))
        }
    }
}
