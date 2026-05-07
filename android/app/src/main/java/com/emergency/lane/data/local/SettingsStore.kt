package com.emergency.lane.data.local

import android.content.Context
import android.os.Build
import android.provider.Settings
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDs: DataStore<Preferences> by preferencesDataStore(name = "settings")

class SettingsStore(private val context: Context) {
    companion object {
        val BASE_URL = stringPreferencesKey("base_url")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val DEVICE_NAME = stringPreferencesKey("device_name")
        val APP_VERSION = stringPreferencesKey("app_version")
        val MODEL_VERSION = stringPreferencesKey("model_version")
        val AUTH_TOKEN = stringPreferencesKey("auth_token")
        val AUTH_USERNAME = stringPreferencesKey("auth_username")
        val AUTH_PASSWORD = stringPreferencesKey("auth_password")
        val NOTIFIED_TASK_IDS = stringSetPreferencesKey("notified_task_ids")

        const val MODEL_VERSION_NAME = "yolov8n_vehicle_640x640"
        const val DEFAULT_BACKEND_URL = "http://192.168.2.103:8000"
        const val DEFAULT_PATROL_USERNAME = "patrol"
        const val DEFAULT_PATROL_PASSWORD = "patrol123"
    }

    val baseUrl: Flow<String> = context.settingsDs.data.map { it[BASE_URL] ?: "" }
    val deviceId: Flow<String> = context.settingsDs.data.map { it[DEVICE_ID] ?: defaultDeviceId() }
    val deviceName: Flow<String> = context.settingsDs.data.map { it[DEVICE_NAME] ?: defaultDeviceName() }
    val authToken: Flow<String> = context.settingsDs.data.map { it[AUTH_TOKEN] ?: "" }
    val authUsername: Flow<String> = context.settingsDs.data.map { it[AUTH_USERNAME] ?: "" }
    val authPassword: Flow<String> = context.settingsDs.data.map { it[AUTH_PASSWORD] ?: "" }
    val notifiedTaskIds: Flow<Set<String>> = context.settingsDs.data.map { it[NOTIFIED_TASK_IDS] ?: emptySet() }

    suspend fun saveConfig(
        baseUrl: String,
        deviceId: String,
        deviceName: String,
        username: String,
        password: String
    ) {
        context.settingsDs.edit {
            it[BASE_URL] = baseUrl.trimEnd('/')
            it[DEVICE_ID] = deviceId
            it[DEVICE_NAME] = deviceName
            it[AUTH_USERNAME] = username
            it[AUTH_PASSWORD] = password
            it.remove(AUTH_TOKEN)
        }
    }

    suspend fun saveAuthToken(token: String) {
        context.settingsDs.edit {
            it[AUTH_TOKEN] = token
        }
    }

    suspend fun saveNotifiedTaskIds(taskIds: Set<String>) {
        context.settingsDs.edit {
            it[NOTIFIED_TASK_IDS] = taskIds
        }
    }

    private fun defaultDeviceId(): String {
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        return "android_${androidId ?: Build.MODEL}".lowercase()
    }

    private fun defaultDeviceName(): String {
        return listOf(Build.MANUFACTURER, Build.MODEL)
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .ifBlank { "Android patrol device" }
    }
}
