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
        if (url.isBlank()) return "请输入 HP 后端地址"
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return "地址必须以 http:// 或 https:// 开头"
        }
        return null
    }

    fun validateCredentials(): String? {
        if (username.isBlank()) return "请输入 HP 账号"
        if (password.isBlank() && uiState.username.isBlank()) return "请输入 HP 密码"
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
                text = "设备",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = AegisOnSurface,
                letterSpacing = 0.sp
            )
            Text(
                text = "本机用于接收巡查任务与相机采集。",
                fontSize = 12.sp,
                color = AegisOnSurfaceVariant
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MiniInfoCard(
                icon = Icons.Default.Cloud,
                title = "后端",
                value = when {
                    baseUrl.isBlank() -> "未设置"
                    developerMode -> baseUrl
                    else -> "已连接"
                },
                modifier = Modifier.weight(1f)
            )
            MiniInfoCard(
                icon = Icons.Default.People,
                title = "账号",
                value = when {
                    username.isBlank() -> "未设置"
                    developerMode -> username
                    else -> "巡查"
                },
                modifier = Modifier.weight(1f)
            )
        }

        MiniInfoCard(
            icon = Icons.Default.PhoneAndroid,
            title = "本机",
            value = "${deviceName.ifBlank { "Android 设备" }} · ${deviceId.ifBlank { "未知 ID" }}",
            modifier = Modifier.fillMaxWidth()
        )

        if (developerMode) {
            OutlinedTextField(
                modifier = Modifier.fillMaxWidth(),
                value = baseUrl,
                onValueChange = { baseUrl = it; urlError = null },
                label = { Text("后端地址", color = AegisOnSurfaceVariant) },
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
                label = { Text("设备 ID", color = AegisOnSurfaceVariant) },
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
                label = { Text("设备名称", color = AegisOnSurfaceVariant) },
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
                label = { Text("后端账号", color = AegisOnSurfaceVariant) },
                placeholder = { Text("操作员账号") },
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
                label = { Text("密码", color = AegisOnSurfaceVariant) },
                placeholder = {
                    if (uiState.username.isNotBlank()) Text("留空则保留已保存密码")
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
                    Text("检查服务", fontSize = 12.sp)
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
                    Text("保存并连接", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            when (val status = uiState.connectionStatus) {
                is SettingsUiState.ConnectionStatus.Testing ->
                    Text("正在检查后端...", color = AegisOnSurfaceVariant, fontSize = 14.sp)
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
                    Text("开发者模式", color = AegisOnSurface, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Text(
                        "高级设备设置已显示。仅在安装或重新对齐相机时编辑 ROI。",
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
                        Text("编辑 ROI", fontSize = 12.sp)
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
                    Text("本地账号用于后端认证，不是手机系统账号。", fontSize = 12.sp, color = AegisOnSurfaceVariant)
                }
                Text("请使用分配给本设备的账号。角色权限由后端处理。", fontSize = 12.sp, color = AegisOnSurfaceVariant)
                Text(
                    "应用版本：${BuildConfig.VERSION_NAME}",
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
                    Text("开发者模式已启用", fontSize = 12.sp, color = AegisPrimary)
                }
                Text("模型：${SettingsStore.MODEL_VERSION_NAME}", fontSize = 14.sp, color = AegisOnSurfaceVariant)
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
