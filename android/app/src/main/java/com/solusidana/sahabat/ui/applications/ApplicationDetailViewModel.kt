package com.solusidana.sahabat.ui.applications

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.solusidana.sahabat.data.Application as App
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.StatusLog
import com.solusidana.sahabat.data.SupabaseApi
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

sealed class DetailState {
    object Loading : DetailState()
    data class Success(val app: App, val logs: List<StatusLog>) : DetailState()
    data class Error(val message: String) : DetailState()
}

sealed class UpdateState {
    object Idle : UpdateState()
    object Saving : UpdateState()
    object Done : UpdateState()
    data class Error(val message: String) : UpdateState()
}

sealed class DeleteState {
    object Idle : DeleteState()
    object Deleting : DeleteState()
    object Done : DeleteState()
    data class Error(val message: String) : DeleteState()
}

class ApplicationDetailViewModel(application: Application) : AndroidViewModel(application) {

    private val session = SessionManager(application)

    private val _detail = MutableLiveData<DetailState>()
    val detail: LiveData<DetailState> = _detail

    private val _update = MutableLiveData<UpdateState>(UpdateState.Idle)
    val update: LiveData<UpdateState> = _update

    private val _delete = MutableLiveData<DeleteState>(DeleteState.Idle)
    val delete: LiveData<DeleteState> = _delete

    fun load(appId: String) {
        viewModelScope.launch {
            _detail.value = DetailState.Loading
            // Refresh sesi dulu — cold start dari tap notifikasi sering membuat token
            // belum diperbarui saat load() dipanggil, sehingga API request pakai token
            // expired → 401 → spinner tidak pernah hilang karena error tidak terlihat.
            // refreshSession ber-throttle 60 detik jadi tidak menambah latensi jika
            // token masih segar.
            SupabaseApi.refreshSession(session)
            val token = session.accessToken ?: run {
                _detail.value = DetailState.Error("Sesi belum aktif — coba buka ulang aplikasi")
                return@launch
            }

            // Dua request berjalan PARALEL (bukan berurutan) — di sinyal lemah,
            // menjalankan satu-satu bisa membuat spinner terasa nyangkut lama
            // setelah tap notifikasi (lihat DashboardViewModel, pola yang sama).
            val appDef  = async { SupabaseApi.getApplicationById(token, appId) }
            val logsDef = async { SupabaseApi.getStatusLogs(token, appId) }
            val appResult  = appDef.await()
            val logsResult = logsDef.await()

            if (appResult.isSuccess) {
                _detail.value = DetailState.Success(
                    app  = appResult.getOrThrow(),
                    logs = logsResult.getOrDefault(emptyList())
                )
            } else {
                _detail.value = DetailState.Error(appResult.exceptionOrNull()?.message ?: "Error")
            }
        }
    }

    fun editFields(appId: String, fields: Map<String, Any?>) {
        viewModelScope.launch {
            _update.value = UpdateState.Saving
            val token = session.accessToken ?: run {
                _update.value = UpdateState.Error("Sesi belum aktif — coba buka ulang aplikasi")
                return@launch
            }
            SupabaseApi.updateApplicationFields(token, appId, fields)
                .onSuccess {
                    load(appId)
                    _update.value = UpdateState.Done
                }
                .onFailure {
                    _update.value = UpdateState.Error(it.message ?: "Gagal menyimpan perubahan")
                }
        }
    }

    fun deleteApplication(appId: String) {
        viewModelScope.launch {
            _delete.value = DeleteState.Deleting
            val token = session.accessToken ?: run {
                _delete.value = DeleteState.Error("Sesi belum aktif — coba buka ulang aplikasi")
                return@launch
            }
            SupabaseApi.deleteApplication(token, appId)
                .onSuccess { _delete.value = DeleteState.Done }
                .onFailure { _delete.value = DeleteState.Error(it.message ?: "Gagal menghapus berkas") }
        }
    }

    fun updateStatus(
        appId: String,
        newStatus: String,
        notes: String,
        surveyDate: String,
        surveyTime: String
    ) {
        viewModelScope.launch {
            _update.value = UpdateState.Saving
            val token = session.accessToken ?: run {
                _update.value = UpdateState.Error("Sesi belum aktif — coba buka ulang aplikasi")
                return@launch
            }
            val userName = session.userName ?: "User"

            // Berkas yang sedang tampil — untuk from_status di riwayat dan nilai
            // approve_pinjaman (dibutuhkan trigger komisi di DB)
            val current = (_detail.value as? DetailState.Success)?.app
            val approvePinjaman = if (newStatus == "approve")
                (current?.approvePinjaman ?: current?.pinjaman) else null

            SupabaseApi.updateApplicationStatus(
                token, appId, newStatus, notes, surveyDate, surveyTime, userName,
                fromStatus = current?.status,
                approvePinjaman = approvePinjaman
            )
                .onSuccess {
                    load(appId)
                    _update.value = UpdateState.Done
                }
                .onFailure {
                    _update.value = UpdateState.Error(it.message ?: "Gagal update status")
                }
        }
    }
}
