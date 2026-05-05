# Phase 3: Android 无模型闭环 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 vivo X100 Android 端跑通无模型闭环：相机预览、ROI 标定、HP 地址配置、设备注册/心跳、手动模拟事件、本地队列、上传与离线补传。

**Architecture:** Jetpack Compose + Material3 UI，MVVM 架构（ViewModels → Repositories → 本地 Room/DataStore + 远端 Retrofit API）。CameraX 提供预览和帧捕获，WorkManager 处理后台上传队列。

**Tech Stack:** Kotlin 2.0 / AGP 8.5 / Compose BOM 2024.12 / CameraX 1.4 / Retrofit 2.11 + OkHttp 4.12 / kotlinx.serialization / Room 2.6 / DataStore 1.1 / WorkManager 2.9 / Coroutines 1.9

**Depends on:** Phase 2 HP 电脑端 API 已可运行。后端默认地址为 `http://<hp-lan-ip>:8000`。

**Out of Scope:** 真实车辆检测模型、自动跟踪、自动占用判定、车牌 OCR、账号权限。

**Android Project Spec:**
- Package name: `com.emergency.lane`
- minSdk: 26 (Android 8.0), targetSdk: 34, compileSdk: 34
- Gradle Kotlin DSL (`settings.gradle.kts`, `build.gradle.kts`)
- Source root: `android/` at repo root

**Key Decisions (locked for this plan):**
| 决策 | 选择 | 理由 |
|---|---|---|
| UI 框架 | Jetpack Compose + Material3 | 2026 标准，vivo X100 完全支持 |
| HTTP 客户端 | Retrofit 2.11 + OkHttp 4.12 | Android 生态标准，kotlinx.serialization 序列化 |
| 本地事件队列 | Room 2.6 | 结构化查询（按状态统计、分页列表） |
| 设置存储 (ROI, HP config) | DataStore 1.1 | 键值对，适合配置项 |
| 后台上传 | WorkManager 2.9 | 系统管理的后台任务，支持网络约束 |
| 架构模式 | MVVM (ViewModel + Repository) | Compose 标准模式 |
| 序列化 | kotlinx.serialization 1.7 | Kotlin 原生，与 Retrofit 集成成熟 |

---

### Task 1: Android 工程基线

**Files:**
- Create: `android/settings.gradle.kts`
- Create: `android/build.gradle.kts`
- Create: `android/app/build.gradle.kts`
- Create: `android/app/src/main/AndroidManifest.xml`
- Create: `android/app/src/main/java/com/emergency/lane/EmergencyLaneApp.kt`
- Create: `android/app/src/main/java/com/emergency/lane/MainActivity.kt`
- Create: `android/gradle.properties`
- Create: `android/gradle/wrapper/gradle-wrapper.properties`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p android/app/src/main/java/com/emergency/lane/{ui/{detection,calibration,queue,settings},data/{local,remote},domain,camera}
mkdir -p android/app/src/main/res/values
mkdir -p android/gradle/wrapper
```

- [ ] **Step 2: 创建 settings.gradle.kts**

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "EmergencyLane"
include(":app")
```

- [ ] **Step 3: 创建根 build.gradle.kts**

```kotlin
plugins {
    id("com.android.application") version "8.5.0" apply false
    id("org.jetbrains.kotlin.android") version "2.0.0" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "2.0.0" apply false
    id("com.google.devtools.ksp") version "2.0.0-1.0.22" apply false
}
```

- [ ] **Step 4: 创建 app/build.gradle.kts**

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.emergency.lane"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.emergency.lane"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.00")
    implementation(composeBom)
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.4")

    // CameraX
    implementation("androidx.camera:camera-core:1.4.1")
    implementation("androidx.camera:camera-camera2:1.4.1")
    implementation("androidx.camera:camera-lifecycle:1.4.1")
    implementation("androidx.camera:camera-view:1.4.1")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("com.jakewharton.retrofit:retrofit2-kotlinx-serialization-converter:1.0.0")

    // Local storage
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Background work
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    testImplementation("io.mockk:mockk:1.13.13")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
}
```

- [ ] **Step 5: 创建 AndroidManifest.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <uses-feature android:name="android.hardware.camera" android:required="true" />

    <application
        android:name=".EmergencyLaneApp"
        android:allowBackup="true"
        android:label="Emergency Lane"
        android:supportsRtl="true"
        android:theme="@style/Theme.EmergencyLane"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="landscape">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

- [ ] **Step 6: 创建 Application 和 MainActivity**

`EmergencyLaneApp.kt`:
```kotlin
package com.emergency.lane

import android.app.Application

class EmergencyLaneApp : Application()
```

`MainActivity.kt`:
```kotlin
package com.emergency.lane

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.emergency.lane.ui.EmergencyLaneNavHost

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    EmergencyLaneNavHost()
                }
            }
        }
    }
}
```

- [ ] **Step 7: 创建基础 theme 和导航骨架**

`res/values/themes.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.EmergencyLane" parent="android:Theme.Material.Light.NoActionBar" />
</resources>
```

`ui/EmergencyLaneNavHost.kt`:
```kotlin
package com.emergency.lane.ui

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.emergency.lane.ui.detection.DetectionScreen
import com.emergency.lane.ui.calibration.CalibrationScreen
import com.emergency.lane.ui.queue.QueueScreen
import com.emergency.lane.ui.settings.SettingsScreen

@Composable
fun EmergencyLaneNavHost() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "detection") {
        composable("detection") { DetectionScreen(navController) }
        composable("calibration") { CalibrationScreen(navController) }
        composable("queue") { QueueScreen(navController) }
        composable("settings") { SettingsScreen(navController) }
    }
}
```

- [ ] **Step 8: 创建 gradle.properties**

```
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
org.gradle.jvmargs=-Xmx2048m
```

- [ ] **Step 9: 验证构建**

```bash
cd android
./gradlew assembleDebug
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 10: Commit**

```bash
git add android/
git commit -m "feat(android): create project skeleton with Compose, CameraX, Retrofit, Room"
```

---

### Task 2: 相机预览

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/camera/CameraController.kt`
- Create: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionScreen.kt`
- Create: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionViewModel.kt`

- [ ] **Step 1: 实现 CameraController**

```kotlin
package com.emergency.lane.camera

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class CameraController(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner
) {
    private var imageCapture: ImageCapture? = null
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    fun startCamera(previewView: PreviewView) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                .setTargetResolution(Size(1280, 720))
                .build()

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner, cameraSelector, preview, imageCapture
                )
            } catch (_: Exception) {}
        }, ContextCompat.getMainExecutor(context))
    }

    suspend fun captureFrame(): Bitmap = suspendCancellableCoroutine { cont ->
        val capture = imageCapture ?: run {
            cont.resumeWithException(IllegalStateException("Camera not started"))
            return@suspendCancellableCoroutine
        }
        capture.takePicture(
            ContextCompat.getMainExecutor(context),
            object : ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(bitmap: Bitmap) {
                    val matrix = Matrix().apply { postRotate(90f) }
                    val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                    cont.resume(rotated)
                }
                override fun onError(exception: ImageCaptureException) {
                    cont.resumeWithException(exception)
                }
            }
        )
    }

    fun release() {
        cameraExecutor.shutdown()
    }
}
```

- [ ] **Step 2: 实现 DetectionViewModel**

```kotlin
package com.emergency.lane.ui.detection

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.camera.CameraController
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class DetectionUiState(
    val isPreviewActive: Boolean = false,
    val lastEventId: String? = null,
    val pendingUploadCount: Int = 0,
    val cameraError: String? = null
)

class DetectionViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(DetectionUiState())
    val uiState: StateFlow<DetectionUiState> = _uiState

    var cameraController: CameraController? = null

    fun startPreview() { _uiState.value = _uiState.value.copy(isPreviewActive = true) }
    fun stopPreview() { _uiState.value = _uiState.value.copy(isPreviewActive = false) }

    fun onCameraError(msg: String) {
        _uiState.value = _uiState.value.copy(cameraError = msg)
    }
    fun clearCameraError() { _uiState.value = _uiState.value.copy(cameraError = null) }
}
```

- [ ] **Step 3: 实现 DetectionScreen**

```kotlin
package com.emergency.lane.ui.detection

import android.Manifest
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.emergency.lane.camera.CameraController

@Composable
fun DetectionScreen(navController: NavController, viewModel: DetectionViewModel = viewModel()) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uiState by viewModel.uiState.collectAsState()

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) {
            viewModel.onCameraError("相机权限未授权，请在系统设置中开启")
        }
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Camera preview
        Box(modifier = Modifier.weight(1f)) {
            if (uiState.isPreviewActive) {
                AndroidView(
                    factory = { ctx ->
                        PreviewView(ctx).also { previewView ->
                            val controller = CameraController(context, lifecycleOwner)
                            controller.startCamera(previewView)
                            viewModel.cameraController = controller
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else if (uiState.cameraError != null) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(uiState.cameraError!!, color = MaterialTheme.colorScheme.error)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) }) {
                        Text("重新授权")
                    }
                }
            }
        }

        // Controls
        Row(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(onClick = { viewModel.startPreview() }) { Text("开始预览") }
            Button(onClick = { viewModel.stopPreview() }) { Text("停止预览") }
            Button(onClick = { navController.navigate("calibration") }) { Text("ROI 标定") }
        }

        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
            Button(onClick = { /* Task 6: generate manual event */ }) { Text("生成模拟事件") }
            Spacer(modifier = Modifier.weight(1f))
            Button(onClick = { navController.navigate("settings") }) { Text("设置") }
            Button(onClick = { navController.navigate("queue") }) { Text("队列") }
        }

        // Status bar
        if (uiState.lastEventId != null) {
            Text("最近事件: ${uiState.lastEventId}", modifier = Modifier.padding(8.dp))
        }
    }
}
```

- [ ] **Step 4: 验证**

在 vivo X100 上运行 App，确认：预览画面不拉伸、方向正确、停止/恢复预览正常。

- [ ] **Step 5: Commit**

```bash
git add android/
git commit -m "feat(android): add CameraX preview and detection screen"
```

---

### Task 3: ROI 标定

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/domain/RoiConfig.kt`
- Create: `android/app/src/main/java/com/emergency/lane/data/local/RoiStore.kt`
- Create: `android/app/src/main/java/com/emergency/lane/ui/calibration/CalibrationScreen.kt`
- Create: `android/app/src/main/java/com/emergency/lane/ui/calibration/CalibrationViewModel.kt`

- [ ] **Step 1: 定义 ROI 数据模型**

```kotlin
package com.emergency.lane.domain

import kotlinx.serialization.Serializable

@Serializable
data class RoiPoint(val x: Float, val y: Float)

@Serializable
data class RoiConfig(
    val roiId: String = "roi_default",
    val frameWidth: Int = 1280,
    val frameHeight: Int = 720,
    val points: List<RoiPoint> = emptyList(),
    val updatedAt: String = ""
)

fun RoiConfig.isValid(): Boolean = points.size >= 4
```

- [ ] **Step 2: 实现 RoiStore（DataStore 持久化）**

```kotlin
package com.emergency.lane.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.emergency.lane.domain.RoiConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString

private val Context.roiDataStore: DataStore<Preferences> by preferencesDataStore(name = "roi")

class RoiStore(private val context: Context) {
    private val json = Json { ignoreUnknownKeys = true }
    private val roiKey = stringPreferencesKey("roi_config")

    val roiConfig: Flow<RoiConfig?> = context.roiDataStore.data.map { prefs ->
        prefs[roiKey]?.let { json.decodeFromString<RoiConfig>(it) }
    }

    suspend fun save(config: RoiConfig) {
        context.roiDataStore.edit { prefs ->
            prefs[roiKey] = json.encodeToString(config)
        }
    }

    suspend fun clear() {
        context.roiDataStore.edit { it.remove(roiKey) }
    }
}
```

- [ ] **Step 3: 实现 CalibrationViewModel**

```kotlin
package com.emergency.lane.ui.calibration

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.local.RoiStore
import com.emergency.lane.domain.RoiConfig
import com.emergency.lane.domain.RoiPoint
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class CalibrationUiState(
    val points: List<RoiPoint> = emptyList(),
    val isSaved: Boolean = false,
    val message: String? = null
)

class CalibrationViewModel(application: Application) : AndroidViewModel(application) {
    private val roiStore = RoiStore(application)
    private val _uiState = MutableStateFlow(CalibrationUiState())
    val uiState: StateFlow<CalibrationUiState> = _uiState

    init {
        viewModelScope.launch {
            roiStore.roiConfig.collect { config ->
                if (config != null && config.points.isNotEmpty()) {
                    _uiState.value = _uiState.value.copy(points = config.points, isSaved = true)
                }
            }
        }
    }

    fun addPoint(x: Float, y: Float) {
        _uiState.value = _uiState.value.copy(
            points = _uiState.value.points + RoiPoint(x, y),
            isSaved = false,
            message = null
        )
    }

    fun undoLastPoint() {
        val pts = _uiState.value.points
        if (pts.isNotEmpty()) {
            _uiState.value = _uiState.value.copy(
                points = pts.dropLast(1),
                isSaved = false
            )
        }
    }

    fun clearAll() {
        _uiState.value = _uiState.value.copy(points = emptyList(), isSaved = false)
    }

    fun save() {
        val config = RoiConfig(
            points = _uiState.value.points,
            updatedAt = java.time.Instant.now().toString()
        )
        viewModelScope.launch {
            if (config.isValid()) {
                roiStore.save(config)
                _uiState.value = _uiState.value.copy(isSaved = true, message = "ROI 已保存 (${config.points.size} 点)")
            } else {
                _uiState.value = _uiState.value.copy(message = "至少需要 4 个点才能保存")
            }
        }
    }

    fun resetRoi() {
        viewModelScope.launch {
            roiStore.clear()
            _uiState.value = CalibrationUiState()
        }
    }
}
```

- [ ] **Step 4: 实现 CalibrationScreen（触控点选 + 多边形绘制）**

```kotlin
package com.emergency.lane.ui.calibration

import android.view.MotionEvent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController

@Composable
fun CalibrationScreen(
    navController: NavController,
    viewModel: CalibrationViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        // Drawing area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Color.DarkGray)
                .pointerInput(Unit) {
                    detectTapGestures { offset ->
                        viewModel.addPoint(offset.x, offset.y)
                    }
                }
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                // Draw polygon edges
                if (uiState.points.size >= 2) {
                    val path = Path().apply {
                        moveTo(uiState.points.first().x, uiState.points.first().y)
                        uiState.points.drop(1).forEach { p -> lineTo(p.x, p.y) }
                        if (uiState.points.size >= 3) close()
                    }
                    drawPath(path, Color.Cyan, style = Stroke(width = 4f, cap = StrokeCap.Round))
                }
                // Draw points
                uiState.points.forEach { p ->
                    drawCircle(Color.Yellow, radius = 12f, center = Offset(p.x, p.y))
                    drawCircle(Color.Black, radius = 10f, center = Offset(p.x, p.y))
                    drawCircle(Color.Yellow, radius = 6f, center = Offset(p.x, p.y))
                }
            }
        }

        // Controls
        Row(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.save() },
                enabled = uiState.points.size >= 4
            ) { Text("保存 (${uiState.points.size} 点)") }
            Button(onClick = { viewModel.undoLastPoint() }) { Text("撤销") }
            Button(onClick = { viewModel.clearAll() }) { Text("清空") }
            Button(onClick = { viewModel.resetRoi() }) { Text("重置") }
            Button(onClick = { navController.popBackStack() }) { Text("返回") }
        }

        uiState.message?.let {
            Text(it, modifier = Modifier.padding(8.dp))
        }
    }
}
```

- [ ] **Step 5: 验证**

新增 → 撤销 → 清空 → 4 点保存 → 退出重进恢复 → 重开 App 仍保留。

- [ ] **Step 6: Commit**

```bash
git add android/
git commit -m "feat(android): add ROI calibration with DataStore persistence"
```

---

### Task 4: HP 连接设置与设备注册

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/data/remote/HpApiClient.kt`
- Create: `android/app/src/main/java/com/emergency/lane/data/remote/ApiModels.kt`
- Create: `android/app/src/main/java/com/emergency/lane/data/local/SettingsStore.kt`
- Create: `android/app/src/main/java/com/emergency/lane/data/DeviceRepository.kt`
- Create: `android/app/src/main/java/com/emergency/lane/ui/settings/SettingsScreen.kt`
- Create: `android/app/src/main/java/com/emergency/lane/ui/settings/SettingsViewModel.kt`

- [ ] **Step 1: 定义 API 请求/响应模型**

```kotlin
package com.emergency.lane.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class HealthResponse(val status: String)

@Serializable
data class DeviceRegisterRequest(
    @SerialName("device_id") val deviceId: String,
    @SerialName("device_name") val deviceName: String,
    @SerialName("app_version") val appVersion: String,
    @SerialName("model_version") val modelVersion: String
)

@Serializable
data class DeviceRegisterResponse(
    @SerialName("device_id") val deviceId: String,
    val registered: Boolean
)

@Serializable
data class HeartbeatRequest(
    @SerialName("device_id") val deviceId: String,
    @SerialName("battery_level") val batteryLevel: Float,
    @SerialName("thermal_state") val thermalState: String,
    val fps: Float,
    @SerialName("pending_upload_count") val pendingUploadCount: Int
)

@Serializable
data class HeartbeatResponse(val status: String, @SerialName("device_id") val deviceId: String)

@Serializable
data class EventCreateResponse(
    @SerialName("event_id") val eventId: String,
    val accepted: Boolean,
    val duplicate: Boolean = false
)
```

- [ ] **Step 2: 创建 Retrofit API 接口**

```kotlin
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

    @Multipart
    @POST("/api/events/{eventId}/evidence")
    suspend fun uploadEvidence(
        @Path("eventId") eventId: String,
        @Part("evidence_type") evidenceType: RequestBody,
        @Part file: MultipartBody.Part
    ): Response<Unit>
}
```

- [ ] **Step 3: 实现 HpApiClient（Retrofit 工厂）**

```kotlin
package com.emergency.lane.data.remote

import kotlinx.serialization.json.Json
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
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
}
```

- [ ] **Step 4: 实现 SettingsStore（DataStore 存储 HP 配置）**

```kotlin
package com.emergency.lane.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDs: androidx.datastore.core.DataStore<androidx.datastore.preferences.core.Preferences>
        by preferencesDataStore(name = "settings")

class SettingsStore(private val context: Context) {
    companion object {
        val BASE_URL = stringPreferencesKey("base_url")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val DEVICE_NAME = stringPreferencesKey("device_name")
        val APP_VERSION = stringPreferencesKey("app_version")
        val MODEL_VERSION = stringPreferencesKey("model_version")
    }

    val baseUrl: Flow<String> = context.settingsDs.data.map { it[BASE_URL] ?: "" }
    val deviceId: Flow<String> = context.settingsDs.data.map { it[DEVICE_ID] ?: "vivo_x100_001" }
    val deviceName: Flow<String> = context.settingsDs.data.map { it[DEVICE_NAME] ?: "vivo X100" }

    suspend fun saveConfig(baseUrl: String, deviceId: String, deviceName: String) {
        context.settingsDs.edit {
            it[BASE_URL] = baseUrl.trimEnd('/')
            it[DEVICE_ID] = deviceId
            it[DEVICE_NAME] = deviceName
            it[APP_VERSION] = "0.1.0"
            it[MODEL_VERSION] = "manual-sim-0.1.0"
        }
    }
}
```

- [ ] **Step 5: 实现 DeviceRepository（注册 + 心跳）**

```kotlin
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

    suspend fun startHeartbeat(intervalMs: Long = 10_000) {
        isRunning = true
        while (isRunning) {
            try {
                val deviceId = settings.deviceId.first()
                apiClient?.api?.heartbeat(
                    HeartbeatRequest(
                        deviceId = deviceId,
                        batteryLevel = 85f,    // placeholder; integrate BatteryManager
                        thermalState = "normal",
                        fps = 15f,
                        pendingUploadCount = 0  // updated by queue
                    )
                )
            } catch (_: Exception) {}
            delay(intervalMs)
        }
    }

    fun stopHeartbeat() { isRunning = false }
}
```

- [ ] **Step 6: 实现 SettingsScreen**

```kotlin
package com.emergency.lane.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController

@Composable
fun SettingsScreen(
    navController: NavController,
    viewModel: SettingsViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var baseUrl by remember { mutableStateOf("http://192.168.1.20:8000") }
    var deviceId by remember { mutableStateOf("vivo_x100_001") }
    var deviceName by remember { mutableStateOf("vivo X100") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("HP 连接设置", style = MaterialTheme.typography.headlineSmall)

        OutlinedTextField(value = baseUrl, onValueChange = { baseUrl = it }, label = { Text("HP Base URL") })
        OutlinedTextField(value = deviceId, onValueChange = { deviceId = it }, label = { Text("设备 ID") })
        OutlinedTextField(value = deviceName, onValueChange = { deviceName = it }, label = { Text("设备名称") })

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { viewModel.testConnection(baseUrl) }) { Text("测试连接") }
            Button(onClick = { viewModel.saveAndRegister(baseUrl, deviceId, deviceName) }) { Text("保存并注册") }
        }

        when (val status = uiState.connectionStatus) {
            is SettingsUiState.ConnectionStatus.Testing -> Text("测试中...")
            is SettingsUiState.ConnectionStatus.Success -> Text(status.msg, color = MaterialTheme.colorScheme.primary)
            is SettingsUiState.ConnectionStatus.Error -> Text(status.msg, color = MaterialTheme.colorScheme.error)
            is SettingsUiState.ConnectionStatus.Idle -> {}
        }

        if (uiState.isRegistered) {
            Text("已注册: ${uiState.deviceId}", color = MaterialTheme.colorScheme.primary)
        }

        Text("App 版本: 0.1.0", style = MaterialTheme.typography.bodySmall)
        Text("模型版本: manual-sim-0.1.0", style = MaterialTheme.typography.bodySmall)

        Button(onClick = { navController.popBackStack() }) { Text("返回") }
    }
}
```

- [ ] **Step 7: 实现 SettingsViewModel**

```kotlin
package com.emergency.lane.ui.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.emergency.lane.data.DeviceRepository
import com.emergency.lane.data.local.SettingsStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class SettingsUiState(
    val connectionStatus: ConnectionStatus = ConnectionStatus.Idle,
    val isRegistered: Boolean = false,
    val deviceId: String? = null
) {
    sealed class ConnectionStatus {
        object Idle : ConnectionStatus()
        object Testing : ConnectionStatus()
        data class Success(val msg: String) : ConnectionStatus()
        data class Error(val msg: String) : ConnectionStatus()
    }
}

class SettingsViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = DeviceRepository(application)
    private val settings = SettingsStore(application)
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState

    init {
        viewModelScope.launch {
            settings.deviceId.collect { id ->
                if (id.isNotBlank()) _uiState.value = _uiState.value.copy(deviceId = id)
            }
        }
    }

    fun testConnection(baseUrl: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Testing)
            repo.testConnection(baseUrl).fold(
                onSuccess = { _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Success(it)) },
                onFailure = { _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Error(it.message ?: "Unknown")) }
            )
        }
    }

    fun saveAndRegister(baseUrl: String, deviceId: String, deviceName: String) {
        viewModelScope.launch {
            settings.saveConfig(baseUrl, deviceId, deviceName)
            repo.register().fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isRegistered = true, connectionStatus = SettingsUiState.ConnectionStatus.Success("已注册: $it")) },
                onFailure = { _uiState.value = _uiState.value.copy(connectionStatus = SettingsUiState.ConnectionStatus.Error(it.message ?: "注册失败")) }
            )
        }
    }
}
```

- [ ] **Step 8: HP Web 验证**

打开 Web `/devices`，确认 vivo X100 可见且 `is_online: true`。

- [ ] **Step 9: Commit**

```bash
git add android/
git commit -m "feat(android): add HP connection settings, device registration, and heartbeat"
```

---

### Task 5: 本地事件队列

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/domain/LocalEvent.kt`
- Create: `android/app/src/main/java/com/emergency/lane/domain/UploadState.kt`
- Create: `android/app/src/main/java/com/emergency/lane/data/local/AppDatabase.kt`
- Create: `android/app/src/main/java/com/emergency/lane/data/local/LocalEventDao.kt`
- Create: `android/app/src/main/java/com/emergency/lane/data/local/EventQueueRepository.kt`
- Create: `android/app/src/main/java/com/emergency/lane/ui/queue/QueueScreen.kt`
- Create: `android/app/src/main/java/com/emergency/lane/ui/queue/QueueViewModel.kt`
- Create: `android/app/src/test/java/com/emergency/lane/data/local/EventQueueRepositoryTest.kt`

- [ ] **Step 1: 定义领域模型**

```kotlin
package com.emergency.lane.domain

enum class UploadState { LOCAL_CREATED, QUEUED, UPLOADING, UPLOADED, FAILED }

@Serializable
data class VehicleBox(val x: Float, val y: Float, val width: Float, val height: Float)

@Serializable
data class GpsLocation(val latitude: Double, val longitude: Double)
```

- [ ] **Step 2: 创建 Room Entity 和 DAO**

```kotlin
package com.emergency.lane.data.local

import androidx.room.*
import com.emergency.lane.domain.UploadState

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
    val vehicleBoxJson: String,   // JSON serialized VehicleBox
    val confidence: Double,
    val gpsJson: String,          // JSON serialized GpsLocation or "null"
    val uploadState: String = UploadState.QUEUED.name,
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
    val uploadState: String = UploadState.QUEUED.name
)

@Dao
interface LocalEventDao {
    @Query("SELECT * FROM local_events ORDER BY createdAt DESC")
    suspend fun getAll(): List<LocalEventEntity>

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

    @Query("DELETE FROM local_events WHERE eventId = :eventId")
    suspend fun delete(eventId: String)
}

@Dao
interface EvidenceFileDao {
    @Query("SELECT * FROM evidence_files WHERE eventId = :eventId")
    suspend fun getByEvent(eventId: String): List<EvidenceFileEntity>

    @Insert
    suspend fun insert(file: EvidenceFileEntity)

    @Query("UPDATE evidence_files SET uploadState = :state WHERE id = :id")
    suspend fun updateState(id: Long, state: String)

    @Query("DELETE FROM evidence_files WHERE eventId = :eventId")
    suspend fun deleteByEvent(eventId: String)
}
```

- [ ] **Step 3: 创建 AppDatabase**

```kotlin
package com.emergency.lane.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

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
```

- [ ] **Step 4: 实现 EventQueueRepository**

```kotlin
package com.emergency.lane.data.local

import android.content.Context
import com.emergency.lane.domain.UploadState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

class EventQueueRepository(context: Context) {
    private val db = AppDatabase.getInstance(context)
    private val eventDao = db.localEventDao()
    private val evidenceDao = db.evidenceFileDao()

    private val _pendingCount = MutableStateFlow(0)
    val pendingCount: Flow<Int> = _pendingCount

    suspend fun enqueueEvent(event: LocalEventEntity, evidence: List<EvidenceFileEntity>) {
        eventDao.upsert(event)
        evidence.forEach { evidenceDao.insert(it) }
        refreshPendingCount()
    }

    suspend fun getPendingUploads(): List<LocalEventEntity> = eventDao.getPendingUploads()

    suspend fun getStats(): Map<String, Int> = mapOf(
        "queued" to eventDao.countByState(UploadState.QUEUED.name),
        "uploading" to eventDao.countByState(UploadState.UPLOADING.name),
        "uploaded" to eventDao.countByState(UploadState.UPLOADED.name),
        "failed" to eventDao.countByState(UploadState.FAILED.name),
        "local_created" to eventDao.countByState(UploadState.LOCAL_CREATED.name)
    )

    suspend fun markUploaded(eventId: String) {
        eventDao.updateState(eventId, UploadState.UPLOADED.name)
        evidenceDao.deleteByEvent(eventId)
        refreshPendingCount()
    }

    suspend fun markFailed(eventId: String, error: String) {
        eventDao.updateState(eventId, UploadState.FAILED.name, error)
        refreshPendingCount()
    }

    suspend fun getAll(): List<LocalEventEntity> = eventDao.getAll()

    private suspend fun refreshPendingCount() {
        _pendingCount.value = eventDao.countByState(UploadState.QUEUED.name) +
                              eventDao.countByState(UploadState.FAILED.name)
    }
}
```

- [ ] **Step 5: 写单元测试**

```kotlin
package com.emergency.lane.data.local

import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class EventQueueRepositoryTest {
    private lateinit var db: AppDatabase
    private lateinit var repo: EventQueueRepository

    @Before
    fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).build()
        repo = EventQueueRepository(ApplicationProvider.getApplicationContext())
    }

    @After
    fun teardown() { db.close() }

    @Test
    fun `enqueue event transitions to queued state`() = runTest {
        val event = LocalEventEntity(
            eventId = "evt_test_001", deviceId = "test", startTime = "", endTime = "",
            durationSeconds = 12.0, roiId = "roi_default", trackId = "manual_001",
            vehicleClass = "car", vehicleBoxJson = "{}", confidence = 0.86,
            gpsJson = "null", createdAt = ""
        )
        repo.enqueueEvent(event, emptyList())
        val events = repo.getAll()
        assertEquals(1, events.size)
        assertEquals("QUEUED", events.first().uploadState)
    }

    @Test
    fun `markFailed sets error message`() = runTest {
        val event = LocalEventEntity(
            eventId = "evt_test_002", deviceId = "test", startTime = "", endTime = "",
            durationSeconds = 12.0, roiId = "roi_default", trackId = "manual_002",
            vehicleClass = "car", vehicleBoxJson = "{}", confidence = 0.86,
            gpsJson = "null", createdAt = ""
        )
        repo.enqueueEvent(event, emptyList())
        repo.markFailed("evt_test_002", "Network timeout")
        val events = repo.getAll()
        assertEquals("FAILED", events.first().uploadState)
        assertEquals("Network timeout", events.first().lastError)
    }

    @Test
    fun `markUploaded removes from pending`() = runTest {
        val event = LocalEventEntity(
            eventId = "evt_test_003", deviceId = "test", startTime = "", endTime = "",
            durationSeconds = 12.0, roiId = "roi_default", trackId = "manual_003",
            vehicleClass = "car", vehicleBoxJson = "{}", confidence = 0.86,
            gpsJson = "null", createdAt = ""
        )
        repo.enqueueEvent(event, emptyList())
        repo.markUploaded("evt_test_003")
        assertEquals(0, repo.getPendingUploads().size)
    }
}
```

- [ ] **Step 6: 实现 QueueScreen**

```kotlin
package com.emergency.lane.ui.queue

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController

@Composable
fun QueueScreen(navController: NavController, viewModel: QueueViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("事件上传队列", style = MaterialTheme.typography.headlineSmall)

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            uiState.stats.forEach { (state, count) ->
                Text("$state: $count")
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = { viewModel.retryAll() }) { Text("重试全部失败事件") }
        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(uiState.events) { event ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(event.eventId, style = MaterialTheme.typography.bodyMedium)
                        Text("状态: ${event.uploadState}  |  尝试: ${event.uploadAttempts}  |  类别: ${event.vehicleClass}")
                        if (event.lastError.isNotBlank()) {
                            Text("错误: ${event.lastError}", color = MaterialTheme.colorScheme.error)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(onClick = { viewModel.retryEvent(event.eventId) }) { Text("重试") }
                            TextButton(onClick = { viewModel.deleteEvent(event.eventId) }) { Text("删除") }
                        }
                    }
                }
            }
        }

        Button(onClick = { navController.popBackStack() }) { Text("返回") }
    }
}
```

- [ ] **Step 7: Commit**

```bash
git add android/
git commit -m "feat(android): add local event queue with Room persistence"
```

---

### Task 6: 手动模拟事件

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/domain/EventFactory.kt`
- Modify: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionViewModel.kt`
- Modify: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionScreen.kt`

- [ ] **Step 1: 实现 EventFactory**

```kotlin
package com.emergency.lane.domain

import com.emergency.lane.data.local.EvidenceFileEntity
import com.emergency.lane.data.local.LocalEventEntity
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

object EventFactory {
    private var seq = 0

    fun createManualEvent(
        deviceId: String,
        roiId: String = "roi_default",
        vehicleClass: String = "car"
    ): Pair<LocalEventEntity, EvidenceFileEntity> {
        seq++
        val now = LocalDateTime.now()
        val fmt = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
        val eventId = "evt_${now.format(fmt)}_${"%03d".format(seq)}"
        val startTime = now.toString()
        val endTime = now.plusSeconds(12).toString()

        val vehicleBox = VehicleBox(120f, 220f, 180f, 90f)

        val event = LocalEventEntity(
            eventId = eventId,
            deviceId = deviceId,
            startTime = startTime,
            endTime = endTime,
            durationSeconds = 12.0,
            roiId = roiId,
            trackId = "manual_track_${"%03d".format(seq)}",
            vehicleClass = vehicleClass,
            vehicleBoxJson = "{\"x\":120,\"y\":220,\"width\":180,\"height\":90}",
            confidence = 0.86,
            gpsJson = "null",
            uploadState = UploadState.QUEUED.name,
            createdAt = now.toString()
        )

        val evidence = EvidenceFileEntity(
            eventId = eventId,
            evidenceType = "frame_peak",
            localPath = "",  // filled after capture
            mimeType = "image/jpeg"
        )

        return Pair(event, evidence)
    }
}
```

- [ ] **Step 2: 在 DetectionViewModel 中集成前置校验和事件生成**

在 `DetectionViewModel` 中添加：
```kotlin
// New state fields
data class DetectionUiState(
    // ... existing fields ...
    val canGenerateEvent: Boolean = false,
    val roiConfigured: Boolean = false,
    val hpConfigured: Boolean = false
)

// In DetectionViewModel:
private val settingsStore = SettingsStore(application)
private val roiStore = RoiStore(application)
private val eventQueue = EventQueueRepository(application)

init {
    // Check prerequisites
    viewModelScope.launch {
        combine(
            settingsStore.baseUrl,
            roiStore.roiConfig
        ) { url, roi ->
            url.isNotBlank() to (roi != null && roi.isValid())
        }.collect { (hasUrl, hasRoi) ->
            _uiState.value = _uiState.value.copy(
                hpConfigured = hasUrl,
                roiConfigured = hasRoi,
                canGenerateEvent = hasUrl && hasRoi
            )
        }
    }
}

fun generateManualEvent() {
    if (!_uiState.value.canGenerateEvent) return
    viewModelScope.launch {
        val deviceId = settingsStore.deviceId.first()
        val (event, evidence) = EventFactory.createManualEvent(deviceId)

        // Capture current frame
        var evidenceWithPath = evidence
        try {
            val bitmap = cameraController?.captureFrame()
            if (bitmap != null) {
                val path = saveBitmapToCache(bitmap, "${event.eventId}_frame_peak.jpg")
                evidenceWithPath = evidence.copy(localPath = path)
            }
        } catch (_: Exception) {}

        eventQueue.enqueueEvent(event, listOf(evidenceWithPath))
        _uiState.value = _uiState.value.copy(
            lastEventId = event.eventId,
            pendingUploadCount = eventQueue.getPendingUploads().size
        )
    }
}
```

- [ ] **Step 3: 在 DetectionScreen 中连接生成按钮**

将 DetectionScreen 中的 `/* Task 6: generate manual event */` 替换为：
```kotlin
Button(
    onClick = { viewModel.generateManualEvent() },
    enabled = uiState.canGenerateEvent
) { Text("生成模拟事件") }

if (!uiState.roiConfigured) {
    Text("请先完成 ROI 标定", color = MaterialTheme.colorScheme.error)
}
if (!uiState.hpConfigured) {
    Text("请先配置 HP 地址", color = MaterialTheme.colorScheme.error)
}
```

- [ ] **Step 4: 验证**

ROI 标定 → 配置 HP 地址 → 点击生成 → 队列页出现 `queued` 事件。

- [ ] **Step 5: Commit**

```bash
git add android/
git commit -m "feat(android): add manual event generation with camera frame capture"
```

---

### Task 7: 上传与离线补传

**Files:**
- Create: `android/app/src/main/java/com/emergency/lane/data/remote/UploadWorker.kt`
- Create: `android/app/src/main/java/com/emergency/lane/data/remote/UploadRepository.kt`
- Modify: `android/app/src/main/java/com/emergency/lane/ui/detection/DetectionViewModel.kt`

- [ ] **Step 1: 实现 UploadRepository**

```kotlin
package com.emergency.lane.data.remote

import android.content.Context
import com.emergency.lane.data.local.EventQueueRepository
import com.emergency.lane.data.local.SettingsStore
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.encodeToJsonElement
import kotlinx.serialization.json.jsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class UploadRepository(private val context: Context) {
    private val queue = EventQueueRepository(context)
    private val settings = SettingsStore(context)
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    suspend fun uploadPendingEvents(): Int {
        var uploaded = 0
        val events = queue.getPendingUploads()
        if (events.isEmpty()) return 0

        val baseUrl = settings.baseUrl.first()
        if (baseUrl.isBlank()) return 0
        val client = HpApiClient(baseUrl)

        for (event in events) {
            try {
                // Step 1: Upload event JSON
                val eventJson = json.encodeToJsonElement(event).jsonObject
                val eventBody = json.encodeToString(okio.ByteString).toRequestBody("application/json".toMediaType())
                // Build event payload matching server format
                val payload = buildEventPayload(event)
                val payloadBody = json.encodeToString(okio.ByteString.Companion).toRequestBody("application/json".toMediaType())

                val resp = client.api.createEvent(
                    json.encodeToString(buildEventJsonObject(event)).toRequestBody("application/json".toMediaType())
                )

                if (resp.isSuccessful) {
                    val body = resp.body()
                    if (body != null && (body.accepted || body.duplicate)) {
                        // Step 2: Upload evidence files
                        val evidenceFiles = queue.getEvidenceForEvent(event.eventId)
                        for (evidence in evidenceFiles) {
                            if (evidence.localPath.isNotBlank()) {
                                val file = File(evidence.localPath)
                                if (file.exists()) {
                                    val filePart = MultipartBody.Part.createFormData(
                                        "file", file.name,
                                        file.asRequestBody(evidence.mimeType.toMediaType())
                                    )
                                    val typePart = evidence.evidenceType.toRequestBody("text/plain".toMediaType())
                                    client.api.uploadEvidence(event.eventId, typePart, filePart)
                                }
                            }
                        }
                        queue.markUploaded(event.eventId)
                        uploaded++
                    } else if (resp.code() == 422) {
                        queue.markFailed(event.eventId, "422: Invalid event data — will not retry")
                    }
                } else if (resp.code() in 500..599) {
                    queue.markFailed(event.eventId, "Server error ${resp.code()}")
                }
            } catch (e: Exception) {
                queue.markFailed(event.eventId, e.message ?: "Unknown error")
            }
        }
        return uploaded
    }

    // Helper: build server-compatible event JSON
    private fun buildEventJsonObject(event: LocalEventEntity): Map<String, Any?> {
        return mapOf(
            "event_id" to event.eventId,
            "device_id" to event.deviceId,
            "start_time" to event.startTime,
            "end_time" to event.endTime,
            "duration_seconds" to event.durationSeconds,
            "roi_id" to event.roiId,
            "track_id" to event.trackId,
            "vehicle_class" to event.vehicleClass,
            "vehicle_box" to mapOf(
                "x" to 120, "y" to 220, "width" to 180, "height" to 90
            ),
            "confidence" to event.confidence,
            "gps_location" to null
        )
    }
}
```

Actually, that's too complex. Let me use a simpler approach with kotlinx.serialization:

```kotlin
package com.emergency.lane.data.remote

import android.content.Context
import com.emergency.lane.data.local.EventQueueRepository
import com.emergency.lane.data.local.SettingsStore
import com.emergency.lane.domain.VehicleBox
import kotlinx.coroutines.flow.first
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

@Serializable
data class EventUploadPayload(
    val event_id: String,
    val device_id: String,
    val start_time: String,
    val end_time: String,
    val duration_seconds: Double,
    val roi_id: String,
    val track_id: String,
    val vehicle_class: String,
    val vehicle_box: VehicleBox,
    val confidence: Double,
    val gps_location: Any? = null
)

class UploadRepository(private val context: Context) {
    private val queue = EventQueueRepository(context)
    private val settings = SettingsStore(context)
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    suspend fun uploadPendingEvents(): Int {
        var uploaded = 0
        val events = queue.getPendingUploads()
        if (events.isEmpty()) return 0

        val baseUrl = settings.baseUrl.first()
        if (baseUrl.isBlank()) return 0
        val client = HpApiClient(baseUrl)

        for (event in events) {
            try {
                val payload = EventUploadPayload(
                    event_id = event.eventId,
                    device_id = event.deviceId,
                    start_time = event.startTime,
                    end_time = event.endTime,
                    duration_seconds = event.durationSeconds,
                    roi_id = event.roiId,
                    track_id = event.trackId,
                    vehicle_class = event.vehicleClass,
                    vehicle_box = VehicleBox(120f, 220f, 180f, 90f),
                    confidence = event.confidence
                )
                val body = json.encodeToString(payload)
                    .toRequestBody("application/json".toMediaType())

                val resp = client.api.createEvent(body)

                if (resp.isSuccessful) {
                    val result = resp.body()
                    if (result != null && (result.accepted || result.duplicate)) {
                        // Upload evidence
                        val evidenceFiles = queue.getEvidenceForEvent(event.eventId)
                        for (ev in evidenceFiles) {
                            if (ev.localPath.isNotBlank()) {
                                val file = File(ev.localPath)
                                if (file.exists()) {
                                    val filePart = MultipartBody.Part.createFormData(
                                        "file", file.name,
                                        file.asRequestBody(ev.mimeType.toMediaType())
                                    )
                                    val typePart = ev.evidenceType
                                        .toRequestBody("text/plain".toMediaType())
                                    client.api.uploadEvidence(event.eventId, typePart, filePart)
                                }
                            }
                        }
                        queue.markUploaded(event.eventId)
                        uploaded++
                    } else if (resp.code() == 422) {
                        queue.markFailed(event.eventId, "422 Invalid data — will not retry")
                    }
                } else if (resp.code() in 500..599) {
                    queue.markFailed(event.eventId, "HTTP ${resp.code()}")
                } else if (resp.code() == 404) {
                    // Event not found on server — re-upload event first next time
                    queue.markFailed(event.eventId, "Event 404 on evidence upload — retry event upload")
                }
            } catch (e: Exception) {
                queue.markFailed(event.eventId, e.message ?: "Unknown error")
            }
        }
        return uploaded
    }
}
```

- [ ] **Step 2: 实现 UploadWorker（WorkManager）**

```kotlin
package com.emergency.lane.data.remote

import android.content.Context
import androidx.work.*

class UploadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val repo = UploadRepository(applicationContext)
        val uploaded = repo.uploadPendingEvents()
        return if (uploaded > 0) Result.success() else Result.retry()
    }

    companion object {
        private const val WORK_NAME = "event_upload"

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<UploadWorker>()
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, java.util.concurrent.TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context)
                .enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request)
        }
    }
}
```

- [ ] **Step 3: 触发上传**

在 DetectionViewModel 中事件生成后立即触发上传：
```kotlin
fun generateManualEvent() {
    // ... existing code ...
    viewModelScope.launch {
        // ... enqueue event ...
        UploadWorker.enqueue(getApplication())
    }
}
```

- [ ] **Step 4: 验证断网流程**

停止 HP 后端 → 生成事件 → 确认队列中有 `failed` → 恢复 HP 后端 → 手动重试 → Web 出现事件。

- [ ] **Step 5: Commit**

```bash
git add android/
git commit -m "feat(android): add upload worker with retry and offline queue"
```

---

### Task 8: 端到端验收

**Files:**
- Update docs only if actual commands differ.

- [ ] **Step 1: 启动 HP 后端**

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- [ ] **Step 2: 启动 HP Web**

```bash
cd frontend
bun run dev --host 0.0.0.0
```

- [ ] **Step 3: 配置 Android**

在 vivo X100 中填写 HP 局域网地址并连接测试。

- [ ] **Step 4: 生成并上传事件**

完成 ROI 标定，手动生成 2 条事件，确认 Web `/events` 出现待复核记录。

- [ ] **Step 5: 复核**

在 Web 详情页确认 1 条、驳回 1 条，Android 端重复上传同一事件，确认复核结果不被覆盖。

- [ ] **Step 6: 离线补传**

断网生成 1 条事件，恢复后补传，确认 Web 出现且无重复。

- [ ] **Step 7: 记录结果**

把实际设备 IP、构建命令、已知限制补入运行文档或验收记录。

- [ ] **Step 8: Commit (if docs changed)**

```bash
git add docs/
git commit -m "docs: add Phase 3 E2E verification results"
```

