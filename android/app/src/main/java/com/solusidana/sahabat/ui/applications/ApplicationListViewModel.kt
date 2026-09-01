package com.solusidana.sahabat.ui.applications

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.solusidana.sahabat.data.Application as App
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.humanError
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString

class ApplicationListViewModel(application: Application) : AndroidViewModel(application) {

    private val session = SessionManager(application)
    private val cache = application.getSharedPreferences("apps_cache", Context.MODE_PRIVATE)

    private val _apps = MutableLiveData<List<App>>(emptyList())
    val apps: LiveData<List<App>> = _apps

    private val _loading = MutableLiveData(false)
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private var allApps = listOf<App>()
    var currentFilter = "all"
    var currentQuery  = ""
    var needsRefresh  = false

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null

            // Tampilkan cache dulu supaya layar tidak kosong saat koneksi lambat/putus
            if (allApps.isEmpty()) {
                cache.getString("apps", null)?.let { saved ->
                    runCatching { SupabaseApi.json.decodeFromString<List<App>>(saved) }
                        .onSuccess { allApps = it; applyFilter() }
                }
            }

            val token = session.accessToken ?: run {
                // Tanpa ini _loading tetap true selamanya kalau token belum siap
                // (mis. tepat setelah tap notifikasi, refreshSession() di
                // MainActivity belum selesai) — spinner nyangkut tanpa pesan.
                // Tetap set _error walau ada cache — Fragment yang memutuskan
                // menampilkannya sebagai layar penuh atau toast singkat, supaya
                // kegagalan refresh tidak pernah senyap total.
                _error.value = "Sesi belum aktif — coba buka ulang aplikasi"
                _loading.value = false
                return@launch
            }
            val agentId = if (session.userRole == "agen") session.agentId else null

            SupabaseApi.getApplications(token, agentId = agentId)
                .onSuccess { list ->
                    allApps = list
                    applyFilter()
                    runCatching { cache.edit().putString("apps", SupabaseApi.json.encodeToString(list)).apply() }
                }
                .onFailure {
                    _error.value = humanError(it)
                }
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
