package com.emergency.lane.data.remote

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface HpApiService {
    @POST("/api/auth/login")
    suspend fun login(@Body req: LoginRequest): Response<LoginResponse>

    @GET("/api/health")
    suspend fun health(): Response<HealthResponse>

    @POST("/api/devices/register")
    suspend fun registerDevice(@Body req: DeviceRegisterRequest): Response<DeviceRegisterResponse>

    @POST("/api/devices/heartbeat")
    suspend fun heartbeat(@Body req: HeartbeatRequest): Response<HeartbeatResponse>

    @POST("/api/suspected-incidents")
    suspend fun createSuspectedIncident(@Body suspectedIncident: RequestBody): Response<SuspectedIncidentCreateResponse>

    @GET("/api/suspected-incidents")
    suspend fun getSuspectedIncidents(
        @Query("status") status: String? = null,
        @Query("limit") limit: Int = 20
    ): Response<SuspectedIncidentListResponse>

    @GET("/api/tasks")
    suspend fun getTasks(
        @Header("Authorization") authorization: String,
        @Query("assigned_to_me") assignedToMe: Boolean = true,
        @Query("limit") limit: Int = 20
    ): Response<TaskListResponse>

    @POST("/api/tasks/{taskId}/accept")
    suspend fun acceptTask(
        @Header("Authorization") authorization: String,
        @Path("taskId") taskId: String
    ): Response<TaskItem>

    @POST("/api/tasks/{taskId}/complete")
    suspend fun completeTask(
        @Header("Authorization") authorization: String,
        @Path("taskId") taskId: String,
        @Body req: CompleteTaskRequest
    ): Response<TaskItem>

    @Multipart
    @POST("/api/suspected-incidents/{suspectedIncidentId}/evidence")
    suspend fun uploadEvidence(
        @Path("suspectedIncidentId") suspectedIncidentId: String,
        @Part("evidence_type") evidenceType: RequestBody,
        @Part file: MultipartBody.Part
    ): Response<Unit>
}
