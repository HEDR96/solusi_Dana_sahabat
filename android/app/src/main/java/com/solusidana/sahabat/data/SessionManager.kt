package com.solusidana.sahabat.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class SessionManager(context: Context) {

    private val prefs: SharedPreferences = try {
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        EncryptedSharedPreferences.create(
            "session_secure",
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (_: Exception) {
        // Fallback ke plain prefs jika perangkat tidak support keystore (sangat jarang)
        context.getSharedPreferences("session", Context.MODE_PRIVATE)
    }

    var accessToken: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(v) = prefs.edit().putString(KEY_TOKEN, v).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH, null)
        set(v) = prefs.edit().putString(KEY_REFRESH, v).apply()

    var userId: String?
        get() = prefs.getString(KEY_USER_ID, null)
        set(v) = prefs.edit().putString(KEY_USER_ID, v).apply()

    var userName: String?
        get() = prefs.getString(KEY_NAME, null)
        set(v) = prefs.edit().putString(KEY_NAME, v).apply()

    var userEmail: String?
        get() = prefs.getString(KEY_EMAIL, null)
        set(v) = prefs.edit().putString(KEY_EMAIL, v).apply()

    var userRole: String?
        get() = prefs.getString(KEY_ROLE, null)
        set(v) = prefs.edit().putString(KEY_ROLE, v).apply()

    var agentId: String?
        get() = prefs.getString(KEY_AGENT_ID, null)
        set(v) = prefs.edit().putString(KEY_AGENT_ID, v).apply()

    val isLoggedIn: Boolean get() = accessToken != null

    fun clear() = prefs.edit().clear().apply()

    companion object {
        private const val KEY_TOKEN    = "access_token"
        private const val KEY_REFRESH  = "refresh_token"
        private const val KEY_USER_ID  = "user_id"
        private const val KEY_NAME     = "user_name"
        private const val KEY_EMAIL    = "user_email"
        private const val KEY_ROLE     = "user_role"
        private const val KEY_AGENT_ID = "agent_id"
    }
}
