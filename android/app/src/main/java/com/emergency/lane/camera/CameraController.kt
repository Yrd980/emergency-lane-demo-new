package com.emergency.lane.camera

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
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
    private var cameraProvider: ProcessCameraProvider? = null
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    fun startCamera(previewView: PreviewView) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                .setTargetResolution(Size(1280, 720))
                .build()

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            try {
                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(
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
                override fun onCaptureSuccess(image: ImageProxy) {
                    try {
                        val buffer = image.planes[0].buffer
                        val bytes = ByteArray(buffer.remaining())
                        buffer.get(bytes)
                        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                        if (bitmap != null) {
                            cont.resume(bitmap)
                        } else {
                            cont.resumeWithException(IllegalStateException("Failed to decode captured frame"))
                        }
                    } finally {
                        image.close()
                    }
                }
                override fun onError(exception: ImageCaptureException) {
                    cont.resumeWithException(exception)
                }
            }
        )
    }

    fun release() {
        try {
            cameraProvider?.unbindAll()
        } catch (_: Exception) {}
        imageCapture = null
        cameraExecutor.shutdown()
    }
}
