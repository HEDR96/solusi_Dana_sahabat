package com.solusidana.sahabat.ui.commission

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.solusidana.sahabat.data.Commission
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import kotlinx.coroutines.launch

data class CommissionSummary(
    val total: Long,
    val paid: Long,
    val unpaid: Long,
    val items: List<Commission>
)

class CommissionViewModel(app: Application) : AndroidViewModel(app) {

    private val session = SessionManager(app)

    private val _summary = MutableLiveData<CommissionSummary?>()
    val summary: LiveData<CommissionSummary?> = _summary

    private val _loading = MutableLiveData(false)
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            val token   = session.accessToken ?: return@launch
            val agentId = if (session.userRole == "agen") session.agentId else null

            SupabaseApi.getCommissions(token, agentId)
                .onSuccess { list ->
                    _summary.value = CommissionSummary(
                        total  = list.sumOf { it.commissionAmount ?: 0 },
                        paid   = list.filter { it.status == "paid" }.sumOf { it.commissionAmount ?: 0 },
                        unpaid = list.filter { it.status == "unpaid" }.sumOf { it.commissionAmount ?: 0 },
                        items  = list
                    )
                }
                .onFailure { _error.value = it.message }
            _loading.value = false
        }
    }
}
