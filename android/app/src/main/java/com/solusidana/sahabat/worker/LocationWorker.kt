package com.solusidana.sahabat.worker

import android.annotation.SuppressLint
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * WorkManager yang berjalan tiap 15 menit (minimum WorkManager) di background.
 * Mengirim koordinat lokasi ke tabel agent_locations tanpa HP dibuka.
 * Hanya berjalan untuk role agen & spv-agen.
 */
class LocationWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {

    @SuppressLint("MissingPermission")
    override suspend fun doWork(): Result {
        val session = SessionManager(applicationContext)
        // Hanya agen & spv-agen yang lokasinya dilacak
        if (!session.isLoggedIn) return Result.success()
        if (session.userRole !in listOf("agen", "spv-agen")) return Result.success()

        SupabaseApi.refreshSession(session)
        val token  = session.accessToken ?: return Result.success()
        val userId = session.userId ?: return Result.success()

        val location = getLastLocation() ?: return Result.retry()

        val result = SupabaseApi.upsertLocation(
            token, userId,
            name = session.userName ?: "",
            role = session.userRole ?: "",
            lat  = location.latitude,
            lng  = location.longitude
        )
        result.onFailure { e ->
            android.util.Log.w("LocationWorker", "Upsert gagal: ${e.message}")
        }
        return Result.success()
    }

    @SuppressLint("MissingPermission")
    private suspend fun getLastLocation(): android.location.Location? =
        suspendCancellableCoroutine { cont ->
            val client = LocationServices.getFusedLocationProviderClient(applicationContext)
            // Prioritas: lastLocation (cached, instan) → getCurrentLocation (active fix)
            client.lastLocation
                .addOnSuccessListener { cached ->
                    if (cached != null) { cont.resume(cached); return@addOnSuccessListener }
                    client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)
                        .addOnSuccessListener { loc -> cont.resume(loc) }
                        .addOnFailureListener { cont.resume(null) }
                }
                .addOnFailureListener { cont.resume(null) }
        }
}
