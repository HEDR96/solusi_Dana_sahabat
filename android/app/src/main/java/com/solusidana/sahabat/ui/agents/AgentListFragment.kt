package com.solusidana.sahabat.ui.agents

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.widget.SearchView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.Agent
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.databinding.FragmentAgentListBinding

class AgentListFragment : Fragment() {

    private var _b: FragmentAgentListBinding? = null
    private val b get() = _b!!
    private val vm: AgentViewModel by viewModels()
    private lateinit var adapter: AgentAdapter

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentAgentListBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = AgentAdapter { showDetail(it) }
        b.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        b.recyclerView.adapter = adapter

        b.searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(q: String?) = true.also { vm.filter(q ?: "") }
            override fun onQueryTextChange(q: String?) = true.also { vm.filter(q ?: "") }
        })

        vm.loading.observe(viewLifecycleOwner) { b.progress.isVisible = it }
        vm.agents.observe(viewLifecycleOwner) { list ->
            adapter.submitList(list)
            b.tvEmpty.isVisible = list.isEmpty()
        }
        vm.error.observe(viewLifecycleOwner) { err ->
            b.tvEmpty.isVisible = err != null
            if (err != null) b.tvEmpty.text = err
        }

        b.swipeRefresh.setOnRefreshListener {
            vm.load()
            b.swipeRefresh.isRefreshing = false
        }

        // Owner & spv-agen bisa mendaftarkan agen baru dari APK
        val role = SessionManager(requireContext()).userRole
        if (role in listOf("owner", "super-admin", "spv-agen")) {
            b.fabAddAgent.isVisible = true
            b.fabAddAgent.setOnClickListener {
                findNavController().navigate(R.id.action_agents_to_form)
            }
        }

        vm.load()
    }

    override fun onResume() {
        super.onResume()
        vm.load()   // refresh setelah kembali dari form
    }

    private fun showDetail(ag: Agent) {
        val rate = if ((ag.totalBerkas ?: 0) > 0)
            (ag.totalApprove ?: 0) * 100 / (ag.totalBerkas ?: 1) else 0

        MaterialAlertDialogBuilder(requireContext())
            .setTitle(ag.name)
            .setMessage(buildString {
                appendLine("Status   : ${if (ag.status == "aktif") "Aktif" else "Nonaktif"}")
                appendLine("Kota     : ${ag.city ?: "-"}")
                appendLine("Telepon  : ${ag.phone ?: "-"}")
                appendLine("Email    : ${ag.email ?: "-"}")
                appendLine("NIK      : ${ag.nik ?: "-"}")
                appendLine()
                appendLine("Total Berkas : ${ag.totalBerkas ?: 0}")
                appendLine("Approve      : ${ag.totalApprove ?: 0} ($rate%)")
                appendLine("Reject       : ${ag.totalReject ?: 0}")
                appendLine()
                appendLine("Bank    : ${ag.bank ?: "-"}")
                appendLine("Rek.    : ${ag.accountNumber ?: "-"}")
                appendLine("A/N     : ${ag.accountName ?: "-"}")
                appendLine("Target  : ${ag.target ?: "-"} berkas/bulan")
                appendLine("Bergabung : ${ag.joinDate ?: "-"}")
            })
            .setPositiveButton("Tutup", null)
            .show()
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
