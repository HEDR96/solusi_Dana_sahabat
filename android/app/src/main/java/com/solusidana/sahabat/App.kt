package com.solusidana.sahabat

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import androidx.work.*
import com.solusidana.sahabat.worker.NotificationWorker
import com.solusidana.sahabat.worker.SurveyReminderWorker
import java.util.Calendar
import java.util.concurrent.TimeUnit

class App : Application() {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        scheduleNotificationWorker()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Notifikasi Berkas",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Pengingat berkas yang belum selesai diproses"
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun scheduleNotificationWorker() {
        val request = PeriodicWorkRequestBuilder<NotificationWorker>(3, TimeUnit.HOURS)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        // UPDATE (bukan KEEP): perubahan jadwal/constraint ikut terpasang saat app di-update.
        // WorkManager tetap menjalankan worker meski app ditutup & setelah HP restart.
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "berkas_reminder",
            ExistingPeriodicWorkPolicy.UPDATE,
            request
        )

        // Reminder survey tiap pagi jam 07:00
        val now = Calendar.getInstance()
        val next7am = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 7)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            if (before(now)) add(Calendar.DAY_OF_YEAR, 1)
        }
        val initialDelay = next7am.timeInMillis - now.timeInMillis

        val surveyRequest = PeriodicWorkRequestBuilder<SurveyReminderWorker>(24, TimeUnit.HOURS)
            .setInitialDelay(initialDelay, TimeUnit.MILLISECONDS)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "survey_reminder",
            ExistingPeriodicWorkPolicy.UPDATE,
            surveyRequest
        )
    }

    companion object {
        const val CHANNEL_ID = "berkas_channel"
    }
}
