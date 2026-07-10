package com.solusidana.sahabat.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.data.AppLockManager
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.databinding.ActivityLoginBinding
import com.solusidana.sahabat.ui.lock.LockActivity
import com.solusidana.sahabat.ui.main.MainActivity

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val vm: LoginViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Auto-redirect jika sudah login (lewat gerbang kunci jika diaktifkan)
        if (SessionManager(this).isLoggedIn) {
            if (AppLockManager(this).isEnabled) {
                startActivity(Intent(this, LockActivity::class.java))
                finish()
            } else {
                startMain()
            }
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            vm.login(
                binding.etEmail.text.toString().trim(),
                binding.etPassword.text.toString()
            )
        }

        vm.state.observe(this) { state ->
            when (state) {
                is LoginState.Loading -> {
                    binding.btnLogin.isEnabled = false
                    binding.progressBar.visibility = View.VISIBLE
                }
                is LoginState.Success -> {
                    startMain()
                }
                is LoginState.Error -> {
                    binding.btnLogin.isEnabled = true
                    binding.progressBar.visibility = View.GONE
                    Snackbar.make(binding.root, state.message, Snackbar.LENGTH_LONG).show()
                }
                else -> {
                    binding.btnLogin.isEnabled = true
                    binding.progressBar.visibility = View.GONE
                }
            }
        }
    }

    private fun startMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
