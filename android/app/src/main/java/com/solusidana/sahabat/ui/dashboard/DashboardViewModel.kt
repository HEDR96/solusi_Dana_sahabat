package com.solusidana.sahabat.ui.dashboard

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.solusidana.sahabat.data.Agent
import com.solusidana.sahabat.data.Application as App
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.humanError
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

data class DashboardData(
    val totalBerkas: Int,
    val pending: Int,
    val approve: Int,
    val reject: Int,
    val recentApps: List<App>,
    val todaySurveys: List<App> = emptyList(),
    val leaderboard: List<Agent> = emptyList(),
    val myTarget: Int? = null,          // target bulanan (role agen)
    val myMonthCount: Int? = null       // berkas masuk bulan ini (role agen)
)

class DashboardViewModel(application: Application) : AndroidViewModel(application) {

    private val session = SessionManager(application)

    private val _data = MutableLiveData<DashboardData?>()
    val data: LiveData<DashboardData?> = _data

    private val _loading = MutableLiveData(false)
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            val token = session.accessToken ?: return@launch
            val agentId = if (session.userRole == "agen") session.agentId else null

            // Tiga request berjalan PARALEL — jauh lebih cepat di sinyal lemah
            val surveysDef = async { SupabaseApi.getTodaySurveys(token, agentId) }
            val agentsDef  = async { SupabaseApi.getAgents(token) }
            val appsDef    = async { SupabaseApi.getApplications(token, agentId = agentId) }

            val surveys   = surveysDef.await().getOrDefault(emptyList())
            val allAgents = agentsDef.await().getOrDefault(emptyList())

            // Top 5 agen berdasarkan total approve
            val leaderboard = allAgents
                .filter { (it.totalApprove ?: 0) > 0 }
                .sortedByDescending { it.totalApprove ?: 0 }
                .take(5)

            appsDef.await()
                .onSuccess { apps ->
                    // Target bulanan untuk role agen
                    var myTarget: Int? = null
                    var myMonthCount: Int? = null
                    if (agentId != null) {
                        myTarget = allAgents.find { it.id == agentId }?.target
                        val thisMonth = java.text.SimpleDateFormat("yyyy-MM", java.util.Locale.getDefault())
                            .format(java.util.Date())
                        myMonthCount = apps.count { it.inputDate?.startsWith(thisMonth) == true }
                    }

                    _data.value = DashboardData(
                        totalBerkas = apps.size,
                        pending     = apps.count { it.status !in setOf("approve","reject","cancel") },
                        approve     = apps.count { it.status == "approve" },
                        reject      = apps.count { it.status == "reject" },
                        recentApps  = apps.take(5),
                        todaySurveys = surveys,
                        leaderboard  = leaderboard,
                        myTarget     = myTarget,
                        myMonthCount = myMonthCount
                    )
                }
                .onFailure { _error.value = humanError(it) }

            _loading.value = false
        }
    }
}
