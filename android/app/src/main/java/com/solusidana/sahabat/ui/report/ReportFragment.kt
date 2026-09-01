package com.solusidana.sahabat.ui.report

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.os.bundleOf
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.google.android.material.chip.Chip
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.databinding.FragmentReportBinding

/**
 * Laporan ringkas untuk owner/super-admin/spv-agen di HP.
 * Sengaja tanpa grafik: yang berguna di layar kecil adalah angka kunci dan
 * daftar berkas mandek yang bisa langsung ditindak, bukan visualisasi.
 */
class ReportFragment : Fragment() {

    private var _b: FragmentReportBinding? = null
    private val b get() = _b!!
    private val vm: ReportViewModel by viewModels()

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentReportBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        Periode.entries.forEach { p ->
            val chip = Chip(requireContext()).apply {
                text = p.label
                isCheckable = true
                isChecked = p == vm.periode
                setOnCheckedChangeListener { _, checked -> if (checked) vm.setPeriode(p) }
            }
            b.chipPeriode.addView(chip)
        }

        vm.loading.observe(viewLifecycleOwner) {
            b.progress.isVisible = it
            if (!it) b.swipeRefresh.isRefreshing = false
        }
        vm.error.observe(viewLifecycleOwner) { err ->
            b.tvError.isVisible = err != null
            b.tvError.text = err
        }
        vm.data.observe(viewLifecycleOwner) { d -> if (d != null) bind(d) }

        b.swipeRefresh.setOnRefreshListener { vm.load() }
        vm.load()
    }

    private fun bind(d: ReportData) {
        b.tvTotal.text = d.totalBerkas.toString()
        b.tvKonversi.text = "${d.konversiPersen}%"
        b.tvApprove.text = "✅ ${d.approve} approve"
        b.tvReject.text = "❌ ${d.reject} reject"
        b.tvAktif.text = "⏳ ${d.aktif} berjalan"
        b.tvNilaiApprove.text = "Nilai approve: ${formatRupiah(d.nilaiApprove)}"
        b.tvKomisi.text = "Komisi — belum dibayar ${formatRupiah(d.komisiUnpaid)} · sudah ${formatRupiah(d.komisiPaid)}"

        // ── Berkas terlambat ──
        b.cardTelat.isVisible = d.terlambat.isNotEmpty()
        b.tvTelatJudul.text = "⚠️ ${d.terlambat.size} berkas terlambat"
        b.containerTelat.removeAllViews()
        d.terlambat.take(10).forEach { t ->
            val tv = TextView(requireContext()).apply {
                text = "${t.app.id} · ${t.app.customerName} — ${t.hari} hari (${t.app.status})"
                textSize = 13f
                setPadding(0, 10, 0, 10)
                setTextColor(0xFF334155.toInt())
                setOnClickListener {
                    findNavController().navigate(
                        R.id.action_report_to_detail,
                        bundleOf("appId" to t.app.id)
                    )
                }
            }
            b.containerTelat.addView(tv)
        }
        if (d.terlambat.size > 10) {
            b.containerTelat.addView(TextView(requireContext()).apply {
                text = "…dan ${d.terlambat.size - 10} berkas lainnya"
                textSize = 12f
                setPadding(0, 8, 0, 0)
                setTextColor(0xFF94A3B8.toInt())
            })
        }

        // ── Ringkasan per agen ──
        b.cardAgen.isVisible = d.perAgen.isNotEmpty()
        b.containerAgen.removeAllViews()
        d.perAgen.forEach { a ->
            val tv = TextView(requireContext()).apply {
                text = "${a.nama} — ${a.total} berkas, ${a.approve} approve"
                textSize = 13f
                setPadding(0, 9, 0, 9)
                setTextColor(0xFF334155.toInt())
            }
            b.containerAgen.addView(tv)
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
