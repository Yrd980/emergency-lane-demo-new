package com.emergency.lane.domain

import com.emergency.lane.domain.DetectionBox
import kotlin.math.abs

object GeometryUtils {

    private val VEHICLE_CLASSES = setOf("car", "truck", "bus", "emergency_vehicle", "other_vehicle")

    fun isVehicleClass(className: String): Boolean = className in VEHICLE_CLASSES

    fun bboxBottomCenter(box: DetectionBox): RoiPoint {
        return RoiPoint(
            x = box.x + box.width / 2f,
            y = box.y + box.height
        )
    }

    fun isPointInPolygon(point: RoiPoint, polygon: List<RoiPoint>): Boolean {
        if (polygon.size < 3) return false
        if (polygon.any { abs(it.x - point.x) < 0.001f && abs(it.y - point.y) < 0.001f }) {
            return true
        }
        for (i in polygon.indices) {
            val a = polygon[i]
            val b = polygon[(i + 1) % polygon.size]
            if (isPointOnSegment(point, a, b)) return true
        }

        var inside = false
        val n = polygon.size
        var j = n - 1

        for (i in 0 until n) {
            val pi = polygon[i]
            val pj = polygon[j]

            if ((pi.y > point.y) != (pj.y > point.y) &&
                point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x
            ) {
                inside = !inside
            }
            j = i
        }
        return inside
    }

    private fun isPointOnSegment(p: RoiPoint, a: RoiPoint, b: RoiPoint): Boolean {
        val cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y)
        if (abs(cross) > 0.001f) return false
        val dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)
        if (dot < 0f) return false
        val squaredLen = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)
        return dot <= squaredLen
    }
}
