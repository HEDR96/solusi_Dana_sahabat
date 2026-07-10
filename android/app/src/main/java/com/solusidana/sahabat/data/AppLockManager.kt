package com.solusidana.sahabat.data

import android.content.Context
import java.security.MessageDigest
import java.security.SecureRandom

/**
 * Kunci aplikasi lokal (PIN 6 digit atau pola 3x3).
 * Nilai disimpan sebagai SHA-256(salt + nilai) — tidak pernah plaintext.
 */
class AppLockManager(context: Context) {

    private val prefs = context.getSharedPreferences("app_lock", Context.MODE_PRIVATE)

    val lockType: String
        get() = prefs.getString(KEY_TYPE, TYPE_NONE) ?: TYPE_NONE

    val isEnabled: Boolean get() = lockType != TYPE_NONE

    fun setLock(type: String, value: String) {
        val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
            .joinToString("") { "%02x".format(it) }
        prefs.edit()
            .putString(KEY_TYPE, type)
            .putString(KEY_SALT, salt)
            .putString(KEY_HASH, hash(salt + value))
            .apply()
    }

    fun verify(value: String): Boolean {
        val salt = prefs.getString(KEY_SALT, null) ?: return false
        val stored = prefs.getString(KEY_HASH, null) ?: return false
        return hash(salt + value) == stored
    }

    fun clear() = prefs.edit().clear().apply()

    /** Timestamp terakhir app aktif — untuk re-lock setelah idle di background. */
    var lastActiveAt: Long
        get() = prefs.getLong(KEY_LAST_ACTIVE, 0L)
        set(v) = prefs.edit().putLong(KEY_LAST_ACTIVE, v).apply()

    fun shouldRelock(idleMs: Long = 60_000): Boolean =
        isEnabled && lastActiveAt > 0 && System.currentTimeMillis() - lastActiveAt > idleMs

    private fun hash(input: String): String =
        MessageDigest.getInstance("SHA-256")
            .digest(input.toByteArray())
            .joinToString("") { "%02x".format(it) }

    companion object {
        const val TYPE_NONE    = "none"
        const val TYPE_PIN     = "pin"
        const val TYPE_PATTERN = "pattern"
        private const val KEY_TYPE = "type"
        private const val KEY_SALT = "salt"
        private const val KEY_HASH = "hash"
        private const val KEY_LAST_ACTIVE = "last_active"
    }
}
