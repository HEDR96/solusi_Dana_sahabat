package com.solusidana.sahabat.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AuthResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("expires_in") val expiresIn: Int,
    val user: AuthUser
)

@Serializable
data class AuthUser(
    val id: String,
    val email: String
)

@Serializable
data class Profile(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val status: String? = null,
    @SerialName("agent_id") val agentId: String? = null,
    @SerialName("last_login") val lastLogin: String? = null
)

@Serializable
data class Application(
    val id: String,
    val status: String,
    @SerialName("agent_id") val agentId: String? = null,
    @SerialName("agent_name") val agentName: String? = null,
    @SerialName("customer_name") val customerName: String,
    val nik: String? = null,
    val phone: String? = null,
    val city: String? = null,
    val address: String? = null,
    @SerialName("unit_type") val unitType: String? = null,
    @SerialName("unit_year") val unitYear: Int? = null,   // kolom int di DB
    @SerialName("unit_brand") val unitBrand: String? = null,
    val pinjaman: Long? = null,
    val tenor: Int? = null,
    @SerialName("estimasi_angsuran") val estimasiAngsuran: Long? = null,
    @SerialName("leasing_id") val leasingId: Long? = null,
    @SerialName("leasing_name") val leasingName: String? = null,
    @SerialName("input_date") val inputDate: String? = null,
    val notes: String? = null,
    @SerialName("survey_date") val surveyDate: String? = null,
    @SerialName("survey_time") val surveyTime: String? = null,
    @SerialName("survey_result") val surveyResult: String? = null,
    @SerialName("approve_date") val approveDate: String? = null,
    @SerialName("approve_pinjaman") val approvePinjaman: Long? = null
)

@Serializable
data class Agent(
    val id: String,
    val name: String,
    val phone: String? = null,
    val email: String? = null,
    val city: String? = null,
    val address: String? = null,
    val nik: String? = null,
    val status: String? = null,
    @SerialName("join_date") val joinDate: String? = null,
    val bank: String? = null,
    @SerialName("account_number") val accountNumber: String? = null,
    @SerialName("account_name") val accountName: String? = null,
    val target: Int? = null,
    val notes: String? = null,
    @SerialName("total_approve") val totalApprove: Int? = null,
    @SerialName("total_reject") val totalReject: Int? = null,
    @SerialName("total_berkas") val totalBerkas: Int? = null,
    @SerialName("spv_id") val spvId: String? = null
)

@Serializable
data class MasterOption(
    val id: Long? = null,
    val category: String,
    val value: String,
    val label: String? = null,
    val sort: Int = 0,
    val active: Boolean = true
)

@Serializable
data class AgentActivity(
    val id: Long? = null,
    @SerialName("agent_id") val agentId: String? = null,
    @SerialName("agent_name") val agentName: String? = null,
    val date: String? = null,
    val type: String? = null,
    val description: String? = null,
    val outcome: String? = null,
    @SerialName("related_app_id") val relatedAppId: String? = null
)

// Sinkron dengan ACTIVITY_TYPES / ACTIVITY_OUTCOMES di web ERP
val ACTIVITY_TYPES = listOf(
    "kunjungan-dealer" to "Kunjungan Dealer",
    "follow-up"        to "Follow Up Nasabah",
    "cold-call"        to "Cold Call / Telepon",
    "referral"         to "Referral Nasabah",
    "survey-lokasi"    to "Survey Lokasi",
    "networking"       to "Networking / Event"
)

val ACTIVITY_OUTCOMES = listOf(
    "prospek-baru"        to "Prospek Baru",
    "follow-up-lanjutan"  to "Perlu Follow Up",
    "menghasilkan-berkas" to "Menghasilkan Berkas",
    "tidak-berhasil"      to "Tidak Berhasil"
)

fun activityTypeLabel(key: String?)    = ACTIVITY_TYPES.firstOrNull { it.first == key }?.second ?: (key ?: "-")
fun activityOutcomeLabel(key: String?) = ACTIVITY_OUTCOMES.firstOrNull { it.first == key }?.second ?: (key ?: "-")

fun activityOutcomeColor(key: String?): Int = when (key) {
    "prospek-baru"        -> 0xFF3B82F6.toInt()
    "follow-up-lanjutan"  -> 0xFFF59E0B.toInt()
    "menghasilkan-berkas" -> 0xFF22C55E.toInt()
    "tidak-berhasil"      -> 0xFFEF4444.toInt()
    else                  -> 0xFF64748B.toInt()
}

@Serializable
data class Commission(
    val id: Long,
    @SerialName("app_id") val appId: String? = null,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("agent_id") val agentId: String? = null,
    @SerialName("agent_name") val agentName: String? = null,
    @SerialName("leasing_name") val leasingName: String? = null,
    @SerialName("approve_pinjaman") val approvePinjaman: Long? = null,
    @SerialName("approve_date") val approveDate: String? = null,
    @SerialName("commission_rate") val commissionRate: Double? = null,
    @SerialName("commission_amount") val commissionAmount: Long? = null,
    val status: String? = null,
    @SerialName("payment_date") val paymentDate: String? = null,
    @SerialName("payment_method") val paymentMethod: String? = null
)

@Serializable
data class LeasingPartner(
    val id: Long,
    val name: String,
    val pic: String? = null,
    val contact: String? = null,
    @SerialName("notes") val nomorMou: String? = null,
    @SerialName("branch") val targetMou: String? = null,
    val rate: Double? = null,
    val status: String? = null,
    @SerialName("min_pinjaman") val minPinjaman: Long? = null,
    @SerialName("max_pinjaman") val maxPinjaman: Long? = null
)

@Serializable
data class StatusLog(
    val id: Long,   // bigint identity di DB — String menyebabkan error parsing (riwayat kosong)
    @SerialName("app_id") val appId: String,
    @SerialName("from_status") val fromStatus: String? = null,
    @SerialName("to_status") val toStatus: String,
    val user: String? = null,
    val date: String? = null,
    val notes: String? = null
)

val STATUSES = listOf(
    "pending", "cek-data", "janji-survey", "survey", "komite", "approve", "reject", "cancel"
)

val TERMINAL_STATUSES = setOf("approve", "reject", "cancel")

fun statusColor(status: String): Int {
    return when (status) {
        "pending"      -> 0xFFF59E0B.toInt()
        "cek-data"     -> 0xFF3B82F6.toInt()
        "janji-survey" -> 0xFF8B5CF6.toInt()
        "survey"       -> 0xFF6366F1.toInt()
        "komite"       -> 0xFFF97316.toInt()
        "approve"      -> 0xFF22C55E.toInt()
        "reject"       -> 0xFFEF4444.toInt()
        "cancel"       -> 0xFF94A3B8.toInt()
        else           -> 0xFF64748B.toInt()
    }
}

fun statusLabel(status: String): String {
    return when (status) {
        "pending"      -> "Pending"
        "cek-data"     -> "Cek Data"
        "janji-survey" -> "Janji Survey"
        "survey"       -> "Survey"
        "komite"       -> "Komite"
        "approve"      -> "Approve"
        "reject"       -> "Reject"
        "cancel"       -> "Cancel"
        else           -> status
    }
}

fun formatRupiah(amount: Long?): String {
    if (amount == null) return "-"
    return "Rp ${String.format("%,d", amount).replace(',', '.')}"
}

/** Terjemahkan error jaringan mentah menjadi pesan yang dimengerti user. */
fun humanError(e: Throwable?): String = when {
    e == null -> "Terjadi kesalahan"
    e is java.net.UnknownHostException || e.message?.contains("Unable to resolve host") == true ->
        "📡 Tidak ada koneksi internet.\nPeriksa sinyal / WiFi HP, lalu tarik ke bawah untuk memuat ulang."
    e is java.net.SocketTimeoutException ->
        "🐢 Koneksi lambat — waktu habis.\nTarik ke bawah untuk coba lagi."
    e is java.io.IOException ->
        "Koneksi terputus. Tarik ke bawah untuk coba lagi."
    else -> e.message ?: "Terjadi kesalahan"
}
