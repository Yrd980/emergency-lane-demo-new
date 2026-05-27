package com.emergency.lane.data.remote

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

class HpApiClient(baseUrl: String) {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    private val okHttp = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(baseUrl.trimEnd('/') + "/")
        .client(okHttp)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    val api: HpApiService = retrofit.create(HpApiService::class.java)

    suspend fun login(username: String, password: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(username, password))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(friendlyHttpMessage(response.code(), "Login failed")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTasks(token: String, limit: Int = 20): Result<TaskListResponse> {
        return try {
            val response = api.getTasks("Bearer $token", true, limit)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(friendlyHttpMessage(response.code(), "Failed to fetch tasks")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun acceptTask(token: String, taskId: String): Result<TaskItem> {
        return try {
            val response = api.acceptTask("Bearer $token", taskId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(friendlyHttpMessage(response.code(), "Failed to accept task")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun completeTask(token: String, taskId: String, note: String): Result<TaskItem> {
        return try {
            val response = api.completeTask("Bearer $token", taskId, CompleteTaskRequest(note))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(friendlyHttpMessage(response.code(), "Failed to complete task")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSuspectedIncidents(status: String? = null, limit: Int = 20): Result<SuspectedIncidentListResponse> {
        return try {
            val response = api.getSuspectedIncidents(status, limit)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(friendlyHttpMessage(response.code(), "Failed to fetch suspectedIncidents")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun friendlyHttpMessage(code: Int, fallback: String): String {
        return when (code) {
            401 -> "Login expired or password is wrong. Save the account again."
            403 -> "This account does not have permission for that action."
            404 -> "The requested item no longer exists."
            422 -> "The server cannot apply this action for the current status."
            in 500..599 -> "Backend error $code. Check the server log and retry."
            else -> "$fallback: $code"
        }
    }
}
