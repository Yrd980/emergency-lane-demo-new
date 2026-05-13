package com.emergency.lane.ui.login

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emergency.lane.BuildConfig
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.ui.settings.SettingsUiState
import com.emergency.lane.ui.settings.SettingsViewModel
import com.emergency.lane.ui.theme.AegisBackground
import com.emergency.lane.ui.theme.AegisError
import com.emergency.lane.ui.theme.AegisOnPrimary
import com.emergency.lane.ui.theme.AegisOnSurface
import com.emergency.lane.ui.theme.AegisOnSurfaceVariant
import com.emergency.lane.ui.theme.AegisOutlineVariant
import com.emergency.lane.ui.theme.AegisPrimary
import com.emergency.lane.ui.theme.AegisSurfaceContainer
import com.emergency.lane.ui.theme.AegisSurfaceContainerLow

@Composable
fun LoginScreen(viewModel: SettingsViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    var baseUrl by remember { mutableStateOf("") }
    var deviceId by remember { mutableStateOf("") }
    var deviceName by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var formError by remember { mutableStateOf<String?>(null) }
    var versionTapCount by rememberSaveable { mutableStateOf(0) }
    var developerMode by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(uiState.baseUrl, uiState.deviceId, uiState.deviceName, uiState.username) {
        baseUrl = uiState.baseUrl
        deviceId = uiState.deviceId
        deviceName = uiState.deviceName
        username = uiState.username
    }

    fun validateUrl(url: String): String? {
        if (url.isBlank()) return "Enter backend address"
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return "Address must start with http:// or https://"
        }
        return null
    }

    fun validateForm(): String? {
        validateUrl(baseUrl)?.let { return it }
        if (username.isBlank()) return "Enter backend account"
        if (password.isBlank()) return "Enter password"
        return null
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisBackground)
            .verticalScroll(rememberScrollState())
            .imePadding()
            .navigationBarsPadding()
            .padding(horizontal = 20.dp, vertical = 28.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Aegis 交通",
            fontSize = 26.sp,
            fontWeight = FontWeight.SemiBold,
            color = AegisPrimary,
            letterSpacing = 0.sp
        )
        Text(
            text = "Enter the patrol workspace for assigned tasks and camera capture.",
            fontSize = 13.sp,
            color = AegisOnSurfaceVariant
        )

        if (developerMode) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Cloud, contentDescription = null, tint = AegisOnSurfaceVariant)
                Text("开发者连接", color = AegisOnSurface, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }

            OutlinedTextField(
                modifier = Modifier.fillMaxWidth(),
                value = baseUrl,
                onValueChange = { baseUrl = it; formError = null },
                label = { Text("后端地址", color = AegisOnSurfaceVariant) },
                placeholder = { Text(SettingsStore.DEFAULT_BACKEND_URL) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Next),
                colors = fieldColors(),
                shape = RoundedCornerShape(8.dp)
            )

            OutlinedTextField(
                modifier = Modifier.fillMaxWidth(),
                value = username,
                onValueChange = { username = it; formError = null },
                label = { Text("后端账号", color = AegisOnSurfaceVariant) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                colors = fieldColors(),
                shape = RoundedCornerShape(8.dp)
            )

            OutlinedTextField(
                modifier = Modifier.fillMaxWidth(),
                value = password,
                onValueChange = { password = it; formError = null },
                label = { Text("密码", color = AegisOnSurfaceVariant) },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                colors = fieldColors(),
                shape = RoundedCornerShape(8.dp)
            )
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.PhoneAndroid, contentDescription = null, tint = AegisOnSurfaceVariant)
            Text(
                text = deviceName.ifBlank { "Android patrol device" },
                color = AegisOnSurfaceVariant,
                fontSize = 12.sp
            )
        }

        formError?.let {
            Text(it, color = AegisError, fontSize = 13.sp)
        }

        when (val status = uiState.connectionStatus) {
            is SettingsUiState.ConnectionStatus.Testing ->
                Text("连接中...", color = AegisOnSurfaceVariant, fontSize = 13.sp)
            is SettingsUiState.ConnectionStatus.Success ->
                Text(status.msg, color = AegisPrimary, fontSize = 13.sp)
            is SettingsUiState.ConnectionStatus.Error ->
                Text(status.msg, color = AegisError, fontSize = 13.sp)
            is SettingsUiState.ConnectionStatus.Idle -> {}
        }

        Button(
            onClick = {
                val patrolBaseUrl = if (developerMode) baseUrl else baseUrl.ifBlank { SettingsStore.DEFAULT_BACKEND_URL }
                val patrolUsername = if (developerMode) username else SettingsStore.DEFAULT_PATROL_USERNAME
                val patrolPassword = if (developerMode) password else SettingsStore.DEFAULT_PATROL_PASSWORD
                val error = if (developerMode) {
                    validateForm()
                } else {
                    validateUrl(patrolBaseUrl)
                }
                if (error != null) {
                    formError = error
                } else {
                    viewModel.saveAndRegister(patrolBaseUrl, deviceId, deviceName, patrolUsername, patrolPassword)
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = AegisPrimary, contentColor = AegisOnPrimary),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("进入巡检", fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }

        Text(
            text = "App Version: ${BuildConfig.VERSION_NAME}",
            color = if (developerMode) AegisPrimary else AegisOnSurfaceVariant,
            fontSize = 12.sp,
            modifier = Modifier.clickable {
                if (!developerMode) {
                    versionTapCount += 1
                    if (versionTapCount >= 7) developerMode = true
                }
            }
        )
        if (developerMode) {
            Text("开发者模式已启用", color = AegisPrimary, fontSize = 12.sp)
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = AegisPrimary,
    unfocusedBorderColor = AegisOutlineVariant,
    focusedTextColor = AegisOnSurface,
    unfocusedTextColor = AegisOnSurface,
    cursorColor = AegisPrimary,
    focusedContainerColor = AegisSurfaceContainer,
    unfocusedContainerColor = AegisSurfaceContainerLow,
    focusedLabelColor = AegisOnSurfaceVariant,
    unfocusedLabelColor = AegisOnSurfaceVariant
)
