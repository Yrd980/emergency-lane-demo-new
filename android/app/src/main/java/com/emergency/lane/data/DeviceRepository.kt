package com.emergency.lane.data

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import com.emergency.lane.BuildConfig
import com.emergency.lane.data.local.SuspectedIncidentQueueRepository
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.data.remote.DeviceRegisterRequest
import com.emergency.lane.data.remote.HeartbeatRequest
import com.emergency.lane.data.remote.HpApiClient
import com.emergency.lane.domain.RuntimeMetrics
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first

class DeviceRepository(private val context: Context) {
    private val settings = SettingsStore(context)
    private val queue = SuspectedIncidentQueueRepository(context)
    private var apiClient: HpApiClient? = null
    private var isRunning = false

    suspend fun testConnection(baseUrl: String): Result<String> {
        return try {
            val client = HpApiClient(baseUrl)
            val resp = client.api.health()
            if (resp.isSuccessful && resp.body()?.status == "ok") {
                Result.success("连接成功")
            } else {
                Result.failure(Exception("状态码: ${resp.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(): Result<String> {
        val baseUrl = settings.baseUrl.first()
        val deviceId = settings.deviceId.first()
        val deviceName = settings.deviceName.first()
        if (baseUrl.isBlank()) return Result.failure(Exception("HP 地址未配置"))

        apiClient = HpApiClient(baseUrl)
        return try {
            val resp = apiClient!!.api.registerDevice(
                DeviceRegisterRequest(
                    deviceId,
                    deviceName,
                    BuildConfig.VERSION_NAME,
                    SettingsStore.MODEL_VERSION_NAME
                )
            )
            if (resp.isSuccessful) Result.success(deviceId)
            else Result.failure(Exception("注册失败: ${resp.code()}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun startHeartbeat(
        intervalMs: Long = 10_000,
        fpsProvider: () -> Float = { RuntimeMetrics.fps },
        pendingProvider: suspend () -> Int = { queue.getPendingCount() }
    ) {
        isRunning = true
        while (isRunning) {
            try {
                val deviceId = settings.deviceId.first()
                currentClient()?.api?.heartbeat(
                    HeartbeatRequest(
                        deviceId = deviceId,
                        batteryLevel = currentBatteryPercent(),
                        thermalState = currentThermalState(),
                        fps = fpsProvider(),
                        pendingUploadCount = pendingProvider()
                    )
                )
            } catch (_: Exception) {}
            delay(intervalMs)
        }
    }

    suspend fun sendHeartbeatOnce(
        fpsProvider: () -> Float = { RuntimeMetrics.fps },
        pendingProvider: suspend () -> Int = { queue.getPendingCount() }
    ): Result<Unit> {
        val baseUrl = settings.baseUrl.first()
        val deviceId = settings.deviceId.first()
        if (baseUrl.isBlank()) return Result.failure(Exception("HP 地址未配置"))
        return try {
            HpApiClient(baseUrl).api.heartbeat(
                HeartbeatRequest(
                    deviceId = deviceId,
                    batteryLevel = currentBatteryPercent(),
                    thermalState = currentThermalState(),
                    fps = fpsProvider(),
                    pendingUploadCount = pendingProvider()
                )
            )
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun stopHeartbeat() { isRunning = false }

    private suspend fun currentClient(): HpApiClient? {
        val existing = apiClient
        if (existing != null) return existing
        val baseUrl = settings.baseUrl.first()
        if (baseUrl.isBlank()) return null
        return HpApiClient(baseUrl).also { apiClient = it }
    }

    private fun currentBatteryPercent(): Float {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            ?: return -1f
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        if (level < 0 || scale <= 0) return -1f
        return level * 100f / scale
    }

    private fun currentThermalState(): String {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            ?: return "unknown"
        return when (intent.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_UNKNOWN)) {
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> "overheat"
            BatteryManager.BATTERY_HEALTH_COLD -> "cold"
            BatteryManager.BATTERY_HEALTH_GOOD -> "normal"
            else -> "unknown"
        }
    }
}
