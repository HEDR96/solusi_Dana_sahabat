package com.solusidana.sahabat.ui.dashboard

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.statusColor
import com.solusidana.sahabat.data.statusLabel
import com.solusidana.sahabat.databinding.FragmentDashboardBinding

class DashboardFragment : Fragment() {

    private var _b: FragmentDashboardBinding? = null
    private val b get() = _b!!
    private val vm: DashboardViewModel by viewModels()

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentDashboardBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val session = SessionManager(requireContext())
        b.tvWelcome.text = "Halo, ${session.userName ?: "—"}"
        b.tvRole.text    = session.userRole?.let { roleLabel(it) } ?: ""

        vm.loading.observe(viewLifecycleOwner) { b.progress.isVisible = it }

        vm.data.observe(viewLifecycleOwner) { d ->
            if (d == null) return@observe

            bindStat(b.cardTotalBerkas, d.totalBerkas.toString(), "Total Berkas", "#3B82F6", "📁")
            bindStat(b.cardPending,     d.pending.toString(),     "Proses",        "#F59E0B", "⏳")
            bindStat(b.cardApprove,     d.approve.toString(),     "Approve",       "#22C55E", "✅")
            bindStat(b.cardReject,      d.reject.toString(),      "Reject",        "#EF4444", "❌")

            // Target bulanan (role agen)
            if (d.myTarget != null && d.myTarget > 0) {
                b.cardTarget.isVisible = true
                val count = d.myMonthCount ?: 0
                val pct = minOf(100, count * 100 / d.myTarget)
                b.tvTargetCount.text = "$count / ${d.myTarget}"
                b.progressTarget.progress = pct
                b.tvTargetHint.text = when {
                    pct >= 100 -> "🎉 Target tercapai! Luar biasa!"
                    pct >= 70  -> "Sedikit lagi, semangat!"
                    else       -> "Butuh ${d.myTarget - count} berkas lagi bulan ini"
                }
            } else {
                b.cardTarget.isVisible = false
            }

            // Leaderboard
            b.sectionLeaderboard.isVisible = d.leaderboard.isNotEmpty()
            b.containerLeaderboard.removeAllViews()
            val medals = listOf("🥇", "🥈", "🥉", "4.", "5.")
            val textPrimary = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.text_primary)
            d.leaderboard.forEachIndexed { idx, ag ->
                val tv = TextView(requireContext()).apply {
                    text = "${medals.getOrElse(idx) { "${idx + 1}." }}  ${ag.name}   —   ${ag.totalApprove ?: 0} approve"
                    textSize = 14f
                    setTextColor(textPrimary)
                    setPadding(20, 18, 20, 18)
                }
                b.containerLeaderboard.addView(tv)
            }

            // Survey hari ini
            b.sectionSurvey.isVisible = d.todaySurveys.isNotEmpty()
            b.containerSurveys.removeAllViews()
            d.todaySurveys.forEach { app ->
                val row = layoutInflater.inflate(R.layout.item_survey, b.containerSurveys, false)
                row.findViewById<TextView>(R.id.tvTime).text     = app.surveyTime ?: "--:--"
                row.findViewById<TextView>(R.id.tvCustomer).text = app.customerName
                row.findViewById<TextView>(R.id.tvAddress).text  = listOfNotNull(app.address, app.city).joinToString(", ").ifBlank { "-" }
                row.findViewById<View>(R.id.btnMaps).setOnClickListener {
                    val q = android.net.Uri.encode(listOfNotNull(app.address, app.city).joinToString(", "))
                    if (q.isNotBlank()) {
                        startActivity(android.content.Intent(
                            android.content.Intent.ACTION_VIEW,
                            android.net.Uri.parse("geo:0,0?q=$q")
                        ))
                    }
                }
                row.setOnClickListener {
                    safeNavigate(R.id.action_dashboard_to_detail, Bundle().apply { putString("appId", app.id) })
                }
                b.containerSurveys.addView(row)
            }

            // Recent items — pakai badge status
            b.containerRecent.removeAllViews()
            if (d.recentApps.isEmpty()) {
                val tv = TextView(requireContext()).apply {
                    text = "Belum ada berkas"
                    setTextColor(0xFF94A3B8.toInt())
                    textSize = 13f
                    setPadding(0, 8, 0, 8)
                }
                b.containerRecent.addView(tv)
            } else {
                d.recentApps.forEach { app ->
                    val row = layoutInflater.inflate(R.layout.item_application, b.containerRecent, false)
                    val color = statusColor(app.status)

                    row.findViewById<TextView>(R.id.tvCustomer).text = app.customerName
                    row.findViewById<TextView>(R.id.tvAgent).text    = "Agen: ${app.agentName ?: "-"}"
                    row.findViewById<TextView>(R.id.tvDate).text     = app.inputDate ?: ""
                    row.findViewById<TextView>(R.id.tvLeasing).text  = app.leasingName ?: "—"
                    row.findViewById<TextView>(R.id.tvAmount).text   = com.solusidana.sahabat.data.formatRupiah(app.pinjaman)
                    row.findViewById<TextView>(R.id.tvAppId).text    = app.id

                    val tvStatus = row.findViewById<TextView>(R.id.tvStatus)
                    tvStatus.text = statusLabel(app.status)
                    tvStatus.setTextColor(Color.WHITE)
                    tvStatus.background = GradientDrawable().apply {
                        cornerRadius = 40f
                        setColor(color)
                    }

                    row.findViewById<View>(R.id.statusBar).setBackgroundColor(color)

                    row.setOnClickListener {
                        safeNavigate(R.id.action_dashboard_to_detail, Bundle().apply { putString("appId", app.id) })
                    }
                    b.containerRecent.addView(row)
                }
            }
        }

        vm.error.observe(viewLifecycleOwner) { err ->
            b.tvError.isVisible = err != null
            if (err != null) b.tvError.text = err
        }

        b.btnSimulation.setOnClickListener {
            safeNavigate(R.id.action_dashboard_to_simulation)
        }
        b.btnActivities.setOnClickListener {
            safeNavigate(R.id.action_dashboard_to_activities)
        }

        if (SessionManager(requireContext()).userRole in listOf("owner", "super-admin")) {
            b.btnAgentMap.visibility = View.VISIBLE
            b.btnAgentMap.setOnClickListener {
                safeNavigate(R.id.action_dashboard_to_map)
            }
        }

        b.swipeRefresh.setOnRefreshListener {
            vm.load()
            b.swipeRefresh.isRefreshing = false
        }

        vm.load()
    }

    private fun bindStat(
        card: com.solusidana.sahabat.databinding.CardStatBinding,
        value: String, label: String, hexColor: String, icon: String
    ) {
        val color = Color.parseColor(hexColor)
        card.tvValue.text = value
        card.tvValue.setTextColor(color)
        card.tvLabel.text = label
        card.tvIcon.text  = icon
        val iconBgColor = Color.argb(40, Color.red(color), Color.green(color), Color.blue(color))
        card.tvIcon.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(iconBgColor)
        }
    }

    private fun roleLabel(role: String) = com.solusidana.sahabat.data.MasterData.labelFor(requireContext(), "role", role)

    /**
     * Navigasi lewat action ID scoped ke dashboardFragment. Kalau user tap dua kali
     * cepat (atau notifikasi memindah destinasi tepat saat klik ini tertunda di
     * message queue), destinasi saat ini bisa sudah berubah sebelum callback jalan
     * — action tidak ditemukan dari lokasi baru dan NavController melempar
     * IllegalArgumentException (force-close). Redam di sini, bukan crash.
     */
    private fun safeNavigate(actionId: Int, args: Bundle? = null) {
        if (!isAdded) return
        try {
            findNavController().navigate(actionId, args)
        } catch (_: IllegalArgumentException) {
            // Sudah pindah destinasi lain (mis. dari notifikasi) — abaikan tap ini
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
