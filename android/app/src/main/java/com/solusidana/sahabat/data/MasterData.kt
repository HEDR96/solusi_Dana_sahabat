package com.solusidana.sahabat.data

import android.content.Context
import kotlinx.serialization.json.Json

/**
 * Opsi dropdown dari tabel master_options (dikelola owner di web).
 * Hasil terakhir di-cache di SharedPreferences agar tetap ada saat offline.
 */
object MasterData {

    private val json = Json { ignoreUnknownKeys = true }

    private val DEFAULTS = mapOf(
        "unit_type"      to listOf("Motor", "Mobil", "Sertifikat"),
        "tenor"          to listOf("6", "12", "18", "24", "36", "48"),
        "bank"           to listOf("BCA", "BRI", "BNI", "Mandiri", "BSI"),
        "payment_method" to listOf("Transfer Bank", "Cash", "QRIS", "Cek")
    )

    /** Ambil dari server, simpan cache. Jika gagal → cache; jika kosong → default. */
    suspend fun load(context: Context, token: String): Map<String, List<String>> {
        val prefs = context.getSharedPreferences("master_cache", Context.MODE_PRIVATE)

        SupabaseApi.getMasterOptions(token).onSuccess { list ->
            val raw = json.encodeToString(
                kotlinx.serialization.builtins.ListSerializer(MasterOption.serializer()), list
            )
            prefs.edit().putString("options", raw).apply()
        }

        val raw = prefs.getString("options", null) ?: return DEFAULTS
        val list = try {
            json.decodeFromString(
                kotlinx.serialization.builtins.ListSerializer(MasterOption.serializer()), raw
            )
        } catch (e: Exception) { return DEFAULTS }

        val grouped = list.filter { it.active }
            .sortedBy { it.sort }
            .groupBy({ it.category }, { it.value })

        // Kategori yang kosong di DB tetap pakai default
        return DEFAULTS.mapValues { (cat, def) -> grouped[cat]?.takeIf { it.isNotEmpty() } ?: def }
    }
}
