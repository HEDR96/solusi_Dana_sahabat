package com.solusidana.sahabat.ui.commission

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.databinding.FragmentCommissionBinding

class CommissionFragment : Fragment() {

    private var _b: FragmentCommissionBinding? = null
    private val b get() = _b!!
    private val vm: CommissionViewModel by viewModels()

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentCommissionBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        vm.loading.observe(viewLifecycleOwner) { b.progress.isVisible = it }

        vm.summary.observe(viewLifecycleOwner) { s ->
            if (s == null) return@observe
            b.tvTotal.text  = formatRupiah(s.total)
            b.tvPaid.text   = formatRupiah(s.paid)
            b.tvUnpaid.text = formatRupiah(s.unpaid)

            b.containerItems.removeAllViews()
            if (s.items.isEmpty()) {
                val tv = TextView(requireContext()).apply {
                    text = "Belum ada komisi"
                    textSize = 13f
                    setTextColor(0xFF94A3B8.toInt())
                    setPadding(0, 16, 0, 16)
                }
                b.containerItems.addView(tv)
            } else {
                s.items.forEach { comm ->
                    val row = layoutInflater.inflate(R.layout.item_commission, b.containerItems, false)
                    row.findViewById<TextView>(R.id.tvCustomer).text = comm.customerName ?: "-"
                    row.findViewById<TextView>(R.id.tvAmount).text   = formatRupiah(comm.commissionAmount)
                    row.findViewById<TextView>(R.id.tvInfo).text     = buildString {
                        append(comm.appId ?: "")
                        if (!comm.agentName.isNullOrBlank()) append(" · ${comm.agentName}")
                        if (!comm.approveDate.isNullOrBlank()) append(" · ${comm.approveDate}")
                    }
                    val tvStatus = row.findViewById<TextView>(R.id.tvStatus)
                    if (comm.status == "paid") {
                        tvStatus.text = "✅ Dibayar ${comm.paymentDate ?: ""}"
                        tvStatus.setTextColor(0xFF16A34A.toInt())
                    } else {
                        tvStatus.text = "⏳ Belum dibayar"
                        tvStatus.setTextColor(0xFFDC2626.toInt())
                    }
                    b.containerItems.addView(row)
                }
            }
        }

        vm.error.observe(viewLifecycleOwner) { err ->
            if (err != null) {
                val tv = TextView(requireContext()).apply {
                    text = err
                    setTextColor(0xFFEF4444.toInt())
                }
                b.containerItems.removeAllViews()
                b.containerItems.addView(tv)
            }
        }

        b.swipeRefresh.setOnRefreshListener {
            vm.load()
            b.swipeRefresh.isRefreshing = false
        }

        vm.load()
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
