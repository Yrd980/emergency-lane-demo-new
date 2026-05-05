package com.emergency.lane.camera

import com.emergency.lane.domain.DetectionBox
import com.emergency.lane.domain.Track
import org.junit.Assert.*
import org.junit.Test

class TrackerTest {

    private val tracker = Tracker(trackLostMs = 2000)

    @Test
    fun `first detection creates new track`() {
        val boxes = listOf(DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f))
        val tracks = tracker.update(boxes, nowMs = 1000)
        assertEquals(1, tracks.size)
        assertEquals("car", tracks[0].className)
        assertEquals("track_0", tracks[0].trackId)
    }

    @Test
    fun `matching detection updates existing track`() {
        val box1 = DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)
        tracker.update(listOf(box1), nowMs = 1000)

        val box2 = DetectionBox(105f, 205f, 180f, 90f, "car", 0.85f)
        val tracks = tracker.update(listOf(box2), nowMs = 1200)

        assertEquals(1, tracks.size)
        assertEquals("track_0", tracks[0].trackId)
        assertEquals(1200, tracks[0].lastSeenMs)
    }

    @Test
    fun `track lost after timeout is removed`() {
        val box1 = DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)
        tracker.update(listOf(box1), nowMs = 1000)

        val tracks = tracker.update(emptyList(), nowMs = 3500)

        assertTrue(tracks.isEmpty())
    }

    @Test
    fun `brief gap does not lose track`() {
        val box1 = DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)
        tracker.update(listOf(box1), nowMs = 1000)
        tracker.update(emptyList(), nowMs = 1500)

        val box2 = DetectionBox(105f, 205f, 180f, 90f, "car", 0.85f)
        val tracks = tracker.update(listOf(box2), nowMs = 1800)

        assertEquals(1, tracks.size)
        assertEquals("track_0", tracks[0].trackId)
    }

    @Test
    fun `different class does not match existing track`() {
        tracker.update(listOf(DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)), nowMs = 1000)
        // Same-class matching preferred; far-away different class creates new track
        val tracks = tracker.update(
            listOf(DetectionBox(500f, 500f, 100f, 100f, "truck", 0.8f)),
            nowMs = 1200
        )
        assertEquals(2, tracks.size)
    }

    @Test
    fun `track ID is stable across multiple updates`() {
        for (i in 0..5) {
            val box = DetectionBox(100f + i * 2, 200f + i, 180f, 90f, "car", 0.9f)
            tracker.update(listOf(box), nowMs = 1000L + i * 200)
        }
        val tracks = tracker.update(
            listOf(DetectionBox(112f, 205f, 180f, 90f, "car", 0.88f)),
            nowMs = 2200
        )
        assertEquals(1, tracks.size)
        assertEquals("track_0", tracks[0].trackId)
    }
}
