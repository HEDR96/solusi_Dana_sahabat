package com.solusidana.sahabat.ui.notifications

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.card.MaterialCardView
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.humanError
import com.solusidana.sahabat.databinding.FragmentNotificationsBinding
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/** Item tampilan gabungan: push message dari owner + notifikasi sistem ERP. */
data class NotifItem(
    val title: String,
    val body: String,
    val createdAt: String?,
    val icon: String,
    val highlight: Boolean,
)

class NotificationsFragment : Fragment() {

    private var _b: FragmentNotificationsBinding? = null
    private val b get() = _b!!

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentNotificationsBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.recycler.layoutManager = LinearLayoutManager(requireContext())
        b.swipeRefresh.setOnRefreshListener { load() }
        load()
    }

    private fun iconForType(type: String?): String = when (type) {
        "berkas-baru"  -> "📋"
        "agen-baru"    -> "👤"
        "lead-website" -> "🌐"
        else            -> "🔔"
    }

    private fun load() {
        val session = SessionManager(requireContext())

        b.progress.isVisible = true
        b.tvEmpty.isVisible = false

        viewLifecycleOwner.lifecycleScope.launch {
            // Token kadaluarsa ~1 jam — refresh dulu supaya tidak 401 diam-diam
            SupabaseApi.refreshSession(session)
            if (_b == null) return@launch
            val token  = session.accessToken
            val userId = session.userId
            if (token == null || userId == null) {
                b.progress.isVisible = false
                b.swipeRefresh.isRefreshing = false
                b.tvEmpty.text = "Sesi berakhir — silakan login ulang"
                b.tvEmpty.isVisible = true
                return@launch
            }

            val pushDef  = async { SupabaseApi.getPushMessages(token, userId, afterId = 0L) }
            val notifDef = async { SupabaseApi.getNotifications(token) }
            val pushRes  = pushDef.await()
            val notifRes = notifDef.await()
            if (_b == null) return@launch

            b.progress.isVisible = false
            b.swipeRefresh.isRefreshing = false

            if (pushRes.isFailure && notifRes.isFailure) {
                b.tvEmpty.text = humanError(pushRes.exceptionOrNull() ?: Exception())
                b.tvEmpty.isVisible = true
                b.recycler.adapter = null
                return@launch
            }

            val pushes = pushRes.getOrDefault(emptyList())
            val items = buildList {
                pushes.forEach { msg ->
                    add(NotifItem(
                        title = msg.title, body = msg.body, createdAt = msg.createdAt,
                        icon = if (msg.title.contains("Pending") || msg.title.contains("Berkas")) "📋" else "📬",
                        highlight = msg.targetUserId == null,
                    ))
                }
                // Notifikasi sistem ERP (berkas baru, agen baru, lead website) —
                // dulu tidak pernah tampil di aplikasi, hanya di lonceng web
                notifRes.getOrDefault(emptyList()).forEach { n ->
                    add(NotifItem(
                        title = when (n.type) {
                            "berkas-baru"  -> "Berkas Baru"
                            "agen-baru"    -> "Lamaran Agen"
                            "lead-website" -> "Lead Website"
                            else            -> "Info"
                        },
                        body = n.message, createdAt = n.createdAt,
                        icon = iconForType(n.type), highlight = false,
                    ))
                }
            }.sortedByDescending { it.createdAt ?: "" }

            if (items.isEmpty()) {
                b.tvEmpty.text = "Belum ada notifikasi"
                b.tvEmpty.isVisible = true
                b.recycler.adapter = null
            } else {
                b.tvEmpty.isVisible = false
                b.recycler.adapter = NotifAdapter(items)
            }

            // Tandai push messages sudah dibaca (badge bottom-nav)
            if (pushes.isNotEmpty()) {
                requireContext().getSharedPreferences("notif_state", android.content.Context.MODE_PRIVATE)
                    .edit().putLong("last_seen_id", pushes.maxOf { it.id }).apply()
                (activity as? com.solusidana.sahabat.ui.main.MainActivity)?.updateNotifBadge()
            }
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}

class NotifAdapter(private val items: List<NotifItem>) :
    RecyclerView.Adapter<NotifAdapter.VH>() {

    inner class VH(view: View) : RecyclerView.ViewHolder(view) {
        val tvTitle: TextView = view.findViewById(com.solusidana.sahabat.R.id.tvTitle)
        val tvBody: TextView  = view.findViewById(com.solusidana.sahabat.R.id.tvBody)
        val tvTime: TextView  = view.findViewById(com.solusidana.sahabat.R.id.tvTime)
        val tvIcon: TextView  = view.findViewById(com.solusidana.sahabat.R.id.tvIcon)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val view = LayoutInflater.from(parent.context)
            .inflate(com.solusidana.sahabat.R.layout.item_notification, parent, false)
        return VH(view)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = items[position]
        holder.tvTitle.text = item.title
        holder.tvBody.text  = item.body
        holder.tvTime.text  = formatTime(item.createdAt)
        holder.tvIcon.text  = item.icon
        (holder.itemView as? MaterialCardView)?.setCardBackgroundColor(
            if (item.highlight) 0xFFFFFBEB.toInt() else 0xFFFFFFFF.toInt()
        )
    }

    override fun getItemCount() = items.size

    private fun formatTime(raw: String?): String {
        if (raw == null) return ""
        return try {
            val zdt = ZonedDateTime.parse(raw)
            val fmt = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm", Locale("id"))
            zdt.format(fmt)
        } catch (_: Exception) { raw.take(16).replace("T", " ") }
    }
}
