package com.emergency.lane.ui.settings

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import com.emergency.lane.ui.theme.AegisPrimaryContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainerHigh
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow

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
        if (url.isBlank()) return "Enter HP backend address"
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return "Address must start with http:// or https://"
        }
        return null
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "HP Connection",
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            color = AegisOnSurface,
            letterSpacing = (-0.2).sp
        )

        OutlinedTextField(
            value = baseUrl,
            onValueChange = { baseUrl = it; urlError = null },
            label = { Text("HP Base URL", color = AegisOnSurfaceVariant) },
            isError = urlError != null,
            supportingText = urlError?.let { { Text(it, color = AegisError) } },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AegisPrimary,
                unfocusedBorderColor = AegisOutlineVariant,
                focusedTextColor = AegisOnSurface,
                unfocusedTextColor = AegisOnSurface,
                cursorColor = AegisPrimary,
                focusedContainerColor = AegisSurfaceContainer,
                unfocusedContainerColor = AegisSurfaceContainerLow
            ),
            shape = RoundedCornerShape(8.dp)
        )

        OutlinedTextField(
            value = deviceId,
            onValueChange = { deviceId = it },
            label = { Text("Device ID", color = AegisOnSurfaceVariant) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AegisPrimary,
                unfocusedBorderColor = AegisOutlineVariant,
                focusedTextColor = AegisOnSurface,
                unfocusedTextColor = AegisOnSurface,
                cursorColor = AegisPrimary,
                focusedContainerColor = AegisSurfaceContainer,
                unfocusedContainerColor = AegisSurfaceContainerLow
            ),
            shape = RoundedCornerShape(8.dp)
        )

        OutlinedTextField(
            value = deviceName,
            onValueChange = { deviceName = it },
            label = { Text("Device Name", color = AegisOnSurfaceVariant) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AegisPrimary,
                unfocusedBorderColor = AegisOutlineVariant,
                focusedTextColor = AegisOnSurface,
                unfocusedTextColor = AegisOnSurface,
                cursorColor = AegisPrimary,
                focusedContainerColor = AegisSurfaceContainer,
                unfocusedContainerColor = AegisSurfaceContainerLow
            ),
            shape = RoundedCornerShape(8.dp)
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    val err = validateUrl(baseUrl)
                    if (err != null) { urlError = err; return@Button }
                    viewModel.testConnection(baseUrl)
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisSurfaceContainerHigh,
                    contentColor = AegisOnSurface
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Test Connection", fontSize = 12.sp)
            }
            Button(
                onClick = {
                    val err = validateUrl(baseUrl)
                    if (err != null) { urlError = err; return@Button }
                    viewModel.saveAndRegister(baseUrl, deviceId, deviceName)
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = AegisPrimary,
                    contentColor = AegisOnPrimary
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Save & Register", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        when (val status = uiState.connectionStatus) {
            is SettingsUiState.ConnectionStatus.Testing ->
                Text("Testing...", color = AegisOnSurfaceVariant, fontSize = 14.sp)
            is SettingsUiState.ConnectionStatus.Success ->
                Text(status.msg, color = AegisPrimary, fontSize = 14.sp)
            is SettingsUiState.ConnectionStatus.Error ->
                Text(status.msg, color = AegisError, fontSize = 14.sp)
            is SettingsUiState.ConnectionStatus.Idle -> {}
        }

        if (uiState.isRegistered) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(AegisPrimaryContainer.copy(alpha = 0.15f))
                    .padding(12.dp)
            ) {
                Text(
                    "Registered: ${uiState.deviceId}",
                    color = AegisPrimary,
                    fontSize = 14.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(AegisSurfaceContainerLow)
                .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column {
                Text("App Version: 0.1.0", fontSize = 14.sp, color = AegisOnSurfaceVariant)
                Text("Model: manual-sim-0.1.0", fontSize = 14.sp, color = AegisOnSurfaceVariant)
            }
        }
    }
}
