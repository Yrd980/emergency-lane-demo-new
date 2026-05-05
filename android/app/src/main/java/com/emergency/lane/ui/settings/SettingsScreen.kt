package com.emergency.lane.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController

@Composable
fun SettingsScreen(
    navController: NavController,
    viewModel: SettingsViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var baseUrl by remember { mutableStateOf("http://192.168.1.6:8000") }
    var deviceId by remember { mutableStateOf("vivo_x100_001") }
    var deviceName by remember { mutableStateOf("vivo X100") }
    var urlError by remember { mutableStateOf<String?>(null) }

    fun validateUrl(url: String): String? {
        if (url.isBlank()) return "请输入 HP 后端地址"
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return "地址必须以 http:// 或 https:// 开头"
        }
        return null
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("HP 连接设置", style = MaterialTheme.typography.headlineSmall)

        OutlinedTextField(
            value = baseUrl, onValueChange = { baseUrl = it; urlError = null },
            label = { Text("HP Base URL") }, isError = urlError != null,
            supportingText = urlError?.let { { Text(it) } }
        )
        OutlinedTextField(value = deviceId, onValueChange = { deviceId = it }, label = { Text("设备 ID") })
        OutlinedTextField(value = deviceName, onValueChange = { deviceName = it }, label = { Text("设备名称") })

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {
                val err = validateUrl(baseUrl)
                if (err != null) { urlError = err; return@Button }
                viewModel.testConnection(baseUrl)
            }) { Text("测试连接") }
            Button(onClick = {
                val err = validateUrl(baseUrl)
                if (err != null) { urlError = err; return@Button }
                viewModel.saveAndRegister(baseUrl, deviceId, deviceName)
            }) { Text("保存并注册") }
        }

        when (val status = uiState.connectionStatus) {
            is SettingsUiState.ConnectionStatus.Testing -> Text("测试中...")
            is SettingsUiState.ConnectionStatus.Success -> Text(status.msg, color = MaterialTheme.colorScheme.primary)
            is SettingsUiState.ConnectionStatus.Error -> Text(status.msg, color = MaterialTheme.colorScheme.error)
            is SettingsUiState.ConnectionStatus.Idle -> {}
        }

        if (uiState.isRegistered) {
            Text("已注册: ${uiState.deviceId}", color = MaterialTheme.colorScheme.primary)
        }

        Text("App 版本: 0.1.0", style = MaterialTheme.typography.bodySmall)
        Text("模型版本: manual-sim-0.1.0", style = MaterialTheme.typography.bodySmall)

        Button(onClick = { navController.popBackStack() }) { Text("返回") }
    }
}
