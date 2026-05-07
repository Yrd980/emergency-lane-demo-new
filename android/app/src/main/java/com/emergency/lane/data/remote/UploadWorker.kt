package com.emergency.lane.data.remote

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.emergency.lane.data.DeviceRepository
import com.emergency.lane.data.local.EventQueueRepository
import java.util.concurrent.TimeUnit

class UploadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val repo = UploadRepository(applicationContext)
        val uploaded = repo.uploadPendingEvents()
        val queue = EventQueueRepository(applicationContext)
        DeviceRepository(applicationContext).sendHeartbeatOnce(
            pendingProvider = { queue.getPendingCount() }
        )
        return if (uploaded > 0 || queue.getPendingCount() == 0) Result.success() else Result.retry()
    }

    companion object {
        private const val WORK_NAME = "event_upload"

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<UploadWorker>()
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context)
                .enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request)
        }
    }
}
