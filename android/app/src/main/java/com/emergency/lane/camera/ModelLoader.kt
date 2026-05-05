package com.emergency.lane.camera

import android.content.Context
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.GpuDelegate
import java.nio.MappedByteBuffer
import java.io.FileInputStream
import java.nio.channels.FileChannel

data class ModelInfo(
    val version: String,
    val inputShape: IntArray,
    val inputDataType: String,
    val inputScale: Float,
    val inputZeroPoint: Int,
    val outputShape: IntArray,
    val outputDataType: String,
    val inputWidth: Int,
    val inputHeight: Int,
    val numClasses: Int = 80,
    val numBoxes: Int = 8400
)

sealed class ModelLoadResult {
    data class Loaded(val interpreter: Interpreter, val info: ModelInfo) : ModelLoadResult()
    data class Failed(val error: String) : ModelLoadResult()
}

class ModelLoader(private val context: Context) {

    fun load(modelPath: String = "yolov8n_vehicle_640x640.tflite"): ModelLoadResult {
        return try {
            val buf = loadModelFile(modelPath)
            val options = Interpreter.Options().apply {
                try {
                    addDelegate(GpuDelegate())
                } catch (_: Throwable) {
                    setNumThreads(4)
                }
            }
            val interpreter = Interpreter(buf, options)
            val inputTensor = interpreter.getInputTensor(0)
            val outputTensor = interpreter.getOutputTensor(0)
            val inputShape = inputTensor.shape()
            val outputShape = outputTensor.shape()
            val inputQuant = inputTensor.quantizationParams()
            val info = ModelInfo(
                version = modelPath.removeSuffix(".tflite"),
                inputShape = inputShape,
                inputDataType = inputTensor.dataType().name,
                inputScale = inputQuant.scale,
                inputZeroPoint = inputQuant.zeroPoint,
                outputShape = outputShape,
                outputDataType = outputTensor.dataType().name,
                inputWidth = inputShape.getOrElse(2) { 640 },
                inputHeight = inputShape.getOrElse(1) { 640 },
                numBoxes = outputShape.maxOrNull() ?: 8400
            )
            ModelLoadResult.Loaded(interpreter, info)
        } catch (e: Exception) {
            ModelLoadResult.Failed(e.message ?: "Unknown model load error")
        }
    }

    private fun loadModelFile(path: String): MappedByteBuffer {
        val fd = context.assets.openFd(path)
        try {
            return FileInputStream(fd.fileDescriptor).channel.map(
                FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength
            )
        } finally {
            fd.close()
        }
    }
}
