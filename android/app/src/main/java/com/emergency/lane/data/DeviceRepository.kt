package com.emergency.lane.data

import android.content.Context
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.data.remote.DeviceRegisterRequest
import com.emergency.lane.data.remote.HeartbeatRequest
import com.emergency.lane.data.remote.HpApiClient
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first

class DeviceRepository(private val context: Context) {
    private val settings = SettingsStore(context)
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
                DeviceRegisterRequest(deviceId, deviceName, "0.1.0", "manual-sim-0.1.0")
            )
            if (resp.isSuccessful) Result.success(deviceId)
            else Result.failure(Exception("注册失败: ${resp.code()}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun startHeartbeat(
        intervalMs: Long = 10_000,
        fpsProvider: () -> Float = { 15f },
        pendingProvider: () -> Int = { 0 }
    ) {
        isRunning = true
        while (isRunning) {
            try {
                val deviceId = settings.deviceId.first()
                apiClient?.api?.heartbeat(
                    HeartbeatRequest(
                        deviceId = deviceId,
                        batteryLevel = 85f,
                        thermalState = "normal",
                        fps = fpsProvider(),
                        pendingUploadCount = pendingProvider()
                    )
                )
            } catch (_: Exception) {}
            delay(intervalMs)
        }
    }

    fun stopHeartbeat() { isRunning = false }
}
