package com.emergency.lane.camera

import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder

class InferenceEngine(
    private val interpreter: Interpreter,
    val modelInfo: ModelInfo
) {
    private val inputWidth = modelInfo.inputWidth
    private val inputHeight = modelInfo.inputHeight
    private val outputSize = modelInfo.outputShape.fold(1) { acc, value -> acc * value }

    fun runInference(bitmap: Bitmap): Pair<FloatArray, Long> {
        val start = System.currentTimeMillis()

        val scaled = Bitmap.createScaledBitmap(bitmap, inputWidth, inputHeight, true)
        val isFloatInput = modelInfo.inputDataType == "FLOAT32"
        val bytesPerChannel = if (isFloatInput) 4 else 1
        val inputBuffer = ByteBuffer.allocateDirect(bytesPerChannel * inputWidth * inputHeight * 3)
            .order(ByteOrder.nativeOrder())
        val intValues = IntArray(inputWidth * inputHeight)
        scaled.getPixels(intValues, 0, inputWidth, 0, 0, inputWidth, inputHeight)
        for (pixel in intValues) {
            val channels = intArrayOf(
                (pixel shr 16) and 0xFF,
                (pixel shr 8) and 0xFF,
                pixel and 0xFF
            )
            for (channel in channels) {
                if (isFloatInput) {
                    inputBuffer.putFloat(channel / 255.0f)
                } else {
                    val quantized = (channel / 255.0f / modelInfo.inputScale + modelInfo.inputZeroPoint)
                        .toInt()
                        .coerceIn(0, 255)
                    inputBuffer.put(quantized.toByte())
                }
            }
        }

        val output = FloatArray(outputSize)
        interpreter.run(inputBuffer, output)

        val elapsed = System.currentTimeMillis() - start
        return Pair(output, elapsed)
    }

    fun close() {
        interpreter.close()
    }
}
