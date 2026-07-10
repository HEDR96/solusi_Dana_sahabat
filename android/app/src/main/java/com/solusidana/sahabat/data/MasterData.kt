package com.solusidana.sahabat.data

import android.content.Context
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

/**
 * Opsi dropdown dari tabel master_options (dikelola owner di menu Master Data).
 * Hasil terakhir di-cache di SharedPreferences agar tetap ada saat offline.
 * value = kunci yang disimpan di data; label = teks tampilan (fallback: value).
 */
object MasterData {

    private val json = Json { ignoreUnknownKeys = true }

    private val DEFAULTS = mapOf(
        "unit_type"      to listOf("Motor", "Mobil", "Sertifikat"),
        "tenor"          to listOf("6", "12", "18", "24", "36", "48"),
        "bank"           to listOf("BCA", "BRI", "BNI", "Mandiri", "BSI"),
        "payment_method" to listOf("Transfer Bank", "Cash", "QRIS", "Cek"),
        "city"           to listOf("Jakarta", "Bandung", "Surabaya", "Medan", "Makassar")
    )

    // Fallback pasangan value->label (dipakai saat cache & server belum tersedia)
    private val DEFAULT_PAIRS = mapOf(
        "activity_type"    to ACTIVITY_TYPES,
        "activity_outcome" to ACTIVITY_OUTCOMES,
        "role" to listOf(
            "owner" to "Owner", "super-admin" to "Super Admin",
            "admin" to "Admin / Back Office", "spv-agen" to "Supervisor Agen",
            "agen" to "Agen", "surveyor" to "Surveyor", "finance" to "Finance"
        )
    )

    private fun prefs(context: Context) =
        context.getSharedPreferences("master_cache", Context.MODE_PRIVATE)

    private fun cachedOptions(context: Context): List<MasterOption> {
        val raw = prefs(context).getString("options", null) ?: return emptyList()
        return try {
            json.decodeFromString(ListSerializer(MasterOption.serializer()), raw)
        } catch (e: Exception) { emptyList() }
    }

    /** Refresh dari server (simpan cache), kembalikan map kategori -> daftar value. */
    suspend fun load(context: Context, token: String): Map<String, List<String>> {
        SupabaseApi.getMasterOptions(token).onSuccess { list ->
            val raw = json.encodeToString(ListSerializer(MasterOption.serializer()), list)
            prefs(context).edit().putString("options", raw).apply()
        }

        val list = cachedOptions(context)
        if (list.isEmpty()) return DEFAULTS

        val grouped = list.filter { it.active }
            .sortedBy { it.sort }
            .groupBy({ it.category }, { it.value })

        return DEFAULTS.mapValues { (cat, def) -> grouped[cat]?.takeIf { it.isNotEmpty() } ?: def }
    }

    /** Pasangan (value, label) per kategori - dari cache; fallback konstanta. */
    fun pairs(context: Context, category: String): List<Pair<String, String>> {
        val fromCache = cachedOptions(context)
            .filter { it.category == category && it.active }
            .sortedBy { it.sort }
            .map { it.value to (it.label ?: it.value) }
        if (fromCache.isNotEmpty()) return fromCache
        return DEFAULT_PAIRS[category]
            ?: DEFAULTS[category]?.map { it to it }
            ?: emptyList()
    }

    /** Label tampilan untuk sebuah kunci, mis. role "spv-agen" -> "Supervisor Agen". */
    fun labelFor(context: Context, category: String, key: String?): String {
        if (key == null) return "-"
        return pairs(context, category).firstOrNull { it.first == key }?.second ?: key
    }
}