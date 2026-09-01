package com.solusidana.sahabat.ui.report

import android.app.Application as AndroidApp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.solusidana.sahabat.data.Application as App
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.humanError
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/** Status yang dianggap masih berjalan — dipakai untuk hitung aging & berkas aktif. */
private val STATUS_AKTIF = listOf("pending", "cek-data", "janji-survey", "survey", "komite")

/** Ambang berkas dianggap terlambat, disamakan dengan Laporan Berkas di web. */
const val AMBANG_TERLAMBAT_HARI = 14L

enum class Periode(val label: String) {
    BULAN_INI("Bulan Ini"),
    BULAN_LALU("Bulan Lalu"),
    HARI_90("90 Hari"),
    SEMUA("Semua")
}

data class BerkasTelat(val app: App, val hari: Long)

data class RingkasAgen(val nama: String, val total: Int, val approve: Int)

data class ReportData(
    val totalBerkas: Int,
    val approve: Int,
    val reject: Int,
    val aktif: Int,
    val konversiPersen: Int,
    val nilaiApprove: Long,
    val komisiPaid: Long,
    val komisiUnpaid: Long,
    // Terlambat sengaja TIDAK ikut filter periode: berkas mandek dari bulan lalu
    // justru yang paling perlu ditindak, bukan disembunyikan karena di luar rentang.
    val terlambat: List<BerkasTelat>,
    val perAgen: List<RingkasAgen>
)

class ReportViewModel(app: AndroidApp) : AndroidViewModel(app) {

    private val session = SessionManager(app)

    private val _data = MutableLiveData<ReportData?>()
    val data: LiveData<ReportData?> = _data

    private val _loading = MutableLiveData(false)
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    var periode: Periode = Periode.BULAN_INI
        private set

    private var semuaApp: List<App> = emptyList()
    private var komisiPaid: Long = 0
    private var komisiUnpaid: Long = 0
    private var sudahDimuat = false

    fun setPeriode(p: Periode) {
        if (periode == p) return
        periode = p
        if (sudahDimuat) hitung()
    }

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            val token = session.accessToken ?: run {
                _error.value = "Sesi belum aktif — coba buka ulang aplikasi"
                _loading.value = false
                return@launch
            }
            // Owner/spv melihat sesuai cakupan RLS masing-masing; tanpa filter agen
            // di sisi klien supaya spv tetap dapat data seluruh binaannya.
            SupabaseApi.getApplications(token)
                .onSuccess { semuaApp = it }
                .onFailure { _error.value = humanError(it) }

            SupabaseApi.getCommissions(token, null)
                .onSuccess { list ->
                    komisiPaid = list.filter { it.status == "paid" }.sumOf { it.commissionAmount ?: 0 }
                    komisiUnpaid = list.filter { it.status == "unpaid" }.sumOf { it.commissionAmount ?: 0 }
                }
                .onFailure { /* komisi gagal tidak membatalkan laporan berkas */ }

            sudahDimuat = true
            hitung()
            _loading.value = false
        }
    }

    private fun parseTanggal(s: String?): LocalDate? =
        runCatching { LocalDate.parse(s?.take(10)) }.getOrNull()

    private fun hitung() {
        val hariIni = LocalDate.now()
        val (mulai, sampai) = when (periode) {
            Periode.BULAN_INI  -> hariIni.withDayOfMonth(1) to hariIni
            Periode.BULAN_LALU -> {
                val awalLalu = hariIni.withDayOfMonth(1).minusMonths(1)
                awalLalu to awalLalu.withDayOfMonth(awalLalu.lengthOfMonth())
            }
            Periode.HARI_90    -> hariIni.minusDays(90) to hariIni
            Periode.SEMUA      -> null to hariIni
        }

        val dalamPeriode = semuaApp.filter { a ->
            if (mulai == null) return@filter true
            val t = parseTanggal(a.inputDate) ?: return@filter false
            !t.isBefore(mulai) && !t.isAfter(sampai)
        }

        val approve = dalamPeriode.count { it.status == "approve" }
        val reject  = dalamPeriode.count { it.status == "reject" }
        val aktif   = dalamPeriode.count { it.status in STATUS_AKTIF }
        // Rumus DISAMAKAN dengan Laporan Penjualan di web (approve / total berkas).
        // approve/(approve+reject) sebetulnya lebih adil karena berkas yang masih
        // berjalan belum bisa dinilai, tapi memakai rumus berbeda di dua platform
        // membuat owner melihat dua angka "konversi" yang bertentangan untuk
        // periode yang sama. Kalau definisinya mau diubah, ubah keduanya sekaligus.
        val konversi = if (dalamPeriode.isNotEmpty()) (approve * 100 / dalamPeriode.size) else 0

        val telat = semuaApp
            .filter { it.status in STATUS_AKTIF }
            .mapNotNull { a ->
                val t = parseTanggal(a.inputDate) ?: return@mapNotNull null
                val hari = ChronoUnit.DAYS.between(t, hariIni)
                if (hari > AMBANG_TERLAMBAT_HARI) BerkasTelat(a, hari) else null
            }
            .sortedByDescending { it.hari }

        val perAgen = dalamPeriode
            .groupBy { it.agentName ?: "—" }
            .map { (nama, list) -> RingkasAgen(nama, list.size, list.count { it.status == "approve" }) }
            .sortedByDescending { it.approve }

        _data.value = ReportData(
            totalBerkas = dalamPeriode.size,
            approve = approve,
            reject = reject,
            aktif = aktif,
            konversiPersen = konversi,
            nilaiApprove = dalamPeriode.filter { it.status == "approve" }
                .sumOf { it.approvePinjaman ?: it.pinjaman ?: 0 },
            komisiPaid = komisiPaid,
            komisiUnpaid = komisiUnpaid,
            terlambat = telat,
            perAgen = perAgen
        )
    }
}
