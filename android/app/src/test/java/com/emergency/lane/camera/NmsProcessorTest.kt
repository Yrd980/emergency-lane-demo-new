package com.emergency.lane.camera

import org.junit.Assert.*
import org.junit.Test

class NmsProcessorTest {

    @Test
    fun `nms keeps highest confidence box and suppresses overlapping`() {
        val boxes = listOf(
            com.emergency.lane.domain.DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f),
            com.emergency.lane.domain.DetectionBox(105f, 205f, 180f, 90f, "car", 0.6f),
            com.emergency.lane.domain.DetectionBox(300f, 200f, 180f, 90f, "car", 0.8f)
        )
        val result = NmsProcessor.nms(boxes, iouThreshold = 0.45f, confidenceThreshold = 0.5f)
        assertEquals(2, result.size)
        assertTrue(result.any { it.confidence == 0.9f })
        assertTrue(result.any { it.confidence == 0.8f })
    }

    @Test
    fun `nms filters below confidence threshold`() {
        val boxes = listOf(
            com.emergency.lane.domain.DetectionBox(100f, 200f, 180f, 90f, "car", 0.4f),
            com.emergency.lane.domain.DetectionBox(300f, 200f, 180f, 90f, "car", 0.9f)
        )
        val result = NmsProcessor.nms(boxes, iouThreshold = 0.45f, confidenceThreshold = 0.5f)
        assertEquals(1, result.size)
        assertEquals(0.9f, result[0].confidence)
    }

    @Test
    fun `nms with empty input returns empty`() {
        val result = NmsProcessor.nms(emptyList(), iouThreshold = 0.45f, confidenceThreshold = 0.5f)
        assertTrue(result.isEmpty())
    }

    @Test
    fun `nms skips non-vehicle classes in parse`() {
        // Output shape [1, 84, 2] = 2 boxes, 84 channels each (CHANNELS_FIRST)
        // box 0: car with confidence 0.8
        // box 1: person with confidence 0.9 (should be filtered)
        val numBoxes = 2
        val numChannels = 84
        val outputShape = intArrayOf(1, numChannels, numBoxes)
        val output = FloatArray(numChannels * numBoxes) { 0f }

        // Box 0 (car): cx=0.5, cy=0.5, w=0.2, h=0.15
        output[0 * numBoxes + 0] = 0.5f  // cx
        output[1 * numBoxes + 0] = 0.5f  // cy
        output[2 * numBoxes + 0] = 0.2f  // w
        output[3 * numBoxes + 0] = 0.15f // h
        output[6 * numBoxes + 0] = 0.8f  // class 2 = car score

        // Box 1 (person): cx=0.3, cy=0.3, w=0.1, h=0.1
        output[0 * numBoxes + 1] = 0.3f  // cx
        output[1 * numBoxes + 1] = 0.3f  // cy
        output[2 * numBoxes + 1] = 0.1f  // w
        output[3 * numBoxes + 1] = 0.1f  // h
        output[4 * numBoxes + 1] = 0.9f  // class 0 = person score

        val result = NmsProcessor.parseYoloOutput(output, outputShape, 0.5f)
        assertEquals(1, result.size)
        assertEquals("car", result[0].className)
    }
}
