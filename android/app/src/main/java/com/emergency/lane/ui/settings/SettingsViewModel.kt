package com.emergency.lane.ui.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.BuildConfig
import com.emergency.lane.data.DeviceRepository
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.data.remote.DeviceRegisterRequest
import com.emergency.lane.data.remote.HpApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class SettingsUiState(
    val baseUrl: String = "",
    val deviceName: String = "",
    val username: String = "",
    val connectionStatus: ConnectionStatus = ConnectionStatus.Idle,
    val isRegistered: Boolean = false,
    val deviceId: String = ""
) {
    sealed class ConnectionStatus {
        object Idle : ConnectionStatus()
        object Testing : ConnectionStatus()
        data class Success(val msg: String) : ConnectionStatus()
        data class Error(val msg: String) : ConnectionStatus()
    }
}

class SettingsViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = DeviceRepository(application)
    private val settings = SettingsStore(application)
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState

    init {
        viewModelScope.launch {
            combine(
                settings.baseUrl,
                settings.deviceId,
                settings.deviceName,
                settings.authUsername
            ) { baseUrl, deviceId, deviceName, username ->
                ConfigFields(baseUrl, deviceId, deviceName, username)
            }.collect { config ->
                _uiState.value = _uiState.value.copy(
                    baseUrl = config.baseUrl,
                    deviceId = config.deviceId,
                    deviceName = config.deviceName,
                    username = config.username
                )
            }
        }
    }

    fun testConnection(baseUrl: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Testing)
            repo.testConnection(baseUrl).fold(
                onSuccess = { _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Success(it)) },
                onFailure = { _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Error(it.message ?: "Unknown")) }
            )
        }
    }

    fun saveAndRegister(
        baseUrl: String,
        deviceId: String,
        deviceName: String,
        username: String,
        password: String
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Testing)
            val savedPassword = settings.authPassword.first()
            val actualPassword = password.ifBlank { savedPassword }
            if (baseUrl.isBlank() || username.isBlank() || actualPassword.isBlank()) {
                _uiState.value = _uiState.value.copy(
                    connectionStatus = SettingsUiState.ConnectionStatus.Error("Backend, account, and password are required.")
                )
                return@launch
            }

            val client = HpApiClient(baseUrl)
            val login = client.login(username, actualPassword).getOrElse {
                _uiState.value = _uiState.value.copy(
                    connectionStatus = SettingsUiState.ConnectionStatus.Error(it.message ?: "Login failed")
                )
                return@launch
            }

            val registerResponse = try {
                client.api.registerDevice(
                    "Bearer ${login.token}",
                    DeviceRegisterRequest(
                        deviceId = deviceId,
                        deviceName = deviceName,
                        appVersion = BuildConfig.VERSION_NAME,
                        modelVersion = SettingsStore.MODEL_VERSION_NAME
                    )
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    connectionStatus = SettingsUiState.ConnectionStatus.Error(e.message ?: "Registration failed")
                )
                return@launch
            }

            if (!registerResponse.isSuccessful) {
                _uiState.value = _uiState.value.copy(
                    connectionStatus = SettingsUiState.ConnectionStatus.Error("Registration failed: ${registerResponse.code()}")
                )
                return@launch
            }

            settings.saveConfig(
                baseUrl,
                deviceId,
                deviceName,
                username,
                actualPassword
            )
            settings.saveAuthToken(login.token)
            _uiState.value = _uiState.value.copy(
                isRegistered = true,
                connectionStatus = SettingsUiState.ConnectionStatus.Success("Connected as $deviceId")
            )
            repo.startHeartbeat()
        }
    }
}

private data class ConfigFields(
    val baseUrl: String,
    val deviceId: String,
    val deviceName: String,
    val username: String
)
