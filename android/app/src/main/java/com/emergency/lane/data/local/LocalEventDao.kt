package com.emergency.lane.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface LocalEventDao {
    @Query("SELECT * FROM local_events ORDER BY createdAt DESC")
    suspend fun getAll(): List<LocalEventEntity>

    @Query("SELECT * FROM local_events ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<LocalEventEntity>>

    @Query("SELECT * FROM local_events WHERE uploadState = :state ORDER BY createdAt DESC")
    suspend fun getByState(state: String): List<LocalEventEntity>

    @Query("SELECT COUNT(*) FROM local_events WHERE uploadState = :state")
    suspend fun countByState(state: String): Int

    @Query("SELECT * FROM local_events WHERE uploadState IN ('QUEUED', 'FAILED') ORDER BY createdAt ASC")
    suspend fun getPendingUploads(): List<LocalEventEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(event: LocalEventEntity)

    @Query("UPDATE local_events SET uploadState = :state, uploadAttempts = uploadAttempts + 1, lastError = :error WHERE eventId = :eventId")
    suspend fun updateState(eventId: String, state: String, error: String = "")

    @Query("UPDATE local_events SET uploadState = :state, lastError = :error WHERE eventId = :eventId")
    suspend fun setState(eventId: String, state: String, error: String = "")

    @Query("UPDATE local_events SET uploadState = 'QUEUED', lastError = '' WHERE eventId = :eventId")
    suspend fun resetToQueued(eventId: String)

    @Query("DELETE FROM local_events WHERE eventId = :eventId")
    suspend fun delete(eventId: String)
}

@Dao
interface EvidenceFileDao {
    @Query("SELECT * FROM evidence_files WHERE eventId = :eventId")
    suspend fun getByEvent(eventId: String): List<EvidenceFileEntity>

    @Query("SELECT * FROM evidence_files")
    fun observeAll(): Flow<List<EvidenceFileEntity>>

    @Insert
    suspend fun insert(file: EvidenceFileEntity)

    @Query("UPDATE evidence_files SET uploadState = :state WHERE id = :id")
    suspend fun updateState(id: Long, state: String)

    @Query("DELETE FROM evidence_files WHERE eventId = :eventId")
    suspend fun deleteByEvent(eventId: String)
}
