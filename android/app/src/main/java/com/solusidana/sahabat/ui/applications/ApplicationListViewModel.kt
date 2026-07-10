package com.solusidana.sahabat.ui.applications

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.solusidana.sahabat.data.Application as App
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import kotlinx.coroutines.launch

class ApplicationListViewModel(application: Application) : AndroidViewModel(application) {

    private val session = SessionManager(application)

    private val _apps = MutableLiveData<List<App>>(emptyList())
    val apps: LiveData<List<App>> = _apps

    private val _loading = MutableLiveData(false)
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private var allApps = listOf<App>()
    var currentFilter = "all"
    var currentQuery  = ""

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            val token   = session.accessToken ?: return@launch
            val agentId = if (session.userRole == "agen") session.agentId else null

            SupabaseApi.getApplications(token, agentId = agentId)
                .onSuccess { list ->
                    allApps = list
                    applyFilter()
                }
                .onFailure { _error.value = it.message }
            _loading.value = false
        }
    }

    fun setFilter(status: String) {
        currentFilter = status
        applyFilter()
    }

    fun search(query: String) {
        currentQuery = query
        applyFilter()
    }

    private fun applyFilter() {
        val q = currentQuery.lowercase()
        _apps.value = allApps.filter { app ->
            val matchStatus = currentFilter == "all" || app.status == currentFilter
            val matchQuery  = q.isBlank() ||
                app.customerName.lowercase().contains(q) ||
                app.id.lowercase().contains(q) ||
                app.agentName?.lowercase()?.contains(q) == true
            matchStatus && matchQuery
        }
    }
}
