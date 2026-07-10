package com.solusidana.sahabat.ui.lock

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PointF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.hypot
import kotlin.math.min

/**
 * Pola kunci 3x3 sederhana tanpa library.
 * Hasil pola berupa string indeks node, mis. "0-1-2-5-8".
 */
class PatternLockView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    var onPatternComplete: ((String) -> Unit)? = null

    private val nodes = Array(9) { PointF() }
    private val selected = mutableListOf<Int>()
    private var touchX = 0f
    private var touchY = 0f
    private var tracking = false
    private var nodeRadius = 0f
    private var hitRadius = 0f

    private val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFF94A3B8.toInt()
        style = Paint.Style.FILL
    }
    private val selectedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFF3B82F6.toInt()
        style = Paint.Style.FILL
    }
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0x333B82F6
        style = Paint.Style.FILL
    }
    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFF3B82F6.toInt()
        style = Paint.Style.STROKE
        strokeWidth = 8f
        strokeCap = Paint.Cap.ROUND
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        val size = min(w, h).toFloat()
        val cell = size / 3f
        nodeRadius = cell * 0.10f
        hitRadius = cell * 0.35f
        val offsetX = (w - size) / 2f
        val offsetY = (h - size) / 2f
        for (i in 0 until 9) {
            val row = i / 3
            val col = i % 3
            nodes[i].set(
                offsetX + cell * col + cell / 2f,
                offsetY + cell * row + cell / 2f
            )
        }
    }

    override fun onDraw(canvas: Canvas) {
        // Garis antar node terpilih
        for (i in 0 until selected.size - 1) {
            val a = nodes[selected[i]]
            val b = nodes[selected[i + 1]]
            canvas.drawLine(a.x, a.y, b.x, b.y, linePaint)
        }
        // Garis ke posisi jari
        if (tracking && selected.isNotEmpty()) {
            val last = nodes[selected.last()]
            canvas.drawLine(last.x, last.y, touchX, touchY, linePaint)
        }
        // Titik-titik
        for (i in 0 until 9) {
            val p = nodes[i]
            if (selected.contains(i)) {
                canvas.drawCircle(p.x, p.y, nodeRadius * 2.6f, ringPaint)
                canvas.drawCircle(p.x, p.y, nodeRadius * 1.3f, selectedPaint)
            } else {
                canvas.drawCircle(p.x, p.y, nodeRadius, dotPaint)
            }
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        touchX = event.x
        touchY = event.y
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                selected.clear()
                tracking = true
                hitNode()?.let { selected.add(it) }
                invalidate()
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                if (tracking) {
                    hitNode()?.let { if (!selected.contains(it)) selected.add(it) }
                    invalidate()
                }
                return true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                tracking = false
                if (selected.size >= 4) {
                    onPatternComplete?.invoke(selected.joinToString("-"))
                } else if (selected.isNotEmpty()) {
                    onPatternComplete?.invoke("")   // pola terlalu pendek
                }
                selected.clear()
                invalidate()
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    private fun hitNode(): Int? {
        for (i in 0 until 9) {
            if (hypot(touchX - nodes[i].x, touchY - nodes[i].y) <= hitRadius) return i
        }
        return null
    }
}
