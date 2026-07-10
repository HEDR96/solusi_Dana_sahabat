package com.solusidana.sahabat.worker

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.solusidana.sahabat.App
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.DraftStore
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi

/**
 * Mengirim draft berkas yang tersimpan saat offline.
 * Dijalankan dengan constraint jaringan — otomatis menunggu online.
 */
class DraftSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val session = SessionManager(applicationContext)
        if (!session.isLoggedIn) return Result.success()
        SupabaseApi.refreshSession(session)   // token kadaluarsa ~1 jam
        val token   = session.accessToken ?: return Result.success()
        val store   = DraftStore(applicationContext)

        val drafts = store.getAll()
        if (drafts.isEmpty()) return Result.success()

        var sent = 0
        drafts.forEach { d ->
            var idResult = SupabaseApi.nextBrkId(token)
            if (idResult.isFailure) {
                idResult = SupabaseApi.getApplicationsCount(token).map { c ->
                    "BRK" + (2026000 + c + 1).toString().padStart(7, '0')
                }
            }
            val newId = idResult.getOrNull() ?: return Result.retry()

            val result = SupabaseApi.insertApplication(
                token, newId, d.agentId, d.agentName, d.customerName, d.nik, d.phone,
                d.city, d.address, d.unitType, d.unitBrand, d.unitYear,
                d.pinjaman, d.tenor, d.estimasiAngsuran, d.leasingId, d.leasingName, d.notes
            )
            if (result.isSuccess) {
                store.remove(d.localId)
                sent++
            }
        }

        if (sent > 0) {
            val notification = NotificationCompat.Builder(applicationContext, App.CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("✅ Draft Terkirim")
                .setContentText("$sent draft berkas berhasil dikirim ke server.")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .build()
            val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(4001, notification)
        }

        return if (store.count() == 0) Result.success() else Result.retry()
    }
}
