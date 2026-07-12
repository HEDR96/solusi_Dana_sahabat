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
import com.solusidana.sahabat.data.PushMessage
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.humanError
import com.solusidana.sahabat.databinding.FragmentNotificationsBinding
import kotlinx.coroutines.launch
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

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

    private fun load() {
        val session = SessionManager(requireContext())
        val token  = session.accessToken ?: return
        val userId = session.userId ?: return

        b.progress.isVisible = true
        b.tvEmpty.isVisible = false

        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getPushMessages(token, userId, afterId = 0L).onSuccess { messages ->
                if (_b == null) return@onSuccess
                b.progress.isVisible = false
                b.swipeRefresh.isRefreshing = false
                val sorted = messages.sortedByDescending { it.id }
                if (sorted.isEmpty()) {
                    b.tvEmpty.isVisible = true
                    b.recycler.adapter = null
                } else {
                    b.tvEmpty.isVisible = false
                    b.recycler.adapter = NotifAdapter(sorted)
                    // Tandai semua sudah dibaca
                    val maxId = sorted.maxOf { it.id }
                    requireContext().getSharedPreferences("notif_state", android.content.Context.MODE_PRIVATE)
                        .edit().putLong("last_seen_id", maxId).apply()
                    (activity as? com.solusidana.sahabat.ui.main.MainActivity)?.updateNotifBadge()
                }
            }.onFailure { e ->
                if (_b == null) return@onFailure
                b.progress.isVisible = false
                b.swipeRefresh.isRefreshing = false
                b.tvEmpty.text = humanError(e)
                b.tvEmpty.isVisible = true
            }
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}

class NotifAdapter(private val items: List<PushMessage>) :
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
        val msg = items[position]
        holder.tvTitle.text = msg.title
        holder.tvBody.text  = msg.body
        holder.tvTime.text  = formatTime(msg.createdAt)
        holder.tvIcon.text  = if (msg.title.contains("Pending") || msg.title.contains("Berkas")) "📋"
                              else "📬"
        // Broadcast vs targeted
        if (msg.targetUserId == null) {
            (holder.itemView as? MaterialCardView)?.setCardBackgroundColor(0xFFFFFBEB.toInt())
        }
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
