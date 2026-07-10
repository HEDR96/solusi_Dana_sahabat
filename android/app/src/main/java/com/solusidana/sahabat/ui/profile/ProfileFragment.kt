package com.solusidana.sahabat.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.text.InputType
import android.widget.EditText
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.data.AppLockManager
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.databinding.FragmentProfileBinding
import com.solusidana.sahabat.ui.lock.PatternLockView
import com.solusidana.sahabat.ui.login.LoginActivity

class ProfileFragment : Fragment() {

    private var _b: FragmentProfileBinding? = null
    private val b get() = _b!!

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentProfileBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val session = SessionManager(requireContext())

        b.tvName.text  = session.userName ?: "-"
        b.tvEmail.text = session.userEmail ?: "-"
        b.tvRole.text  = session.userRole?.let { roleLabel(it) } ?: "-"
        b.tvAvatar.text = session.userName?.take(1)?.uppercase() ?: "?"

        // ── Keamanan Login (PIN / Pola) ──
        val lock = AppLockManager(requireContext())
        updateLockStatus(lock)

        b.btnSetPin.setOnClickListener { showSetPinDialog(lock) }
        b.btnSetPattern.setOnClickListener { showSetPatternDialog(lock, isConfirm = false, firstPattern = null) }
        b.btnDisableLock.setOnClickListener {
            if (!lock.isEnabled) {
                Snackbar.make(b.root, "Kunci aplikasi belum aktif", Snackbar.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            MaterialAlertDialogBuilder(requireContext())
                .setTitle("Nonaktifkan Kunci")
                .setMessage("Aplikasi akan terbuka langsung tanpa PIN/pola. Lanjutkan?")
                .setPositiveButton("Nonaktifkan") { _, _ ->
                    lock.clear()
                    updateLockStatus(lock)
                    Snackbar.make(b.root, "Kunci aplikasi dinonaktifkan", Snackbar.LENGTH_SHORT).show()
                }
                .setNegativeButton("Batal", null)
                .show()
        }

        b.btnEditProfile.setOnClickListener {
            androidx.navigation.fragment.NavHostFragment.findNavController(this)
                .navigate(com.solusidana.sahabat.R.id.action_profile_to_edit)
        }

        // Master Data — hanya owner/super-admin yang bisa ubah dropdown sistem
        if (session.userRole in listOf("owner", "super-admin")) {
            b.btnMasterData.visibility = View.VISIBLE
            b.btnMasterData.setOnClickListener {
                androidx.navigation.fragment.NavHostFragment.findNavController(this)
                    .navigate(com.solusidana.sahabat.R.id.action_profile_to_masterdata)
            }
        }

        // Bebaskan app dari optimasi baterai supaya notifikasi 3 jam tetap jalan
        // walau app ditutup (penting di Xiaomi/Oppo/Vivo dsb.)
        b.btnBattery.setOnClickListener {
            val pm = requireContext().getSystemService(android.os.PowerManager::class.java)
            if (pm.isIgnoringBatteryOptimizations(requireContext().packageName)) {
                Snackbar.make(b.root, "✅ Sudah diizinkan — notifikasi latar belakang aktif", Snackbar.LENGTH_SHORT).show()
            } else {
                startActivity(Intent(
                    android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    android.net.Uri.parse("package:${requireContext().packageName}")
                ))
            }
        }

        b.btnLogout.setOnClickListener {
            MaterialAlertDialogBuilder(requireContext())
                .setTitle("Keluar")
                .setMessage("Yakin ingin keluar dari aplikasi?")
                .setPositiveButton("Keluar") { _, _ ->
                    session.clear()
                    startActivity(Intent(requireContext(), LoginActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    })
                }
                .setNegativeButton("Batal", null)
                .show()
        }
    }

    override fun onResume() {
        super.onResume()
        // Refresh nama setelah kembali dari Lengkapi Profil
        val session = SessionManager(requireContext())
        b.tvName.text = session.userName ?: "-"
        b.tvAvatar.text = session.userName?.take(1)?.uppercase() ?: "?"
    }

    private fun updateLockStatus(lock: AppLockManager) {
        b.tvLockStatus.text = when (lock.lockType) {
            AppLockManager.TYPE_PIN     -> "Kunci aplikasi: PIN aktif ✅"
            AppLockManager.TYPE_PATTERN -> "Kunci aplikasi: Pola aktif ✅"
            else                        -> "Kunci aplikasi: Nonaktif"
        }
    }

    private fun showSetPinDialog(lock: AppLockManager) {
        val et = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = "6 digit angka"
            setPadding(48, 32, 48, 16)
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Buat PIN Baru")
            .setView(et)
            .setPositiveButton("Lanjut") { _, _ ->
                val pin = et.text.toString()
                if (pin.length != 6) {
                    Snackbar.make(b.root, "PIN harus 6 digit", Snackbar.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                confirmPin(lock, pin)
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun confirmPin(lock: AppLockManager, firstPin: String) {
        val et = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = "Ulangi PIN"
            setPadding(48, 32, 48, 16)
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Konfirmasi PIN")
            .setView(et)
            .setPositiveButton("Simpan") { _, _ ->
                if (et.text.toString() == firstPin) {
                    lock.setLock(AppLockManager.TYPE_PIN, firstPin)
                    updateLockStatus(lock)
                    Snackbar.make(b.root, "PIN berhasil diatur 🔒", Snackbar.LENGTH_SHORT).show()
                } else {
                    Snackbar.make(b.root, "PIN tidak cocok, ulangi", Snackbar.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun showSetPatternDialog(lock: AppLockManager, isConfirm: Boolean, firstPattern: String?) {
        val pattern = PatternLockView(requireContext())
        val container = FrameLayout(requireContext()).apply {
            addView(pattern, FrameLayout.LayoutParams(
                resources.displayMetrics.density.let { (280 * it).toInt() },
                resources.displayMetrics.density.let { (280 * it).toInt() }
            ).apply { gravity = android.view.Gravity.CENTER })
            setPadding(0, 24, 0, 24)
        }
        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setTitle(if (isConfirm) "Ulangi Pola" else "Gambar Pola Baru (min. 4 titik)")
            .setView(container)
            .setNegativeButton("Batal", null)
            .create()

        pattern.onPatternComplete = { result ->
            if (result.isBlank()) {
                Snackbar.make(b.root, "Pola minimal 4 titik", Snackbar.LENGTH_SHORT).show()
            } else {
                dialog.dismiss()
                if (!isConfirm) {
                    showSetPatternDialog(lock, isConfirm = true, firstPattern = result)
                } else if (result == firstPattern) {
                    lock.setLock(AppLockManager.TYPE_PATTERN, result)
                    updateLockStatus(lock)
                    Snackbar.make(b.root, "Pola berhasil diatur 🔒", Snackbar.LENGTH_SHORT).show()
                } else {
                    Snackbar.make(b.root, "Pola tidak cocok, ulangi dari awal", Snackbar.LENGTH_SHORT).show()
                }
            }
        }
        dialog.show()
    }

    private fun roleLabel(role: String) = when (role) {
        "owner"       -> "Owner"
        "super-admin" -> "Super Admin"
        "admin"       -> "Admin / Back Office"
        "spv-agen"    -> "Supervisor Agen"
        "agen"        -> "Agen"
        "surveyor"    -> "Surveyor"
        "finance"     -> "Finance"
        else          -> role
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
