package com.solusidana.sahabat.worker

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.solusidana.sahabat.App
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.data.statusLabel
import com.solusidana.sahabat.ui.main.MainActivity

/**
 * Worker berkala (tiap 3 jam):
 * 1. Ingatkan berkas yang belum approve/reject/cancel
 * 2. Deteksi komisi yang baru dibayar → notif
 * 3. Deteksi perubahan status berkas → notif spesifik
 */
class NotificationWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val prefs = context.getSharedPreferences("sync_state", Context.MODE_PRIVATE)

    override suspend fun doWork(): Result {
        val session = SessionManager(applicationContext)
        if (!session.isLoggedIn) return Result.success()
        SupabaseApi.refreshSession(session)   // token kadaluarsa ~1 jam
        val token   = session.accessToken ?: return Result.success()
        val agentId = if (session.userRole == "agen") session.agentId else null

        checkStatusChanges(token, agentId)
        checkNewPaidCommissions(token, agentId)
        checkPendingReminder(token, agentId)

        return Result.success()
    }

    // ── 1. Reminder berkas pending ────────────────────────────────────────────
    private suspend fun checkPendingReminder(token: String, agentId: String?) {
        SupabaseApi.getPendingApplicationsCount(token, agentId)
            .onSuccess { count ->
                if (count > 0) notify(
                    NOTIF_PENDING,
                    "Berkas Belum Selesai",
                    "Ada $count berkas yang belum approve/reject/cancel. Segera tindak lanjuti."
                )
            }
    }

    // ── 2. Komisi baru dibayar ────────────────────────────────────────────────
    private suspend fun checkNewPaidCommissions(token: String, agentId: String?) {
        SupabaseApi.getCommissions(token, agentId).onSuccess { list ->
            val paidNow  = list.filter { it.status == "paid" }.map { it.id.toString() }.toSet()
            val paidPrev = prefs.getStringSet(KEY_PAID_IDS, null)

            if (paidPrev != null) {
                val newlyPaid = paidNow - paidPrev
                newlyPaid.forEach { id ->
                    val comm = list.find { it.id.toString() == id } ?: return@forEach
                    notify(
                        NOTIF_COMMISSION_BASE + (comm.id % 1000).toInt(),
                        "💰 Komisi Dibayar!",
                        "Komisi ${formatRupiah(comm.commissionAmount)} untuk berkas ${comm.appId ?: "-"} (${comm.customerName ?: "-"}) sudah dibayarkan."
                    )
                }
            }
            prefs.edit().putStringSet(KEY_PAID_IDS, paidNow).apply()
        }
    }

    // ── 3. Perubahan status berkas ────────────────────────────────────────────
    private suspend fun checkStatusChanges(token: String, agentId: String?) {
        SupabaseApi.getApplications(token, agentId).onSuccess { apps ->
            val statusNow  = apps.map { "${it.id}:${it.status}" }.toSet()
            val statusPrev = prefs.getStringSet(KEY_APP_STATUSES, null)

            if (statusPrev != null) {
                val prevMap = statusPrev.associate {
                    val idx = it.lastIndexOf(':')
                    it.substring(0, idx) to it.substring(idx + 1)
                }
                apps.forEach { app ->
                    val prev = prevMap[app.id]
                    if (prev != null && prev != app.status) {
                        val emoji = when (app.status) {
                            "approve" -> "🎉"
                            "reject"  -> "❌"
                            "cancel"  -> "🚫"
                            else      -> "🔄"
                        }
                        notify(
                            NOTIF_STATUS_BASE + (app.id.hashCode() % 1000),
                            "$emoji Berkas ${app.id}",
                            "${app.customerName}: ${statusLabel(prev)} → ${statusLabel(app.status)}"
                        )
                    }
                }
            }
            prefs.edit().putStringSet(KEY_APP_STATUSES, statusNow).apply()
        }
    }

    private fun notify(id: Int, title: String, text: String) {
        val intent = PendingIntent.getActivity(
            applicationContext, 0,
            Intent(applicationContext, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, App.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(intent)
            .setAutoCancel(true)
            .build()

        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(id, notification)
    }

    companion object {
        private const val NOTIF_PENDING         = 1001
        private const val NOTIF_COMMISSION_BASE = 2000
        private const val NOTIF_STATUS_BASE     = 3000
        private const val KEY_PAID_IDS          = "paid_commission_ids"
        private const val KEY_APP_STATUSES      = "app_statuses"
    }
}
