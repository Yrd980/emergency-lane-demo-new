package com.emergency.lane.data.remote

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.emergency.lane.MainActivity
import com.emergency.lane.R
import com.emergency.lane.data.local.SettingsStore
import kotlinx.coroutines.flow.first
import java.util.concurrent.TimeUnit

class LocalTaskSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val settings = SettingsStore(applicationContext)
        try {
            val baseUrl = settings.baseUrl.first()
            val username = settings.authUsername.first()
            val password = settings.authPassword.first()
            if (baseUrl.isBlank() || username.isBlank() || password.isBlank()) {
                return Result.success()
            }

            val client = HpApiClient(baseUrl)
            val login = client.login(username, password).getOrThrow()
            settings.saveAuthToken(login.token)
            if (login.user.role != "patrol") {
                return Result.success()
            }

            val tasks = client.getTasks(login.token, limit = 20).getOrThrow().items
            val assignedTasks = tasks.filter { it.status == "assigned" }
            val previousIds = settings.notifiedTaskIds.first()
            val currentIds = assignedTasks.map { it.taskId }.toSet()

            assignedTasks
                .filter { it.taskId !in previousIds }
                .forEach { notifyTask(it) }

            settings.saveNotifiedTaskIds(currentIds)
            return Result.success()
        } catch (_: Exception) {
            return Result.success()
        } finally {
            enqueue(applicationContext)
        }
    }

    private fun notifyTask(task: TaskItem) {
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(applicationContext, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            task.taskId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("New patrol task")
            .setContentText("${task.vehicleClass.replaceFirstChar { it.uppercase() }} task from ${task.deviceId}")
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        NotificationManagerCompat.from(applicationContext).notify(task.taskId.hashCode(), notification)
    }

    companion object {
        const val CHANNEL_ID = "patrol_task_dispatch"
        private const val WORK_NAME = "local_task_sync"
        private const val SYNC_INTERVAL_SECONDS = 30L

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<LocalTaskSyncWorker>()
                .setConstraints(constraints)
                .setInitialDelay(SYNC_INTERVAL_SECONDS, TimeUnit.SECONDS)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context)
                .enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request)
        }
    }
}
