package com.solusidana.sahabat.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import kotlinx.coroutines.launch

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    object Success : LoginState()
    data class Error(val message: String) : LoginState()
}

class LoginViewModel(app: Application) : AndroidViewModel(app) {

    private val session = SessionManager(app)

    private val _state = MutableLiveData<LoginState>(LoginState.Idle)
    val state: LiveData<LoginState> = _state

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _state.value = LoginState.Error("Email dan password wajib diisi")
            return
        }
        viewModelScope.launch {
            _state.value = LoginState.Loading
            SupabaseApi.login(email, password)
                .onSuccess { auth ->
                    SupabaseApi.getProfile(auth.accessToken, auth.user.id)
                        .onSuccess { profile ->
                            session.accessToken  = auth.accessToken
                            session.refreshToken = auth.refreshToken
                            session.userId      = auth.user.id
                            session.userEmail   = auth.user.email
                            session.userName    = profile.name
                            session.userRole    = profile.role
                            session.agentId     = profile.agentId
                            _state.value = LoginState.Success
                        }
                        .onFailure { profileErr ->
                            // Profil tidak ditemukan — tolak login, jangan assume role agen
                            _state.value = LoginState.Error(
                                "Akun ditemukan tapi profil belum dikonfigurasi. Hubungi administrator."
                            )
                        }
                }
                .onFailure { e ->
                    _state.value = LoginState.Error(
                        when {
                            e.message?.contains("401") == true || e.message?.contains("400") == true ->
                                "Email atau password salah"
                            else -> "Gagal terhubung. Periksa koneksi internet."
                        }
                    )
                }
        }
    }
}
