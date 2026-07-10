package com.solusidana.sahabat.ui.activities

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.ACTIVITY_OUTCOMES
import com.solusidana.sahabat.data.ACTIVITY_TYPES
import com.solusidana.sahabat.data.Agent
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.activityOutcomeColor
import com.solusidana.sahabat.data.activityOutcomeLabel
import com.solusidana.sahabat.data.activityTypeLabel
import com.solusidana.sahabat.databinding.FragmentActivityListBinding
import kotlinx.coroutines.launch

/**
 * Catatan aktivitas harian agen (kunjungan, follow-up, cold call, dst.)
 * — data yang sama dengan halaman Aktivitas Agen di web ERP.
 */
class ActivityListFragment : Fragment() {

    private var _b: FragmentActivityListBinding? = null
    private val b get() = _b!!
    private var agents: List<Agent> = emptyList()

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentActivityListBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }
        b.fabAdd.setOnClickListener { showAddDialog() }
        b.swipeRefresh.setOnRefreshListener {
            load()
            b.swipeRefresh.isRefreshing = false
        }
        load()
    }

    private fun session() = SessionManager(requireContext())

    private fun load() {
        val session = session()
        val token = session.accessToken ?: return
        val agentId = if (session.userRole == "agen") session.agentId else null

        b.progress.isVisible = true
        viewLifecycleOwner.lifecycleScope.launch {
            // Refresh cache master data (jenis & hasil aktivitas dari DB, bukan hardcode)
            com.solusidana.sahabat.data.MasterData.load(requireContext(), token)

            // Agen untuk dropdown (non-agen) — sekalian dimuat sekali
            if (session.userRole != "agen" && agents.isEmpty()) {
                agents = SupabaseApi.getAgents(token).getOrDefault(emptyList())
                    .filter { it.status == "aktif" }
            }

            val result = SupabaseApi.getActivities(token, agentId)
            if (_b == null) return@launch
            b.progress.isVisible = false

            val ctx = requireContext()
            result.onSuccess { list ->
                b.tvEmpty.isVisible = list.isEmpty()
                b.containerItems.removeAllViews()
                list.forEach { act ->
                    val row = layoutInflater.inflate(R.layout.item_activity, b.containerItems, false)
                    row.findViewById<TextView>(R.id.tvType).text        = com.solusidana.sahabat.data.MasterData.labelFor(ctx, "activity_type", act.type)
                    row.findViewById<TextView>(R.id.tvDate).text        = act.date ?: ""
                    row.findViewById<TextView>(R.id.tvDescription).text = act.description ?: "-"
                    row.findViewById<TextView>(R.id.tvAgent).text       = act.agentName ?: "-"
                    row.findViewById<TextView>(R.id.tvOutcome).apply {
                        text = com.solusidana.sahabat.data.MasterData.labelFor(ctx, "activity_outcome", act.outcome)
                        setTextColor(activityOutcomeColor(act.outcome))
                    }
                    b.containerItems.addView(row)
                }
            }.onFailure {
                Snackbar.make(b.root, it.message ?: "Gagal memuat", Snackbar.LENGTH_LONG).show()
            }
        }
    }

    private fun showAddDialog() {
        val session = session()
        val isAgen = session.userRole == "agen"

        val dialogView = layoutInflater.inflate(R.layout.dialog_add_activity, null)
        val tilAgent   = dialogView.findViewById<TextInputLayout>(R.id.tilAgent)
        val ddAgent    = dialogView.findViewById<AutoCompleteTextView>(R.id.ddAgent)
        val ddType     = dialogView.findViewById<AutoCompleteTextView>(R.id.ddType)
        val ddOutcome  = dialogView.findViewById<AutoCompleteTextView>(R.id.ddOutcome)
        val etDesc     = dialogView.findViewById<TextInputEditText>(R.id.etDescription)

        var selectedAgent: Agent? = null
        var selectedType = ""
        var selectedOutcome = ""

        if (!isAgen) {
            tilAgent.isVisible = true
            ddAgent.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, agents.map { it.name }))
            ddAgent.setOnItemClickListener { _, _, pos, _ -> selectedAgent = agents[pos] }
        }

        // Jenis & hasil dari Master Data (owner bisa tambah/ubah tanpa update APK)
        val types    = com.solusidana.sahabat.data.MasterData.pairs(requireContext(), "activity_type")
        val outcomes = com.solusidana.sahabat.data.MasterData.pairs(requireContext(), "activity_outcome")

        ddType.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, types.map { it.second }))
        ddType.setOnItemClickListener { _, _, pos, _ -> selectedType = types[pos].first }

        ddOutcome.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, outcomes.map { it.second }))
        ddOutcome.setOnItemClickListener { _, _, pos, _ -> selectedOutcome = outcomes[pos].first }

        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Catat Aktivitas")
            .setView(dialogView)
            .setPositiveButton("Simpan") { _, _ ->
                val desc = etDesc.text.toString().trim()
                val agentId: String
                val agentName: String
                if (isAgen) {
                    agentId = session.agentId ?: ""
                    agentName = session.userName ?: ""
                } else {
                    agentId = selectedAgent?.id ?: ""
                    agentName = selectedAgent?.name ?: ""
                }
                val error = when {
                    agentId.isBlank()        -> "Pilih agen"
                    selectedType.isBlank()   -> "Pilih jenis aktivitas"
                    desc.isBlank()           -> "Deskripsi wajib diisi"
                    selectedOutcome.isBlank()-> "Pilih hasil"
                    else -> null
                }
                if (error != null) {
                    Snackbar.make(b.root, error, Snackbar.LENGTH_LONG).show()
                    return@setPositiveButton
                }
                val token = session.accessToken ?: return@setPositiveButton
                viewLifecycleOwner.lifecycleScope.launch {
                    SupabaseApi.insertActivity(token, agentId, agentName, selectedType, desc, selectedOutcome, null)
                        .onSuccess {
                            Snackbar.make(b.root, "Aktivitas tercatat ✅", Snackbar.LENGTH_SHORT).show()
                            load()
                        }
                        .onFailure { Snackbar.make(b.root, it.message ?: "Gagal", Snackbar.LENGTH_LONG).show() }
                }
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
