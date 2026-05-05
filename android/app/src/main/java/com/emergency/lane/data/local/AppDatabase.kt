package com.emergency.lane.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Room
import androidx.room.RoomDatabase

@Entity(tableName = "local_events")
data class LocalEventEntity(
    @PrimaryKey val eventId: String,
    val deviceId: String,
    val startTime: String,
    val endTime: String,
    val durationSeconds: Double,
    val roiId: String,
    val trackId: String,
    val vehicleClass: String,
    val vehicleBoxJson: String,
    val confidence: Double,
    val gpsJson: String,
    val uploadState: String = "QUEUED",
    val uploadAttempts: Int = 0,
    val lastError: String = "",
    val createdAt: String = ""
)

@Entity(tableName = "evidence_files")
data class EvidenceFileEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val eventId: String,
    val evidenceType: String,
    val localPath: String,
    val mimeType: String,
    val uploadState: String = "QUEUED"
)

@Database(entities = [LocalEventEntity::class, EvidenceFileEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun localEventDao(): LocalEventDao
    abstract fun evidenceFileDao(): EvidenceFileDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null
        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(context, AppDatabase::class.java, "event_queue.db")
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
