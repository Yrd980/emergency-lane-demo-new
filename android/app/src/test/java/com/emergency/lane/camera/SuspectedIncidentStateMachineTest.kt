package com.emergency.lane.camera

import com.emergency.lane.domain.DetectionBox
import com.emergency.lane.domain.Track
import org.junit.Assert.*
import org.junit.Test

class SuspectedIncidentStateMachineTest {

    private val config = SuspectedIncidentStateMachine.Config(
        occupationSeconds = 10,
        confidenceThreshold = 0.5f
    )
    private val machine = SuspectedIncidentStateMachine(config)

    @Test
    fun `track entering ROI becomes candidate`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = false)
        val result = machine.update(track, insideRoi = true, nowMs = 10000)
        assertEquals(SuspectedIncidentStateMachine.State.CANDIDATE, result.state)
        assertEquals(10000L, result.roiEnterMs)
    }

    @Test
    fun `candidate stays candidate under occupation threshold`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = true, roiEnterMs = 10000)
        val result = machine.update(track, insideRoi = true, nowMs = 15000)
        assertEquals(SuspectedIncidentStateMachine.State.CANDIDATE, result.state)
        assertFalse(result.shouldCreateSuspectedIncident)
    }

    @Test
    fun `candidate triggers suspectedIncident after occupation threshold`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = true, roiEnterMs = 10000)
        val result = machine.update(track, insideRoi = true, nowMs = 21000)
        assertEquals(SuspectedIncidentStateMachine.State.SUSPECTED_INCIDENT_CREATED, result.state)
        assertTrue(result.shouldCreateSuspectedIncident)
    }

    @Test
    fun `track leaving ROI before threshold resets to outside`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = true, roiEnterMs = 10000)
        machine.update(track, insideRoi = true, nowMs = 12000)
        val result = machine.update(track, insideRoi = false, nowMs = 13000)
        assertEquals(SuspectedIncidentStateMachine.State.OUTSIDE_ROI, result.state)
    }

    @Test
    fun `already created suspectedIncident does not trigger again`() {
        val track = makeTrack("track_0", "car", 0.9f, insideRoi = true, roiEnterMs = 10000, eventCreated = true)
        val result = machine.update(track, insideRoi = true, nowMs = 21000)
        assertFalse(result.shouldCreateSuspectedIncident)
    }

    @Test
    fun `low confidence track does not trigger`() {
        val track = makeTrack("track_0", "car", 0.4f, insideRoi = true, roiEnterMs = 10000)
        val result = machine.update(track, insideRoi = true, nowMs = 21000)
        assertFalse(result.shouldCreateSuspectedIncident)
    }

    @Test
    fun `non-vehicle class does not trigger`() {
        val track = makeTrack("track_0", "person", 0.9f, insideRoi = true, roiEnterMs = 10000)
        val result = machine.update(track, insideRoi = true, nowMs = 21000)
        assertEquals(SuspectedIncidentStateMachine.State.OUTSIDE_ROI, result.state)
    }

    private fun makeTrack(
        id: String, className: String, confidence: Float,
        insideRoi: Boolean = false, roiEnterMs: Long? = null,
        eventCreated: Boolean = false
    ) = Track(
        trackId = id, className = className,
        firstSeenMs = 0, lastSeenMs = 0,
        lastBox = DetectionBox(100f, 200f, 180f, 90f, className, confidence),
        confidence = confidence, insideRoi = insideRoi,
        roiEnterMs = roiEnterMs, eventCreated = eventCreated
    )
}
