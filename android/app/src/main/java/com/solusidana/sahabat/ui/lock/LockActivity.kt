package com.solusidana.sahabat.ui.lock

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import com.solusidana.sahabat.data.AppLockManager
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.databinding.ActivityLockBinding
import com.solusidana.sahabat.ui.login.LoginActivity
import com.solusidana.sahabat.ui.main.MainActivity

/**
 * Gerbang kunci lokal: muncul saat buka app jika PIN/pola sudah diatur.
 */
class LockActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLockBinding
    private lateinit var lock: AppLockManager
    private var attempts = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLockBinding.inflate(layoutInflater)
        setContentView(binding.root)
        lock = AppLockManager(this)

        when (lock.lockType) {
            AppLockManager.TYPE_PIN -> {
                binding.tvTitle.text = "Masukkan PIN"
                binding.pinContainer.isVisible = true
                binding.btnUnlock.setOnClickListener {
                    check(binding.etPin.text.toString())
                }
            }
            AppLockManager.TYPE_PATTERN -> {
                binding.tvTitle.text = "Gambar Pola"
                binding.patternView.isVisible = true
                binding.patternView.onPatternComplete = { pattern ->
                    if (pattern.isNotBlank()) check(pattern)
                }
            }
            else -> { unlock(); return }
        }

        binding.btnUseEmail.setOnClickListener {
            // Fallback: hapus session & kunci, kembali ke login email
            SessionManager(this).clear()
            lock.clear()
            startActivity(Intent(this, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            })
            finish()
        }
    }

    private fun check(value: String) {
        if (lock.verify(value)) {
            unlock()
        } else {
            attempts++
            binding.etPin.setText("")
            binding.tvError.text = if (attempts >= 5)
                "Terlalu banyak percobaan. Gunakan login email."
            else
                "Salah, coba lagi ($attempts/5)"
        }
    }

    private fun unlock() {
        lock.lastActiveAt = System.currentTimeMillis()
        if (intent.getBooleanExtra(EXTRA_RELOCK, false)) {
            // Dipanggil di atas MainActivity yang sudah ada — cukup tutup
            finish()
        } else {
            startActivity(Intent(this, MainActivity::class.java).apply {
                putExtra(MainActivity.EXTRA_JUST_UNLOCKED, true)
            })
            finish()
        }
    }

    companion object {
        const val EXTRA_RELOCK = "relock"
    }

    // Tombol back tidak boleh melewati kunci
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        moveTaskToBack(true)
    }
}
