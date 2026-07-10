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

    val isAgen get() = session.userRole == "agen"

    fun loadOptions() {
        viewModelScope.launch {
            val token = session.accessToken ?: return@launch
            _masterOptions.value = MasterData.load(getApplication(), token)
            SupabaseApi.getLeasingPartners(token).onSuccess { list ->
                _leasing.value = list.filter { it.status == null || it.status == "aktif" }
            }
            if (!isAgen) {
                SupabaseApi.getAgents(token).onSuccess { list ->
                    _agents.value = list.filter { it.status == "aktif" }
                }
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
            val token = session.accessToken ?: return@launch

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
            // fallback hitung jumlah jika RPC belum di-migrate
            var idResult = SupabaseApi.nextBrkId(token)
            if (idResult.isFailure) {
                idResult = SupabaseApi.getApplicationsCount(token).map { count ->
                    "BRK" + (2026000 + count + 1).toString().padStart(7, '0')
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
                .onFailure {
                    // Gagal kirim (kemungkinan koneksi putus) → draft
                    saveDraft(agentId, agentName, customerName, nik, phone, city, address,
                        unitType, unitBrand, unitYear, pinjaman, tenor, angsuran,
                        leasingPartner, notes)
                    _state.value = FormState.SavedAsDraft
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
