package com.emergency.lane.ui.queue

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController

@Composable
fun QueueScreen(navController: NavController, viewModel: QueueViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("事件上传队列", style = MaterialTheme.typography.headlineSmall)

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            uiState.stats.forEach { (state, count) ->
                Text("$state: $count")
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = { viewModel.retryAll() }) { Text("重试全部失败事件") }
        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(uiState.events) { event ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(event.eventId, style = MaterialTheme.typography.bodyMedium)
                        Text("状态: ${event.uploadState}  |  尝试: ${event.uploadAttempts}  |  类别: ${event.vehicleClass}")
                        if (event.lastError.isNotBlank()) {
                            Text("错误: ${event.lastError}", color = MaterialTheme.colorScheme.error)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(onClick = { viewModel.retryEvent(event.eventId) }) { Text("重试") }
                            TextButton(onClick = { viewModel.deleteEvent(event.eventId) }) { Text("删除") }
                        }
                    }
                }
            }
        }

        Button(onClick = { navController.popBackStack() }) { Text("返回") }
    }
}
