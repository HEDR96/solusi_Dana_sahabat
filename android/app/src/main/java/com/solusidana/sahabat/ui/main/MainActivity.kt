package com.solusidana.sahabat.ui.main

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.AppLockManager
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.databinding.ActivityMainBinding
import com.solusidana.sahabat.ui.lock.LockActivity
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val locationPermission = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        if (grants.values.any { it }) {
            reportLocation()
            requestBackgroundLocation()
        }
    }

    private val bgLocationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* worker lokasi background aktif setelah granted */ }

    private val notifPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* opsional — app tetap jalan tanpa notif */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navHost = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHost.navController

        binding.bottomNav.setupWithNavController(navController)

        // Perbarui access token (kadaluarsa ~1 jam) setiap buka app
        lifecycleScope.launch { SupabaseApi.refreshSession(SessionManager(this@MainActivity)) }

        requestNotificationPermission()
        requestAndReportLocation()
    }

    override fun onStart() {
        super.onStart()
        // Kunci ulang jika app ditinggal di background > 60 detik
        val lock = AppLockManager(this)
        if (lock.shouldRelock()) {
            startActivity(Intent(this, LockActivity::class.java).apply {
                putExtra(LockActivity.EXTRA_RELOCK, true)
            })
        }
    }

    override fun onStop() {
        super.onStop()
        AppLockManager(this).lastActiveAt = System.currentTimeMillis()
    }

    /** Android 13+ wajib minta izin runtime agar notifikasi bisa tampil. */
    private fun requestNotificationPermission() {
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            val perm = Manifest.permission.POST_NOTIFICATIONS
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                notifPermission.launch(perm)
            }
        }
    }

    /** Kirim lokasi terakhir user ke server (untuk Peta Agen owner). */
    private fun requestAndReportLocation() {
        val session = SessionManager(this)
        // Hanya agen & spv-agen yang dipantau lokasinya
        if (session.userRole !in listOf("agen", "spv-agen")) return

        val fine = Manifest.permission.ACCESS_FINE_LOCATION
        if (ContextCompat.checkSelfPermission(this, fine) == PackageManager.PERMISSION_GRANTED) {
            reportLocation()
            requestBackgroundLocation()
        } else {
            locationPermission.launch(arrayOf(fine, Manifest.permission.ACCESS_COARSE_LOCATION))
        }
    }

    /** Android 10+ wajib minta background location secara terpisah setelah foreground granted. */
    private fun requestBackgroundLocation() {
        if (android.os.Build.VERSION.SDK_INT < 29) return
        val bgPerm = Manifest.permission.ACCESS_BACKGROUND_LOCATION
        if (ContextCompat.checkSelfPermission(this, bgPerm) != PackageManager.PERMISSION_GRANTED) {
            bgLocationPermission.launch(bgPerm)
        }
    }

    @SuppressLint("MissingPermission")
    private fun reportLocation() {
        val session = SessionManager(this)
        val token  = session.accessToken ?: return
        val userId = session.userId ?: return
        val fusedClient = LocationServices.getFusedLocationProviderClient(this)

        fun sendLoc(loc: android.location.Location) {
            lifecycleScope.launch {
                SupabaseApi.upsertLocation(
                    token, userId,
                    name = session.userName ?: "",
                    role = session.userRole ?: "",
                    lat  = loc.latitude,
                    lng  = loc.longitude
                ).onFailure { e ->
                    android.util.Log.w("LocationReport", "Upsert lokasi gagal: ${e.message}")
                }
            }
        }

        // Prioritas: lastLocation (cached, instan) → getCurrentLocation (active fix)
        fusedClient.lastLocation
            .addOnSuccessListener { cached ->
                if (cached != null) { sendLoc(cached); return@addOnSuccessListener }
                fusedClient.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)
                    .addOnSuccessListener { loc -> if (loc != null) sendLoc(loc) }
                    .addOnFailureListener { e ->
                        android.util.Log.w("LocationReport", "getCurrentLocation gagal: ${e.message}")
                    }
            }
            .addOnFailureListener { e ->
                android.util.Log.w("LocationReport", "lastLocation gagal: ${e.message}")
            }
    }
}
