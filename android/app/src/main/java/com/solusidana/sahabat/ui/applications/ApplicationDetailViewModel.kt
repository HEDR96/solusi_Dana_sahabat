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

class ApplicationDetailViewModel(application: Application) : AndroidViewModel(application) {

    private val session = SessionManager(application)

    private val _detail = MutableLiveData<DetailState>()
    val detail: LiveData<DetailState> = _detail

    private val _update = MutableLiveData<UpdateState>(UpdateState.Idle)
    val update: LiveData<UpdateState> = _update

    fun load(appId: String) {
        viewModelScope.launch {
            _detail.value = DetailState.Loading
            val token = session.accessToken ?: return@launch

            val appResult  = SupabaseApi.getApplicationById(token, appId)
            val logsResult = SupabaseApi.getStatusLogs(token, appId)

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

    fun updateStatus(
        appId: String,
        newStatus: String,
        notes: String,
        surveyDate: String,
        surveyTime: String
    ) {
        viewModelScope.launch {
            _update.value = UpdateState.Saving
            val token    = session.accessToken ?: return@launch
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
