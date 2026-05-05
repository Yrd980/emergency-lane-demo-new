package com.emergency.lane.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
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
    }

    val baseUrl: Flow<String> = context.settingsDs.data.map { it[BASE_URL] ?: "" }
    val deviceId: Flow<String> = context.settingsDs.data.map { it[DEVICE_ID] ?: "vivo_x100_001" }
    val deviceName: Flow<String> = context.settingsDs.data.map { it[DEVICE_NAME] ?: "vivo X100" }

    suspend fun saveConfig(baseUrl: String, deviceId: String, deviceName: String) {
        context.settingsDs.edit {
            it[BASE_URL] = baseUrl.trimEnd('/')
            it[DEVICE_ID] = deviceId
            it[DEVICE_NAME] = deviceName
            it[APP_VERSION] = "0.1.0"
            it[MODEL_VERSION] = "manual-sim-0.1.0"
        }
    }
}
