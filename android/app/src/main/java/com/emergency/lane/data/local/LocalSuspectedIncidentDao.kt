package com.emergency.lane.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface LocalSuspectedIncidentDao {
    @Query("SELECT * FROM local_suspected_incidents ORDER BY createdAt DESC")
    suspend fun getAll(): List<LocalSuspectedIncidentEntity>

    @Query("SELECT * FROM local_suspected_incidents ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<LocalSuspectedIncidentEntity>>

    @Query("SELECT * FROM local_suspected_incidents WHERE uploadState = :state ORDER BY createdAt DESC")
    suspend fun getByState(state: String): List<LocalSuspectedIncidentEntity>

    @Query("SELECT COUNT(*) FROM local_suspected_incidents WHERE uploadState = :state")
    suspend fun countByState(state: String): Int

    @Query("SELECT * FROM local_suspected_incidents WHERE uploadState IN ('QUEUED', 'FAILED') ORDER BY createdAt ASC")
    suspend fun getPendingUploads(): List<LocalSuspectedIncidentEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(suspectedIncident: LocalSuspectedIncidentEntity)

    @Query("UPDATE local_suspected_incidents SET uploadState = :state, uploadAttempts = uploadAttempts + 1, lastError = :error WHERE suspectedIncidentId = :suspectedIncidentId")
    suspend fun updateState(suspectedIncidentId: String, state: String, error: String = "")

    @Query("UPDATE local_suspected_incidents SET uploadState = :state, lastError = :error WHERE suspectedIncidentId = :suspectedIncidentId")
    suspend fun setState(suspectedIncidentId: String, state: String, error: String = "")

    @Query("UPDATE local_suspected_incidents SET uploadState = 'QUEUED', lastError = '' WHERE suspectedIncidentId = :suspectedIncidentId")
    suspend fun resetToQueued(suspectedIncidentId: String)

    @Query("DELETE FROM local_suspected_incidents WHERE suspectedIncidentId = :suspectedIncidentId")
    suspend fun delete(suspectedIncidentId: String)
}

@Dao
interface EvidenceFileDao {
    @Query("SELECT * FROM evidence_files WHERE suspectedIncidentId = :suspectedIncidentId")
    suspend fun getBySuspectedIncident(suspectedIncidentId: String): List<EvidenceFileEntity>

    @Query("SELECT * FROM evidence_files")
    fun observeAll(): Flow<List<EvidenceFileEntity>>

    @Insert
    suspend fun insert(file: EvidenceFileEntity)

    @Query("UPDATE evidence_files SET uploadState = :state WHERE id = :id")
    suspend fun updateState(id: Long, state: String)

    @Query("DELETE FROM evidence_files WHERE suspectedIncidentId = :suspectedIncidentId")
    suspend fun deleteBySuspectedIncident(suspectedIncidentId: String)
}
