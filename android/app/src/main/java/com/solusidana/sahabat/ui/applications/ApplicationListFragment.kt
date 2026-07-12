package com.solusidana.sahabat.ui.applications

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
import com.google.android.material.chip.Chip
import com.solusidana.sahabat.R
import com.solusidana.sahabat.databinding.FragmentApplicationListBinding

class ApplicationListFragment : Fragment() {

    private var _b: FragmentApplicationListBinding? = null
    private val b get() = _b!!
    private val vm: ApplicationListViewModel by viewModels()
    private lateinit var adapter: ApplicationAdapter

    private val statusFilters = listOf(
        "all"          to "Semua",
        "pending"      to "Pending",
        "cek-data"     to "Cek Data",
        "janji-survey" to "Janji Survey",
        "survey"       to "Survey",
        "komite"       to "Komite",
        "approve"      to "Approve",
        "reject"       to "Reject",
        "cancel"       to "Cancel"
    )

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentApplicationListBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = ApplicationAdapter { app ->
            findNavController().navigate(
                R.id.action_applications_to_detail,
                Bundle().apply { putString("appId", app.id) }
            )
        }
        b.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        b.recyclerView.adapter = adapter

        // Chip filters
        statusFilters.forEach { (key, label) ->
            val chip = Chip(requireContext()).apply {
                text = label
                isCheckable = true
                isChecked = key == "all"
                setOnCheckedChangeListener { _, checked ->
                    if (checked) vm.setFilter(key)
                }
            }
            b.chipGroup.addView(chip)
        }

        b.searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(q: String?) = true.also { vm.search(q ?: "") }
            override fun onQueryTextChange(q: String?) = true.also { vm.search(q ?: "") }
        })

        vm.loading.observe(viewLifecycleOwner) { isLoading ->
            b.progress.isVisible = isLoading
            if (!isLoading) b.swipeRefresh.isRefreshing = false
        }
        vm.apps.observe(viewLifecycleOwner) { list ->
            adapter.submitList(list)
            b.tvEmpty.isVisible = list.isEmpty() && vm.loading.value == false
            b.tvCount.text = "${list.size} berkas"
        }
        vm.error.observe(viewLifecycleOwner) { err ->
            if (err != null) {
                b.tvEmpty.isVisible = true
                b.tvEmpty.text = err
            }
        }

        b.swipeRefresh.setOnRefreshListener { vm.load() }

        b.fabAdd.setOnClickListener {
            findNavController().navigate(R.id.action_applications_to_form)
        }

        vm.load()
    }

    override fun onResume() {
        super.onResume()
        if (vm.needsRefresh) {
            vm.needsRefresh = false
            vm.load()
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
