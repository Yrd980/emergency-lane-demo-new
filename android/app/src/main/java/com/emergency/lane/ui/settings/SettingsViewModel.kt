package com.emergency.lane.ui.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.DeviceRepository
import com.emergency.lane.data.local.SettingsStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class SettingsUiState(
    val connectionStatus: ConnectionStatus = ConnectionStatus.Idle,
    val isRegistered: Boolean = false,
    val deviceId: String? = null
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
            settings.deviceId.collect { id ->
                if (id.isNotBlank()) _uiState.value = _uiState.value.copy(deviceId = id)
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

    fun saveAndRegister(baseUrl: String, deviceId: String, deviceName: String) {
        viewModelScope.launch {
            settings.saveConfig(baseUrl, deviceId, deviceName)
            repo.register().fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isRegistered = true, connectionStatus = SettingsUiState.ConnectionStatus.Success("已注册: $it"))
                    repo.startHeartbeat()
                },
                onFailure = { _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Error(it.message ?: "注册失败")) }
            )
        }
    }
}
