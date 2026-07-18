package com.solusidana.sahabat.ui.applications

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.solusidana.sahabat.data.Agent
import com.solusidana.sahabat.data.ApplicationDraft
import com.solusidana.sahabat.data.DraftStore
import com.solusidana.sahabat.data.LeasingPartner
import com.solusidana.sahabat.data.MasterData
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.humanError
import com.solusidana.sahabat.worker.DraftSyncWorker
import kotlinx.coroutines.launch

sealed class FormState {
    object Idle : FormState()
    object Saving : FormState()
    data class Saved(val appId: String) : FormState()
    object SavedAsDraft : FormState()
    data class Error(val message: String) : FormState()
}

class ApplicationFormViewModel(application: Application) : AndroidViewModel(application) {

    private val session = SessionManager(application)

    private val _leasing = MutableLiveData<List<LeasingPartner>>(emptyList())
    val leasing: LiveData<List<LeasingPartner>> = _leasing

    private val _agents = MutableLiveData<List<Agent>>(emptyList())
    val agents: LiveData<List<Agent>> = _agents

    // Opsi dropdown dari master_options (fallback default jika offline/belum migrate)
    private val _masterOptions = MutableLiveData<Map<String, List<String>>>(emptyMap())
    val masterOptions: LiveData<Map<String, List<String>>> = _masterOptions

    private val _state = MutableLiveData<FormState>(FormState.Idle)
    val state: LiveData<FormState> = _state

    // Gagal memuat dropdown (leasing/agen) — tampilkan ke user, jangan diam-diam
    private val _loadError = MutableLiveData<String?>(null)
    val loadError: LiveData<String?> = _loadError

    val isAgen get() = session.userRole == "agen"

    fun loadOptions() {
        viewModelScope.launch {
            _loadError.value = null
            // Token kadaluarsa ~1 jam — refresh dulu agar request tidak 401 diam-diam
            // (dulu: 401 senyap → adapter leasing kosong → dropdown "tidak muncul apa-apa")
            SupabaseApi.refreshSession(session)
            val token = session.accessToken ?: run {
                _loadError.value = "Sesi berakhir — silakan login ulang"
                return@launch
            }
            _masterOptions.value = MasterData.load(getApplication(), token)
            SupabaseApi.getLeasingPartners(token)
                .onSuccess { list ->
                    val aktif = list.filter { it.status == null || it.status == "aktif" }
                    _leasing.value = aktif
                    if (aktif.isEmpty()) _loadError.value = "Belum ada leasing aktif — hubungi admin"
                }
                // Tampilkan pesan ASLI dari server/exception — pesan generik "periksa
                // koneksi" dulu menutupi penyebab sebenarnya (mis. RLS/auth), bukan cuma jaringan.
                .onFailure { e -> _loadError.value = "Gagal memuat daftar leasing: ${humanError(e)}" }
            if (!isAgen) {
                SupabaseApi.getAgents(token).onSuccess { list ->
                    val aktif = list.filter { it.status == "aktif" }
                    // SPV hanya boleh menginput atas nama agen binaannya (paritas web)
                    _agents.value = if (session.userRole == "spv-agen")
                        aktif.filter { it.spvId == session.userId }
                    else aktif
                }.onFailure { e -> _loadError.value = "Gagal memuat daftar agen: ${humanError(e)}" }
            }
        }
    }

    fun save(
        agent: Agent?,           // null jika role agen (pakai session)
        customerName: String,
        nik: String,
        phone: String,
        city: String,
        address: String,
        unitType: String,
        unitBrand: String,
        unitYear: String,
        pinjaman: Long,
        tenor: Int,
        leasingPartner: LeasingPartner,
        notes: String
    ) {
        viewModelScope.launch {
            _state.value = FormState.Saving
            val token = session.accessToken ?: run {
                _state.value = FormState.Error("Sesi berakhir. Silakan login ulang.")
                return@launch
            }

            val agentId: String
            val agentName: String
            if (isAgen) {
                agentId   = session.agentId ?: ""
                agentName = session.userName ?: ""
            } else {
                if (agent == null) {
                    _state.value = FormState.Error("Pilih agen terlebih dahulu")
                    return@launch
                }
                agentId   = agent.id
                agentName = agent.name
            }

            // Estimasi angsuran flat sederhana: (pokok + bunga) / tenor
            val rate = leasingPartner.rate ?: 1.5
            val bunga = (pinjaman * rate / 100 * tenor / 12).toLong()
            val angsuran = if (tenor > 0) (pinjaman + bunga) / tenor else 0

            // Nomor berkas dari sequence DB (anti-tabrakan);
            // fallback max(ID)+1 jika RPC belum di-migrate (count+1 rawan duplikat)
            var idResult = SupabaseApi.nextBrkId(token)
            if (idResult.isFailure) {
                idResult = SupabaseApi.getMaxApplicationNumber(token).map { maxNum ->
                    "BRK" + (maxNum + 1).toString().padStart(7, '0')
                }
            }

            if (idResult.isFailure) {
                // Offline → simpan draft, sync otomatis saat online
                saveDraft(agentId, agentName, customerName, nik, phone, city, address,
                    unitType, unitBrand, unitYear, pinjaman, tenor, angsuran,
                    leasingPartner, notes)
                _state.value = FormState.SavedAsDraft
                return@launch
            }

            val newId = idResult.getOrThrow()

            SupabaseApi.insertApplication(
                token, newId, agentId, agentName, customerName, nik, phone, city, address,
                unitType, unitBrand, unitYear, pinjaman, tenor, angsuran,
                leasingPartner.id, leasingPartner.name, notes
            )
                .onSuccess { _state.value = FormState.Saved(newId) }
                .onFailure { e ->
                    // Hanya gangguan jaringan yang layak jadi draft. Error server
                    // (403 RLS, data tidak valid) HARUS tampil ke user — kalau
                    // disamarkan jadi draft, sync worker akan retry selamanya
                    // dan berkas tidak pernah benar-benar masuk.
                    if (e is java.io.IOException) {
                        saveDraft(agentId, agentName, customerName, nik, phone, city, address,
                            unitType, unitBrand, unitYear, pinjaman, tenor, angsuran,
                            leasingPartner, notes)
                        _state.value = FormState.SavedAsDraft
                    } else {
                        _state.value = FormState.Error(e.message ?: "Gagal menyimpan berkas")
                    }
                }
        }
    }

    private fun saveDraft(
        agentId: String, agentName: String, customerName: String, nik: String,
        phone: String, city: String, address: String, unitType: String,
        unitBrand: String, unitYear: String, pinjaman: Long, tenor: Int,
        angsuran: Long, leasingPartner: LeasingPartner, notes: String
    ) {
        DraftStore(getApplication<Application>()).add(
            ApplicationDraft(
                agentId = agentId, agentName = agentName, customerName = customerName,
                nik = nik, phone = phone, city = city, address = address,
                unitType = unitType, unitBrand = unitBrand, unitYear = unitYear,
                pinjaman = pinjaman, tenor = tenor, estimasiAngsuran = angsuran,
                leasingId = leasingPartner.id, leasingName = leasingPartner.name, notes = notes
            )
        )
        // Jadwalkan sync saat jaringan tersedia
        val request = OneTimeWorkRequestBuilder<DraftSyncWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()
        WorkManager.getInstance(getApplication<Application>()).enqueue(request)
    }
}
