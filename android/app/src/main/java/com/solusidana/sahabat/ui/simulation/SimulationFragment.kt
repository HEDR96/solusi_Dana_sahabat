package com.solusidana.sahabat.ui.simulation

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.LeasingPartner
import com.solusidana.sahabat.data.RateTable
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.databinding.FragmentSimulationBinding
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

/** Tenor resmi — harus sama dengan web (rateTables.js) */
private val MOTOR_TENORS = listOf(6, 12, 18, 24, 30, 36)
private val CAR_TENORS   = listOf(12, 24, 36, 48)

class SimulationFragment : Fragment() {

    private var _b: FragmentSimulationBinding? = null
    private val b get() = _b!!

    private var leasingList: List<LeasingPartner> = emptyList()
    private var selectedLeasing: LeasingPartner? = null
    private var jenis = "motor"     // "motor" | "mobil"
    private var isRO  = false
    private var selectedTenor = 12

    // tabel rate dari DB: key = "${product}_${tipe}" e.g. "motor_new_ang"
    private var rateTables: Map<String, RateTable> = emptyMap()
    private var tablesLoading = false

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentSimulationBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        // Default: Motor + NEW terpilih
        b.toggleJenis.check(R.id.btnMotor)
        b.togglePengajuan.check(R.id.btnNew)

        // Jenis produk toggle
        b.toggleJenis.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (!isChecked) return@addOnButtonCheckedListener
            jenis = if (checkedId == R.id.btnMotor) "motor" else "mobil"
            // Update label NEW/REGULER sesuai jenis
            b.btnNew.text = if (jenis == "motor") "NEW" else "REGULER"
            updateTenorDropdown()
            recalc()
        }

        // Jenis pengajuan toggle
        b.togglePengajuan.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (!isChecked) return@addOnButtonCheckedListener
            isRO = (checkedId == R.id.btnRo)
            recalc()
        }

        // Input pencairan
        b.etPencairan.doAfterTextChanged { recalc() }

        // Tenor dropdown
        b.ddTenor.setOnItemClickListener { _, _, pos, _ ->
            selectedTenor = tenorList()[pos]
            recalc()
        }

        loadLeasing()
    }

    private fun tenorList() = if (jenis == "motor") MOTOR_TENORS else CAR_TENORS

    private fun updateTenorDropdown() {
        val list = tenorList()
        if (selectedTenor !in list) selectedTenor = list[1] // default 12 bulan
        b.ddTenor.setAdapter(ArrayAdapter(requireContext(),
            android.R.layout.simple_dropdown_item_1line, list.map { "$it bulan" }))
        b.ddTenor.setText("$selectedTenor bulan", false)
    }

    private fun loadLeasing() {
        val token = SessionManager(requireContext()).accessToken ?: return
        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getLeasingPartners(token).onSuccess { list ->
                if (_b == null) return@onSuccess
                leasingList = list.filter { it.status == null || it.status == "aktif" }
                b.ddLeasing.setAdapter(ArrayAdapter(requireContext(),
                    android.R.layout.simple_dropdown_item_1line, leasingList.map { it.name }))
                b.ddLeasing.setOnItemClickListener { _, _, pos, _ ->
                    onLeasingSelected(leasingList[pos], token)
                }
            }
        }
    }

    private fun onLeasingSelected(leasing: LeasingPartner, token: String) {
        selectedLeasing = leasing
        rateTables = emptyMap()
        b.llInputs.isVisible = true
        updateTenorDropdown()
        showPlaceholder("Memuat tabel rate...")
        b.progress.isVisible = true

        // leasing_key: CMD Finance pakai 'CMD', leasing lain pakai ID
        val leasingKey = if (leasing.name.trim().lowercase() == "cmd finance") "CMD"
                         else leasing.id.toString()

        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getRateTables(token, leasingKey).onSuccess { tables ->
                if (_b == null) return@onSuccess
                rateTables = tables.associateBy { "${it.product}_${it.tipe}" }
            }
            b.progress.isVisible = false
            recalc()
        }
    }

    private fun recalc() {
        if (_b == null) return
        val leasing = selectedLeasing ?: run {
            showPlaceholder("Pilih leasing tujuan untuk memulai simulasi")
            return
        }
        val pencairan = b.etPencairan.text.toString().toLongOrNull() ?: 0L
        if (pencairan <= 0) {
            showPlaceholder("Masukkan jumlah pencairan")
            return
        }

        // Batas min/max
        val (minP, maxP) = if (jenis == "motor") 5_000_000L to 20_000_000L else 30_000_000L to 200_000_000L
        if (pencairan < minP || pencairan > maxP) {
            showPlaceholder("Pencairan di luar batas: ${formatRupiah(minP)} – ${formatRupiah(maxP)}")
            return
        }

        val pengajuan = if (jenis == "motor") (if (isRO) "ro" else "new")
                        else (if (isRO) "ro" else "reg")
        val angKey = "${jenis}_${pengajuan}_ang"
        val feeKey = "${jenis}_${pengajuan}_fee"

        val angTable = rateTables[angKey]
        val feeTable = rateTables[feeKey]

        val tenors = tenorList()
        val pRibu  = pencairan / 1000L

        val angsuran = if (angTable != null) lookupVal(angTable, tenors, pRibu, selectedTenor) else null
        val fee      = if (feeTable != null) lookupVal(feeTable, tenors, pRibu, selectedTenor) else null

        if (angsuran == null || fee == null) {
            val hint = if (rateTables.isEmpty()) "Memuat tabel rate dari server..." else "Pilih tenor untuk melihat hasil"
            showPlaceholder(hint)
            return
        }

        showResult(
            leasing       = leasing.name,
            pengajuanLabel = if (jenis == "motor") (if (isRO) "RO" else "NEW") else (if (isRO) "RO" else "REGULER"),
            jenisLabel    = if (jenis == "motor") "Motor" else "Mobil",
            tenor         = selectedTenor,
            pencairan     = pencairan,
            angsuran      = angsuran,
            fee           = fee
        )
    }

    /**
     * Lookup linear interpolasi — sama persis dengan lookupVal di web (rateTables.js).
     * table.data: { "5000": [1108, 626, ...], ... }  (nilai dalam ribu)
     */
    private fun lookupVal(table: RateTable, tenors: List<Int>, pRibu: Long, tenorBln: Int): Long? {
        val ti = tenors.indexOf(tenorBln)
        if (ti == -1) return null

        val keys = table.data.keys.mapNotNull { it.toLongOrNull() }.sorted()
        if (keys.isEmpty()) return null

        fun rowVal(key: Long): Long? =
            table.data[key.toString()]?.jsonArray?.getOrNull(ti)?.jsonPrimitive?.long

        if (pRibu <= keys.first()) return (rowVal(keys.first()) ?: return null) * 1000L
        if (pRibu >= keys.last())  return (rowVal(keys.last())  ?: return null) * 1000L

        var lo = keys.first(); var hi = keys[1]
        for (i in 0 until keys.size - 1) {
            if (pRibu >= keys[i] && pRibu <= keys[i + 1]) { lo = keys[i]; hi = keys[i + 1]; break }
        }
        val v1 = rowVal(lo) ?: return null
        val v2 = rowVal(hi) ?: return null
        val interpolated = v1 + (pRibu - lo).toDouble() / (hi - lo) * (v2 - v1)
        return Math.round(interpolated) * 1000L
    }

    private fun showPlaceholder(msg: String) {
        val c = b.containerResult
        c.removeAllViews()
        val tv = TextView(requireContext()).apply {
            text = msg
            textSize = 13f
            setTextColor(0xFF94A3B8.toInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 24, 0, 24)
        }
        c.addView(tv)
    }

    private fun showResult(
        leasing: String, pengajuanLabel: String, jenisLabel: String,
        tenor: Int, pencairan: Long, angsuran: Long, fee: Long
    ) {
        val c = b.containerResult
        c.removeAllViews()

        // ── Gradient header card (biru) ──────────────────────────────────────────
        val card1 = com.google.android.material.card.MaterialCardView(requireContext()).apply {
            radius = 48f
            cardElevation = 0f
            setCardBackgroundColor(android.graphics.Color.TRANSPARENT)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ).also { it.bottomMargin = 42 }
        }

        val inner1 = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 72, 60, 72)
            background = requireContext().getDrawable(R.drawable.bg_header_gradient)
        }

        inner1.addView(tv(
            "$leasing · $jenisLabel $pengajuanLabel · $tenor Bulan",
            11f, 0xFF93C5FD.toInt(), bold = false, bottomMargin = 6
        ))
        inner1.addView(tv("Angsuran per Bulan", 11f, 0xFF93C5FD.toInt(), bold = false, bottomMargin = 4))
        inner1.addView(tv(formatRupiah(angsuran), 30f, 0xFFFFFFFF.toInt(), bold = true, bottomMargin = 48))

        // Grid info 2x2
        val grid = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.HORIZONTAL
        }
        val col1 = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        val col2 = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        col1.addView(tv("Jumlah Pinjaman", 11f, 0xFF93C5FD.toInt(), false, 4))
        col1.addView(tv(formatRupiah(pencairan), 13f, 0xFFFFFFFF.toInt(), true, 16))
        col1.addView(tv("Total Bayar Nasabah", 11f, 0xFF93C5FD.toInt(), false, 4))
        col1.addView(tv(formatRupiah(angsuran * tenor), 13f, 0xFFFFFFFF.toInt(), true, 0))
        col2.addView(tv("Tenor", 11f, 0xFF93C5FD.toInt(), false, 4))
        col2.addView(tv("$tenor bulan", 13f, 0xFFFFFFFF.toInt(), true, 16))
        col2.addView(tv("Jenis Pengajuan", 11f, 0xFF93C5FD.toInt(), false, 4))
        col2.addView(tv(pengajuanLabel, 13f, 0xFFFFFFFF.toInt(), true, 0))
        grid.addView(col1); grid.addView(col2)
        inner1.addView(grid)
        card1.addView(inner1)
        c.addView(card1)

        // ── Komisi leasing (hijau) ───────────────────────────────────────────────
        val card2 = com.google.android.material.card.MaterialCardView(requireContext()).apply {
            radius = 42f
            strokeColor = 0xFFBBF7D0.toInt()
            strokeWidth = 4
            setCardBackgroundColor(0xFFF0FDF4.toInt())
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ).also { it.bottomMargin = 42 }
        }
        val inner2 = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 54, 60, 54)
        }
        inner2.addView(tv("KOMISI LEASING", 11f, 0xFF15803D.toInt(), true, 8))
        inner2.addView(tv(formatRupiah(fee), 28f, 0xFF15803D.toInt(), true, 8))
        inner2.addView(tv("Per berkas disetujui · $leasing · $jenisLabel $pengajuanLabel", 12f, 0xFF16A34A.toInt(), false, 0))
        card2.addView(inner2)
        c.addView(card2)

        // ── Catatan ──────────────────────────────────────────────────────────────
        val noteCard = com.google.android.material.card.MaterialCardView(requireContext()).apply {
            radius = 30f
            setCardBackgroundColor(requireContext().getColor(R.color.background))
            cardElevation = 0f
        }
        val noteInner = LinearLayout(requireContext()).apply {
            setPadding(42, 36, 42, 36)
        }
        noteInner.addView(tv(
            "Nilai berdasarkan tabel resmi $leasing. Owner dapat mengubah tabel di Master Data → Tabel Rate.",
            11f, 0xFF64748B.toInt(), false, 0
        ))
        noteCard.addView(noteInner)
        c.addView(noteCard)
    }

    /** Helper buat TextView dengan padding bawah. */
    private fun tv(text: String, size: Float, color: Int, bold: Boolean, bottomMargin: Int): TextView =
        TextView(requireContext()).apply {
            this.text = text
            textSize = size
            setTextColor(color.toLong().toInt())
            if (bold) setTypeface(null, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ).also { it.bottomMargin = bottomMargin }
        }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
