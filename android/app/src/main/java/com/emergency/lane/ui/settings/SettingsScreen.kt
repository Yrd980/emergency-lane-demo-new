package com.emergency.lane.ui.settings

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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Password
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextOverflow
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.emergency.lane.BuildConfig
import com.emergency.lane.data.local.SettingsStore
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
    var baseUrl by remember { mutableStateOf("") }
    var deviceId by remember { mutableStateOf("") }
    var deviceName by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var urlError by remember { mutableStateOf<String?>(null) }
    var versionTapCount by rememberSaveable { mutableStateOf(0) }
    var developerMode by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(uiState.baseUrl, uiState.deviceId, uiState.deviceName, uiState.username) {
        baseUrl = uiState.baseUrl
        deviceId = uiState.deviceId
        deviceName = uiState.deviceName
        username = uiState.username
    }

    fun validateUrl(url: String): String? {
        if (url.isBlank()) return "Enter HP backend address"
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return "Address must start with http:// or https://"
        }
        return null
    }

    fun validateCredentials(): String? {
        if (username.isBlank()) return "Enter HP username"
        if (password.isBlank() && uiState.username.isBlank()) return "Enter HP password"
        return null
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisBackground)
            .verticalScroll(rememberScrollState())
            .imePadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = "Device",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = AegisOnSurface,
                letterSpacing = 0.sp
            )
            Text(
                text = "This phone is connected for patrol tasks and camera capture.",
                fontSize = 12.sp,
                color = AegisOnSurfaceVariant
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MiniInfoCard(
                icon = Icons.Default.Cloud,
                title = "Backend",
                value = when {
                    baseUrl.isBlank() -> "Not set"
                    developerMode -> baseUrl
                    else -> "Connected"
                },
                modifier = Modifier.weight(1f)
            )
            MiniInfoCard(
                icon = Icons.Default.People,
                title = "Account",
                value = when {
                    username.isBlank() -> "Not set"
                    developerMode -> username
                    else -> "Patrol"
                },
                modifier = Modifier.weight(1f)
            )
        }

        MiniInfoCard(
            icon = Icons.Default.PhoneAndroid,
            title = "This phone",
            value = "${deviceName.ifBlank { "Android device" }} · ${deviceId.ifBlank { "unknown id" }}",
            modifier = Modifier.fillMaxWidth()
        )

        if (developerMode) {
            OutlinedTextField(
                modifier = Modifier.fillMaxWidth(),
                value = baseUrl,
                onValueChange = { baseUrl = it; urlError = null },
                label = { Text("Backend URL", color = AegisOnSurfaceVariant) },
                placeholder = { Text("http://192.168.2.103:8000") },
                isError = urlError != null,
                supportingText = urlError?.let { { Text(it, color = AegisError) } },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Uri,
                    imeAction = ImeAction.Next
                ),
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
                modifier = Modifier.fillMaxWidth(),
                value = deviceId,
                onValueChange = { deviceId = it },
                label = { Text("Device ID", color = AegisOnSurfaceVariant) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
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
                modifier = Modifier.fillMaxWidth(),
                value = deviceName,
                onValueChange = { deviceName = it },
                label = { Text("Device Name", color = AegisOnSurfaceVariant) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
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
                modifier = Modifier.fillMaxWidth(),
                value = username,
                onValueChange = { username = it },
                label = { Text("Backend account", color = AegisOnSurfaceVariant) },
                placeholder = { Text("operator account") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
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
                modifier = Modifier.fillMaxWidth(),
                value = password,
                onValueChange = { password = it },
                label = { Text("Password", color = AegisOnSurfaceVariant) },
                placeholder = {
                    if (uiState.username.isNotBlank()) Text("Leave blank to keep saved password")
                },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done
                ),
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

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
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
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Check server", fontSize = 12.sp)
                }
                Button(
                    onClick = {
                        val err = validateUrl(baseUrl)
                        if (err != null) { urlError = err; return@Button }
                        val credErr = validateCredentials()
                        if (credErr != null) { urlError = credErr; return@Button }
                        viewModel.saveAndRegister(baseUrl, deviceId, deviceName, username, password)
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AegisPrimary,
                        contentColor = AegisOnPrimary
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Save and connect", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            when (val status = uiState.connectionStatus) {
                is SettingsUiState.ConnectionStatus.Testing ->
                    Text("Checking backend...", color = AegisOnSurfaceVariant, fontSize = 14.sp)
                is SettingsUiState.ConnectionStatus.Success ->
                    Text(status.msg, color = AegisPrimary, fontSize = 14.sp)
                is SettingsUiState.ConnectionStatus.Error ->
                    Text(status.msg, color = AegisError, fontSize = 14.sp)
                is SettingsUiState.ConnectionStatus.Idle -> {}
            }
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
                    "Connected as ${uiState.deviceId}",
                    color = AegisPrimary,
                    fontSize = 14.sp
                )
            }
        }

        if (developerMode) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(AegisSurfaceContainerLow)
                    .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Developer mode", color = AegisOnSurface, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Text(
                        "Advanced device setup is visible. Use ROI editing only when installing or realigning the camera.",
                        color = AegisOnSurfaceVariant,
                        fontSize = 12.sp
                    )
                    Button(
                        onClick = { navController.navigate("calibration") },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AegisSurfaceContainerHigh,
                            contentColor = AegisOnSurface
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Edit ROI", fontSize = 12.sp)
                    }
                }
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
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Password, contentDescription = null, tint = AegisOnSurfaceVariant)
                    Text("Local account is for the backend, not the phone.", fontSize = 12.sp, color = AegisOnSurfaceVariant)
                }
                Text("Use the account assigned for this device. Role permissions are handled by the backend.", fontSize = 12.sp, color = AegisOnSurfaceVariant)
                Text(
                    "App Version: ${BuildConfig.VERSION_NAME}",
                    fontSize = 14.sp,
                    color = if (developerMode) AegisPrimary else AegisOnSurfaceVariant,
                    modifier = Modifier.clickable {
                        if (!developerMode) {
                            versionTapCount += 1
                            if (versionTapCount >= 7) {
                                developerMode = true
                            }
                        }
                    }
                )
                if (developerMode) {
                    Text("Developer mode enabled", fontSize = 12.sp, color = AegisPrimary)
                }
                Text("Model: ${SettingsStore.MODEL_VERSION_NAME}", fontSize = 14.sp, color = AegisOnSurfaceVariant)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun MiniInfoCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(AegisSurfaceContainerLow)
            .border(1.dp, AegisOutlineVariant.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(icon, contentDescription = null, tint = AegisPrimary)
            Text(title, fontSize = 12.sp, color = AegisOnSurfaceVariant, fontWeight = FontWeight.Medium)
            Text(
                value,
                fontSize = 13.sp,
                color = AegisOnSurface,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
