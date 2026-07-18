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
import com.solusidana.sahabat.data.Application as App2
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.data.statusLabel
import com.solusidana.sahabat.ui.main.MainActivity

class NotificationWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val prefs = context.getSharedPreferences("sync_state", Context.MODE_PRIVATE)
    private val nm by lazy {
        applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }

    override suspend fun doWork(): Result {
        val session = SessionManager(applicationContext)
        if (!session.isLoggedIn) return Result.success()
        SupabaseApi.refreshSession(session)
        val token   = session.accessToken ?: return Result.success()
        val agentId = if (session.userRole == "agen") session.agentId else null

        checkStatusChanges(token, agentId)
        checkNewPaidCommissions(token, agentId)
        checkActiveApps(token, agentId)
        checkPushMessages(token, session.userId ?: "")

        return Result.success()
    }

    // ── 1. Reminder berkas aktif — satu notifikasi TERPISAH per berkas ─────────
    // Tap → langsung ke detail berkas tsb. ID stabil per app.id supaya siklus
    // 3-jam berikutnya meng-update notifikasi yang sama (bukan menumpuk duplikat).
    private suspend fun checkActiveApps(token: String, agentId: String?) {
        SupabaseApi.getApplications(token, agentId).onSuccess { apps ->
            val active = apps.filter { it.status !in DONE_STATUSES }

            active.forEach { app ->
                val sla = slaHari(app.inputDate)
                val kota = app.city?.takeIf { it.isNotBlank() } ?: "-"
                val agen = app.agentName?.takeIf { it.isNotBlank() } ?: "-"
                val nominal = formatRupiah(app.pinjaman)

                val shortText = "$nominal · $sla hari · ${statusLabel(app.status)}"
                val longText = "${app.customerName} · $nominal\n" +
                    "Agen: $agen · $kota\n" +
                    "Status: ${statusLabel(app.status)} · sudah berjalan $sla hari\n" +
                    "Tap untuk lihat detail berkas"

                val notif = base("📋 ${app.customerName}", shortText, appIntent(activeNotifId(app.id), app.id))
                    .setStyle(NotificationCompat.BigTextStyle().bigText(longText))
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .build()
                nm.notify(activeNotifId(app.id), notif)
            }

            // Berkas yang sudah tidak aktif lagi (approve/reject/cancel sejak siklus
            // sebelumnya) — hapus notifikasinya supaya tidak nyangkut selamanya.
            val activeIdsNow = active.map { it.id }.toSet()
            val prevIds = prefs.getStringSet(KEY_ACTIVE_APP_IDS, null) ?: emptySet()
            (prevIds - activeIdsNow).forEach { staleId -> nm.cancel(activeNotifId(staleId)) }
            prefs.edit().putStringSet(KEY_ACTIVE_APP_IDS, activeIdsNow).apply()
        }
    }

    private fun activeNotifId(appId: String): Int = ("active_$appId").hashCode()

    // ── 2. Perubahan status berkas ────────────────────────────────────────────
    private suspend fun checkStatusChanges(token: String, agentId: String?) {
        SupabaseApi.getApplications(token, agentId).onSuccess { apps ->
            val statusNow  = apps.map { "${it.id}:${it.status}" }.toSet()
            val statusPrev = prefs.getStringSet(KEY_APP_STATUSES, null)

            if (statusPrev != null) {
                data class Change(val app: App2, val from: String, val to: String)
                val prevMap = statusPrev.associate {
                    val idx = it.lastIndexOf(':')
                    it.substring(0, idx) to it.substring(idx + 1)
                }
                val changes = apps.mapNotNull { app ->
                    val prev = prevMap[app.id]
                    if (prev != null && prev != app.status) Change(app, prev, app.status) else null
                }

                when {
                    changes.size == 1 -> {
                        val c = changes[0]
                        val emoji = when (c.to) { "approve" -> "🎉"; "reject" -> "❌"; "cancel" -> "🚫"; else -> "🔄" }
                        val pending = appIntent(NOTIF_STATUS_SUMMARY, c.app.id)
                        nm.notify(
                            NOTIF_STATUS_SUMMARY,
                            base("$emoji Berkas ${c.app.id}",
                                "${c.app.customerName}: ${statusLabel(c.from)} → ${statusLabel(c.to)}", pending)
                                .build()
                        )
                    }
                    changes.size > 1 -> {
                        val style = NotificationCompat.InboxStyle()
                            .setBigContentTitle("${changes.size} status berkas berubah")
                        changes.take(6).forEach { c ->
                            style.addLine("${c.app.customerName}: ${statusLabel(c.from)} → ${statusLabel(c.to)}")
                        }
                        if (changes.size > 6) style.setSummaryText("+${changes.size - 6} lainnya")
                        val pending = mainIntent(NOTIF_STATUS_SUMMARY)
                        nm.notify(
                            NOTIF_STATUS_SUMMARY,
                            base("🔄 ${changes.size} status berubah", "Tap untuk melihat detail", pending)
                                .setStyle(style)
                                .build()
                        )
                    }
                }
            }
            prefs.edit().putStringSet(KEY_APP_STATUSES, statusNow).apply()
        }
    }

    // ── 3. Komisi baru dibayar ────────────────────────────────────────────────
    private suspend fun checkNewPaidCommissions(token: String, agentId: String?) {
        SupabaseApi.getCommissions(token, agentId).onSuccess { list ->
            val paidNow  = list.filter { it.status == "paid" }.map { it.id.toString() }.toSet()
            val paidPrev = prefs.getStringSet(KEY_PAID_IDS, null)

            if (paidPrev != null) {
                val newlyPaid = (paidNow - paidPrev).mapNotNull { id -> list.find { it.id.toString() == id } }
                when {
                    newlyPaid.size == 1 -> {
                        val c = newlyPaid[0]
                        val pending = mainIntent(NOTIF_COMMISSION_SUMMARY)
                        nm.notify(
                            NOTIF_COMMISSION_SUMMARY,
                            base("💰 Komisi Dibayar!",
                                "Komisi ${formatRupiah(c.commissionAmount)} untuk ${c.customerName ?: c.appId ?: "-"}",
                                pending).build()
                        )
                    }
                    newlyPaid.size > 1 -> {
                        val total = newlyPaid.sumOf { it.commissionAmount ?: 0L }
                        val style = NotificationCompat.InboxStyle()
                            .setBigContentTitle("${newlyPaid.size} komisi dibayar")
                        newlyPaid.take(6).forEach { c ->
                            style.addLine("${c.customerName ?: c.appId ?: "-"}: ${formatRupiah(c.commissionAmount)}")
                        }
                        style.setSummaryText("Total: ${formatRupiah(total)}")
                        val pending = mainIntent(NOTIF_COMMISSION_SUMMARY)
                        nm.notify(
                            NOTIF_COMMISSION_SUMMARY,
                            base("💰 ${newlyPaid.size} komisi dibayar", "Total: ${formatRupiah(total)}", pending)
                                .setStyle(style)
                                .build()
                        )
                    }
                }
            }
            prefs.edit().putStringSet(KEY_PAID_IDS, paidNow).apply()
        }
    }

    // ── 4. Push messages dari web ERP ─────────────────────────────────────────
    private suspend fun checkPushMessages(token: String, userId: String) {
        if (userId.isEmpty()) return
        val lastId = prefs.getLong(KEY_LAST_PUSH_ID, 0L)
        SupabaseApi.getPushMessages(token, userId, lastId).onSuccess { messages ->
            // Run pertama (belum ada high-water-mark): jangan memberondong notifikasi
            // untuk seluruh pesan lama — cukup catat id terakhir sebagai titik awal.
            if (lastId == 0L) {
                if (messages.isNotEmpty()) {
                    prefs.edit().putLong(KEY_LAST_PUSH_ID, messages.maxOf { it.id }).apply()
                }
                return@onSuccess
            }
            when {
                messages.size == 1 -> {
                    val msg = messages[0]
                    nm.notify(NOTIF_PUSH_SUMMARY,
                        base(msg.title, msg.body, mainIntent(NOTIF_PUSH_SUMMARY)).build())
                }
                messages.size > 1 -> {
                    val style = NotificationCompat.InboxStyle()
                        .setBigContentTitle("${messages.size} pesan baru dari ERP")
                    messages.take(6).forEach { style.addLine("${it.title}: ${it.body}") }
                    if (messages.size > 6) style.setSummaryText("+${messages.size - 6} lainnya")
                    nm.notify(NOTIF_PUSH_SUMMARY,
                        base("📬 ${messages.size} pesan baru", "Tap untuk melihat", mainIntent(NOTIF_PUSH_SUMMARY))
                            .setStyle(style)
                            .build())
                }
            }
            if (messages.isNotEmpty()) {
                prefs.edit().putLong(KEY_LAST_PUSH_ID, messages.maxOf { it.id }).apply()
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun base(title: String, text: String, pending: PendingIntent) =
        NotificationCompat.Builder(applicationContext, App.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pending)
            .setAutoCancel(true)

    private fun mainIntent(reqCode: Int): PendingIntent =
        PendingIntent.getActivity(
            applicationContext, reqCode,
            Intent(applicationContext, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    private fun appIntent(reqCode: Int, appId: String): PendingIntent =
        PendingIntent.getActivity(
            applicationContext, reqCode,
            Intent(applicationContext, MainActivity::class.java).apply {
                putExtra(MainActivity.EXTRA_OPEN_APP_ID, appId)
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    private fun slaHari(inputDate: String?): Int {
        if (inputDate == null) return 0
        return try {
            val fmt = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            val d   = fmt.parse(inputDate.take(10)) ?: return 0
            ((System.currentTimeMillis() - d.time) / 86_400_000L).toInt()
        } catch (_: Exception) { 0 }
    }

    companion object {
        private const val NOTIF_STATUS_SUMMARY     = 6002
        private const val NOTIF_COMMISSION_SUMMARY = 6003
        private const val NOTIF_PUSH_SUMMARY       = 6004
        private const val KEY_PAID_IDS             = "paid_commission_ids"
        private const val KEY_APP_STATUSES         = "app_statuses"
        private const val KEY_LAST_PUSH_ID         = "last_push_msg_id"
        private const val KEY_ACTIVE_APP_IDS       = "active_app_ids_notified"
        private val DONE_STATUSES                  = setOf("approve", "reject", "cancel")
    }
}
