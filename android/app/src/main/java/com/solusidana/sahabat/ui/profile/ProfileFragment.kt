package com.solusidana.sahabat.ui.profile

import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.GridLayout
import android.widget.LinearLayout
import android.widget.TextView
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

    companion object {
        private const val PIN_LENGTH = 6
    }

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

        b.btnCommission.setOnClickListener {
            androidx.navigation.fragment.NavHostFragment.findNavController(this)
                .navigate(com.solusidana.sahabat.R.id.action_profile_to_commission)
        }

        // Agen dipindah dari bottom nav ke sini (bottom nav slot itu sekarang Aktivitas)
        b.btnAgents.setOnClickListener {
            androidx.navigation.fragment.NavHostFragment.findNavController(this)
                .navigate(com.solusidana.sahabat.R.id.action_profile_to_agents)
        }

        b.btnEditProfile.setOnClickListener {
            androidx.navigation.fragment.NavHostFragment.findNavController(this)
                .navigate(com.solusidana.sahabat.R.id.action_profile_to_edit)
        }

        // Master Data — hanya owner/super-admin yang bisa ubah dropdown sistem
        if (session.userRole in listOf("owner", "super-admin")) {
            b.btnMasterData.visibility = View.VISIBLE
            b.dividerMasterData.visibility = View.VISIBLE
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
        // Dipanggil dari callback dialog — view fragment bisa saja sudah hancur
        _b?.tvLockStatus?.text = when (lock.lockType) {
            AppLockManager.TYPE_PIN     -> "Kunci aplikasi: PIN aktif ✅"
            AppLockManager.TYPE_PATTERN -> "Kunci aplikasi: Pola aktif ✅"
            else                        -> "Kunci aplikasi: Nonaktif"
        }
    }

    /** Snackbar aman: tidak crash bila callback dialog berjalan setelah view hancur. */
    private fun snack(msg: String) {
        val root = _b?.root
        if (root != null) Snackbar.make(root, msg, Snackbar.LENGTH_SHORT).show()
        else context?.let { android.widget.Toast.makeText(it, msg, android.widget.Toast.LENGTH_SHORT).show() }
    }

    private fun showSetPinDialog(lock: AppLockManager) {
        showPinKeypadDialog("Buat PIN Baru", "Ketuk $PIN_LENGTH digit angka") { pin ->
            confirmPin(lock, pin)
        }
    }

    private fun confirmPin(lock: AppLockManager, firstPin: String) {
        showPinKeypadDialog("Ulangi PIN", "Ulangi $PIN_LENGTH digit yang sama") { pin ->
            if (pin == firstPin) {
                lock.setLock(AppLockManager.TYPE_PIN, firstPin)
                updateLockStatus(lock)
                snack("PIN berhasil diatur 🔒")
            } else {
                snack("PIN tidak cocok, ulangi dari awal")
            }
        }
    }

    /**
     * Dialog PIN dengan keypad angka (klik 0-9), bukan keyboard ketik.
     * Auto-lanjut begitu [PIN_LENGTH] digit terisi.
     */
    private fun showPinKeypadDialog(title: String, subtitle: String, onComplete: (String) -> Unit) {
        val ctx = requireContext()
        val density = resources.displayMetrics.density
        fun dp(v: Int) = (v * density).toInt()

        var entered = ""
        val dots = mutableListOf<View>()

        val root = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(8), dp(24), dp(8))
        }
        root.addView(TextView(ctx).apply {
            text = subtitle; textSize = 13f; setTextColor(0xFF64748B.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(16))
        })

        val dotsRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
                .also { it.bottomMargin = dp(20) }
        }
        repeat(PIN_LENGTH) {
            val dot = View(ctx).apply {
                layoutParams = LinearLayout.LayoutParams(dp(12), dp(12)).also { it.marginStart = dp(6); it.marginEnd = dp(6) }
                background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(0xFFE2E8F0.toInt()) }
            }
            dots.add(dot)
            dotsRow.addView(dot)
        }
        root.addView(dotsRow)

        fun refreshDots() {
            dots.forEachIndexed { i, dot ->
                (dot.background as GradientDrawable).setColor(if (i < entered.length) 0xFF2563EB.toInt() else 0xFFE2E8F0.toInt())
            }
        }

        val dialog = MaterialAlertDialogBuilder(ctx)
            .setTitle(title)
            .setView(root)
            .setNegativeButton("Batal", null)
            .create()

        val grid = GridLayout(ctx).apply {
            columnCount = 3
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        }
        // Susunan keypad standar: 1-9 lalu baris terakhir kosong / 0 / hapus
        listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫").forEach { label ->
            val btn = com.google.android.material.button.MaterialButton(
                ctx, null, com.google.android.material.R.attr.materialButtonOutlinedStyle
            ).apply {
                text = label
                textSize = 20f
                cornerRadius = dp(28)
                layoutParams = GridLayout.LayoutParams().apply {
                    width = dp(64); height = dp(64)
                    setMargins(dp(8), dp(8), dp(8), dp(8))
                }
                visibility = if (label.isEmpty()) View.INVISIBLE else View.VISIBLE
            }
            btn.setOnClickListener {
                when (label) {
                    "⌫" -> if (entered.isNotEmpty()) entered = entered.dropLast(1)
                    else -> if (entered.length < PIN_LENGTH) entered += label
                }
                refreshDots()
                if (entered.length == PIN_LENGTH) {
                    val result = entered
                    // Sama seperti fix pola: dialog TIDAK BOLEH dibubarkan langsung
                    // di sini — masih di dalam dispatch touch event tombol ini
                    // sendiri di window dialog. Tunda ke giliran berikutnya.
                    btn.post {
                        if (!isAdded) return@post
                        dialog.dismiss()
                        onComplete(result)
                    }
                }
            }
            grid.addView(btn)
        }
        root.addView(grid)

        dialog.show()
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
                snack("Pola minimal 4 titik")
            } else {
                // dialog.dismiss() TIDAK BOLEH dipanggil langsung di sini — callback ini
                // dipanggil dari dalam PatternLockView.onTouchEvent(ACTION_UP), yaitu
                // selagi event sentuhan pada window dialog ini SENDIRI masih berlangsung.
                // Membubarkan dialog di tengah dispatch itu bikin lifecycle-nya rusak
                // (IllegalStateException: no event down from INITIALIZED) → force-close.
                // Tunda ke giliran message-loop berikutnya, setelah event ini selesai.
                pattern.post {
                    if (!isAdded) return@post
                    dialog.dismiss()
                    if (!isConfirm) {
                        showSetPatternDialog(lock, isConfirm = true, firstPattern = result)
                    } else if (result == firstPattern) {
                        lock.setLock(AppLockManager.TYPE_PATTERN, result)
                        updateLockStatus(lock)
                        snack("Pola berhasil diatur 🔒")
                    } else {
                        snack("Pola tidak cocok, ulangi dari awal")
                    }
                }
            }
        }
        dialog.show()
    }

    private fun roleLabel(role: String) = com.solusidana.sahabat.data.MasterData.labelFor(requireContext(), "role", role)

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
