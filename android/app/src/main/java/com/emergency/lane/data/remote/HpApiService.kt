package com.emergency.lane.data.remote

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface HpApiService {
    @GET("/api/health")
    suspend fun health(): Response<HealthResponse>

    @POST("/api/devices/register")
    suspend fun registerDevice(@Body req: DeviceRegisterRequest): Response<DeviceRegisterResponse>

    @POST("/api/devices/heartbeat")
    suspend fun heartbeat(@Body req: HeartbeatRequest): Response<HeartbeatResponse>

    @POST("/api/events")
    suspend fun createEvent(@Body event: RequestBody): Response<EventCreateResponse>

    @GET("/api/events")
    suspend fun getEvents(
        @Query("status") status: String? = null,
        @Query("limit") limit: Int = 20
    ): Response<EventListResponse>

    @Multipart
    @POST("/api/events/{eventId}/evidence")
    suspend fun uploadEvidence(
        @Path("eventId") eventId: String,
        @Part("evidence_type") evidenceType: RequestBody,
        @Part file: MultipartBody.Part
    ): Response<Unit>
}
