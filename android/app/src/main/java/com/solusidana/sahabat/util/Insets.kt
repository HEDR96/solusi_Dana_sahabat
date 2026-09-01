package com.solusidana.sahabat.util

import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Beri padding sebesar system bars (status bar + navigation bar) ke [view].
 *
 * Sejak targetSdk 36 (Android 16), platform tidak lagi mengizinkan opt-out dari
 * edge-to-edge lewat WindowCompat.setDecorFitsSystemWindows(window, true) — API
 * itu jadi no-op. Konten yang tadinya aman dari status/nav bar akan ketiban lagi
 * kalau tidak diberi padding manual. Listener ini aman dipasang di semua versi
 * Android: kalau sistem masih memberi ruang otomatis (decorFitsSystemWindows
 * masih berlaku), inset yang diterima di sini bernilai nol sehingga padding
 * tambahan tidak berpengaruh.
 */
fun View.applySystemBarPadding() {
    // Simpan padding asli dari XML sebelum listener pertama kali menimpanya —
    // listener bisa terpanggil berkali-kali (mis. rotasi layar), jadi nilai
    // dasarnya harus diambil sekali di luar closure, bukan dibaca ulang dari
    // paddingLeft/dst yang saat itu sudah berisi hasil inset sebelumnya.
    val baseLeft = paddingLeft
    val baseTop = paddingTop
    val baseRight = paddingRight
    val baseBottom = paddingBottom
    ViewCompat.setOnApplyWindowInsetsListener(this) { v, insets ->
        val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
        v.setPadding(baseLeft + bars.left, baseTop + bars.top, baseRight + bars.right, baseBottom + bars.bottom)
        insets
    }
}
