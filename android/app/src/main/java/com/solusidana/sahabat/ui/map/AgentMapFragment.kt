package com.solusidana.sahabat.ui.map

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.databinding.FragmentAgentMapBinding
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class AgentLocation(
    val user_id: String,
    val name: String? = null,
    val role: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val updated_at: String? = null
)

/**
 * Peta lokasi seluruh agen & SPV menggunakan Leaflet (OpenStreetMap) via WebView.
 * Agen = marker hijau, SPV = marker merah.
 * Hanya tampil untuk owner/super-admin.
 */
class AgentMapFragment : Fragment() {

    private var _b: FragmentAgentMapBinding? = null
    private val b get() = _b!!

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentAgentMapBinding.inflate(i, c, false)
        return b.root
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }
        b.btnRefresh.setOnClickListener { load() }

        b.webMap.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        b.webMap.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                if (_b == null) return
                b.progress.isVisible = false
            }
        }

        load()
    }

    private fun load() {
        val token = SessionManager(requireContext()).accessToken ?: return
        b.progress.isVisible = true
        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getAgentLocations(token)
                .onSuccess { locations ->
                    if (_b == null) return@onSuccess
                    val html = buildMapHtml(locations)
                    b.webMap.loadDataWithBaseURL("about:blank", html, "text/html", "UTF-8", null)
                }
                .onFailure {
                    if (_b == null) return@onFailure
                    b.progress.isVisible = false
                    Snackbar.make(b.root, "Gagal memuat lokasi: ${it.message}", Snackbar.LENGTH_LONG).show()
                }
        }
    }

    private fun String.escJs() = replace("\\", "\\\\").replace("'", "\\'").replace("<", "&lt;").replace(">", "&gt;")

    private fun buildMapHtml(locations: List<AgentLocation>): String {
        val withCoords = locations.filter { it.lat != null && it.lng != null }
        // Worker lokasi background jalan tiap 15 menit — kalau baris di DB lebih
        // tua dari itu (2x lipat untuk buffer keterlambatan Doze/OEM), berarti
        // worker-nya sendiri gagal jalan (izin dicabut, battery-optimized, dsb),
        // BUKAN posisi agen yang valid saat ini. Jangan tampilkan pin yang
        // menyesatkan — lebih baik agen itu tidak muncul sama sekali di peta.
        val valid = withCoords.filter { isRecent(it.updated_at) }
        val staleCount = withCoords.size - valid.size
        val markers = valid.joinToString("\n") { loc ->
            val color = if (loc.role == "spv-agen") "#EF4444" else "#22C55E"
            val roleLabel = if (loc.role == "spv-agen") "Supervisor Agen" else "Agen"
            val timeAgo = loc.updated_at?.let { timeAgo(it) } ?: "-"
            val safeName = (loc.name ?: "-").escJs()
            """
            L.circleMarker([${loc.lat}, ${loc.lng}], {
                radius: 10, color: '#fff', weight: 2,
                fillColor: '$color', fillOpacity: 0.9
            }).addTo(map)
            .bindPopup('<b>$safeName</b><br>$roleLabel<br><small>Update: $timeAgo</small>');
            """.trimIndent()
        }

        val centerLat = valid.map { it.lat!! }.average().takeIf { !it.isNaN() } ?: -2.5
        val centerLng = valid.map { it.lng!! }.average().takeIf { !it.isNaN() } ?: 118.0
        val zoom = if (valid.isEmpty()) 5 else 8

        return """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
* { margin:0; padding:0; }
#map { width:100vw; height:100vh; }
.empty { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
         text-align:center; color:#64748b; font-family:sans-serif; font-size:14px; }
.staleNotice { position:absolute; bottom:16px; left:50%; transform:translateX(-50%);
         background:#fff; color:#92400e; border:1px solid #fcd34d; border-radius:8px;
         padding:8px 14px; font-family:sans-serif; font-size:12px; z-index:1000; }
</style>
</head>
<body>
<div id="map"></div>
${when {
    valid.isEmpty() && staleCount == 0 -> "<div class='empty'>📍 Belum ada data lokasi<br><small>Agen perlu buka aplikasi dan mengizinkan akses lokasi</small></div>"
    valid.isEmpty() && staleCount > 0  -> "<div class='empty'>📍 Tidak ada agen dengan lokasi terbaru<br><small>$staleCount agen lokasinya lebih dari 30 menit lalu — disembunyikan</small></div>"
    else -> ""
}}
${if (valid.isNotEmpty() && staleCount > 0) "<div class='staleNotice'>⚠️ $staleCount agen tidak ditampilkan (lokasi &gt; 30 menit lalu)</div>" else ""}
<script>
var map = L.map('map').setView([$centerLat, $centerLng], $zoom);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);
$markers
${if (valid.size > 1) "var bounds = [${valid.map { "[${it.lat},${it.lng}]" }.joinToString(",")}]; map.fitBounds(bounds, {padding:[40,40]});" else ""}
</script>
</body>
</html>
        """.trimIndent()
    }

    private fun instantAgeMs(iso: String?): Long? {
        if (iso == null) return null
        return try { System.currentTimeMillis() - java.time.Instant.parse(iso).toEpochMilli() } catch (e: Exception) { null }
    }

    private fun isRecent(iso: String?): Boolean {
        val age = instantAgeMs(iso) ?: return false
        return age in 0..FRESH_THRESHOLD_MS
    }

    private fun timeAgo(iso: String): String {
        val ms = instantAgeMs(iso) ?: return iso.take(10)
        val mins = (ms / 60000).toInt()
        return when {
            mins < 1    -> "baru saja"
            mins < 60   -> "$mins menit lalu"
            mins < 1440 -> "${mins/60} jam lalu"
            else        -> "${mins/1440} hari lalu"
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }

    companion object {
        // Worker lokasi jalan tiap 15 menit — 30 menit kasih buffer 1x siklus
        // untuk keterlambatan Doze/WorkManager sebelum dianggap "tidak aktif".
        private const val FRESH_THRESHOLD_MS = 30 * 60 * 1000L
    }
}
