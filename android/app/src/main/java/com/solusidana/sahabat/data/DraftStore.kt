package com.solusidana.sahabat.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class ApplicationDraft(
    val localId: Long = System.currentTimeMillis(),
    val agentId: String,
    val agentName: String,
    val customerName: String,
    val nik: String,
    val phone: String,
    val city: String,
    val address: String,
    val unitType: String,
    val unitBrand: String,
    val unitYear: String,
    val pinjaman: Long,
    val tenor: Int,
    val estimasiAngsuran: Long,
    val leasingId: String,
    val leasingName: String,
    val notes: String
)

/**
 * Penyimpanan draft berkas saat offline.
 * Disimpan sebagai JSON di SharedPreferences, dikirim ulang oleh SyncWorker.
 */
class DraftStore(context: Context) {

    private val prefs = context.getSharedPreferences("drafts", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    fun getAll(): List<ApplicationDraft> {
        val raw = prefs.getString(KEY, null) ?: return emptyList()
        return try { json.decodeFromString(raw) } catch (e: Exception) { emptyList() }
    }

    fun add(draft: ApplicationDraft) {
        val list = getAll() + draft
        prefs.edit().putString(KEY, json.encodeToString(list)).apply()
    }

    fun remove(localId: Long) {
        val list = getAll().filter { it.localId != localId }
        prefs.edit().putString(KEY, json.encodeToString(list)).apply()
    }

    fun count() = getAll().size

    companion object {
        private const val KEY = "pending_drafts"
    }
}
