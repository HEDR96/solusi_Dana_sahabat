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
        checkActiveApps(token, agentId)
        checkPushMessages(token, session.userId ?: "")

        return Result.success()
    }

    // ── 1. Reminder per-customer (notif per nama debitur, tiap 3 jam) ────────
    private suspend fun checkActiveApps(token: String, agentId: String?) {
        SupabaseApi.getApplications(token, agentId).onSuccess { apps ->
            val active = apps.filter { it.status !in DONE_STATUSES }
            active.forEach { app ->
                val sla  = slaHari(app.inputDate)
                val body = "Agen: ${app.agentName ?: "-"} | SLA: $sla hari | ${statusLabel(app.status)}"
                notifyForApp(
                    NOTIF_ACTIVE_BASE + (app.id.hashCode().and(0x7FFFFFFF) % 900),
                    "📋 ${app.customerName}",
                    body,
                    app.id
                )
            }
        }
    }

    private fun slaHari(inputDate: String?): Int {
        if (inputDate == null) return 0
        return try {
            val fmt = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            val d   = fmt.parse(inputDate.take(10)) ?: return 0
            ((System.currentTimeMillis() - d.time) / 86_400_000L).toInt()
        } catch (_: Exception) { 0 }
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

    // ── 4. Push messages dari web ERP ────────────────────────────────────────
    private suspend fun checkPushMessages(token: String, userId: String) {
        if (userId.isEmpty()) return
        val lastId = prefs.getLong(KEY_LAST_PUSH_ID, 0L)
        SupabaseApi.getPushMessages(token, userId, lastId).onSuccess { messages ->
            messages.forEach { msg ->
                notify(
                    NOTIF_PUSH_BASE + (msg.id % 500).toInt(),
                    msg.title,
                    msg.body
                )
            }
            if (messages.isNotEmpty()) {
                prefs.edit().putLong(KEY_LAST_PUSH_ID, messages.maxOf { it.id }).apply()
            }
        }
    }

    private fun notifyForApp(id: Int, title: String, text: String, appId: String) {
        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            putExtra(MainActivity.EXTRA_OPEN_APP_ID, appId)
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
        }
        val pending = PendingIntent.getActivity(
            applicationContext, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        buildNotification(id, title, text, pending)
    }

    private fun notify(id: Int, title: String, text: String) {
        val intent = PendingIntent.getActivity(
            applicationContext, id,
            Intent(applicationContext, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        buildNotification(id, title, text, intent)
    }

    private fun buildNotification(id: Int, title: String, text: String, pending: PendingIntent) {
        val notification = NotificationCompat.Builder(applicationContext, App.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pending)
            .setAutoCancel(true)
            .build()
        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(id, notification)
    }

    companion object {
        private const val NOTIF_COMMISSION_BASE = 2000
        private const val NOTIF_STATUS_BASE     = 3000
        private const val NOTIF_PUSH_BASE       = 4000
        private const val NOTIF_ACTIVE_BASE     = 5000
        private const val KEY_PAID_IDS          = "paid_commission_ids"
        private const val KEY_APP_STATUSES      = "app_statuses"
        private const val KEY_LAST_PUSH_ID      = "last_push_msg_id"
        private val DONE_STATUSES               = setOf("approve", "reject", "cancel")
    }
}
