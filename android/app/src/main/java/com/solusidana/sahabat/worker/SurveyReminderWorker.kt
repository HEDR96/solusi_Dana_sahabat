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
import com.solusidana.sahabat.ui.main.MainActivity

/**
 * Berjalan tiap pagi: cek apakah ada survey terjadwal hari ini,
 * kirim notifikasi ringkasan jika ada.
 */
class SurveyReminderWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val session = SessionManager(applicationContext)
        if (!session.isLoggedIn) return Result.success()
        SupabaseApi.refreshSession(session)   // token kadaluarsa ~1 jam
        val token   = session.accessToken ?: return Result.success()
        val agentId = if (session.userRole == "agen") session.agentId else null

        SupabaseApi.getTodaySurveys(token, agentId)
            .onSuccess { surveys ->
                if (surveys.isNotEmpty()) {
                    val detail = surveys.joinToString("\n") {
                        "• ${it.surveyTime ?: "--:--"} ${it.customerName} (${it.city ?: "-"})"
                    }
                    sendNotification(surveys.size, detail)
                }
            }

        return Result.success()
    }

    private fun sendNotification(count: Int, detail: String) {
        val intent = PendingIntent.getActivity(
            applicationContext, 1,
            Intent(applicationContext, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, App.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("📅 $count Survey Hari Ini")
            .setContentText(detail.lineSequence().firstOrNull() ?: "")
            .setStyle(NotificationCompat.BigTextStyle().bigText(detail))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(intent)
            .setAutoCancel(true)
            .build()

        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIF_ID, notification)
    }

    companion object {
        private const val NOTIF_ID = 1002
    }
}
