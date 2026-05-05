package com.emergency.lane.domain

import org.junit.Assert.*
import org.junit.Test

class GeometryUtilsTest {

    private val sampleRoi = listOf(
        RoiPoint(820f, 210f),
        RoiPoint(1260f, 240f),
        RoiPoint(1270f, 710f),
        RoiPoint(620f, 710f)
    )

    @Test
    fun `point inside ROI returns true`() {
        val inside = RoiPoint(1000f, 500f)
        assertTrue(GeometryUtils.isPointInPolygon(inside, sampleRoi))
    }

    @Test
    fun `point outside ROI returns false`() {
        val outside = RoiPoint(100f, 500f)
        assertFalse(GeometryUtils.isPointInPolygon(outside, sampleRoi))
    }

    @Test
    fun `point on ROI boundary vertex returns true`() {
        val onVertex = RoiPoint(820f, 210f)
        assertTrue(GeometryUtils.isPointInPolygon(onVertex, sampleRoi))
    }

    @Test
    fun `empty ROI returns false`() {
        assertFalse(GeometryUtils.isPointInPolygon(RoiPoint(500f, 500f), emptyList()))
    }

    @Test
    fun `ROI with less than 3 points returns false`() {
        val twoPoints = listOf(RoiPoint(0f, 0f), RoiPoint(100f, 100f))
        assertFalse(GeometryUtils.isPointInPolygon(RoiPoint(50f, 50f), twoPoints))
    }

    @Test
    fun `bbox bottom center is correct`() {
        val box = DetectionBox(100f, 200f, 180f, 90f, "car", 0.9f)
        val point = GeometryUtils.bboxBottomCenter(box)
        assertEquals(100f + 90f, point.x, 0.01f)
        assertEquals(200f + 90f, point.y, 0.01f)
    }

    @Test
    fun `vehicle classes are identified correctly`() {
        assertTrue(GeometryUtils.isVehicleClass("car"))
        assertTrue(GeometryUtils.isVehicleClass("truck"))
        assertTrue(GeometryUtils.isVehicleClass("bus"))
        assertFalse(GeometryUtils.isVehicleClass("person"))
        assertFalse(GeometryUtils.isVehicleClass("bicycle"))
    }
}
