package com.solusidana.sahabat.ui.agents

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.solusidana.sahabat.data.Agent
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import kotlinx.coroutines.launch

class AgentViewModel(app: Application) : AndroidViewModel(app) {

    private val session = SessionManager(app)

    private val _agents = MutableLiveData<List<Agent>>(emptyList())
    val agents: LiveData<List<Agent>> = _agents

    private val _loading = MutableLiveData(false)
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private var allAgents = listOf<Agent>()

    fun load() {
        viewModelScope.launch {
            _loading.value = true
            _error.value = null
            val token = session.accessToken ?: return@launch
            SupabaseApi.getAgents(token)
                .onSuccess { list ->
                    allAgents = list
                    _agents.value = list
                }
                .onFailure { _error.value = it.message }
            _loading.value = false
        }
    }

    fun filter(query: String) {
        val q = query.lowercase()
        _agents.value = if (q.isBlank()) allAgents
        else allAgents.filter {
            it.name.lowercase().contains(q) ||
            it.city?.lowercase()?.contains(q) == true ||
            it.phone?.contains(q) == true
        }
    }
}
