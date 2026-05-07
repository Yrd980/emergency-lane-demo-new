package com.emergency.lane

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.emergency.lane.data.remote.LocalTaskSyncWorker

class EmergencyLaneApp : Application() {
    override fun onCreate() {
        super.onCreate()
        createTaskNotificationChannel()
        LocalTaskSyncWorker.enqueue(this)
    }

    private fun createTaskNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            LocalTaskSyncWorker.CHANNEL_ID,
            "Patrol task dispatch",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Notifications for tasks assigned from the web console"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
}
