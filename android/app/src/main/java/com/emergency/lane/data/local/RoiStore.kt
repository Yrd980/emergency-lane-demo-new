package com.emergency.lane.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.emergency.lane.domain.RoiConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString

private val Context.roiDataStore: DataStore<Preferences> by preferencesDataStore(name = "roi")

class RoiStore(private val context: Context) {
    private val json = Json { ignoreUnknownKeys = true }
    private val roiKey = stringPreferencesKey("roi_config")

    val roiConfig: Flow<RoiConfig?> = context.roiDataStore.data.map { prefs ->
        prefs[roiKey]?.let { json.decodeFromString<RoiConfig>(it) }
    }

    suspend fun save(config: RoiConfig) {
        context.roiDataStore.edit { prefs ->
            prefs[roiKey] = json.encodeToString(config)
        }
    }

    suspend fun clear() {
        context.roiDataStore.edit { it.remove(roiKey) }
    }
}
