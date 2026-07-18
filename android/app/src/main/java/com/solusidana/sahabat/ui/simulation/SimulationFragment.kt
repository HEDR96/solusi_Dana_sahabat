package com.solusidana.sahabat.ui.simulation

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.LeasingPartner
import com.solusidana.sahabat.data.OTR_YEARS
import com.solusidana.sahabat.data.OtrCatalogRow
import com.solusidana.sahabat.data.RateTable
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.data.humanError
import com.solusidana.sahabat.databinding.FragmentSimulationBinding
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

private val MOTOR_TENORS = listOf(6, 12, 18, 24, 30, 36)
private val CAR_TENORS   = listOf(12, 24, 36, 48)

class SimulationFragment : Fragment() {

    private var _b: FragmentSimulationBinding? = null
    private val b get() = _b!!

    private var leasingList: List<LeasingPartner> = emptyList()
    private var selectedLeasing: LeasingPartner? = null
    private var jenis = "motor"
    private var isRO  = false
    private var selectedTenor = 12
    private var selectedPencairan = 0L
    private var isCMD = false

    private var rateTables: Map<String, RateTable> = emptyMap()
    private var otrCatalog: List<OtrCatalogRow> = emptyList()

    // CMD OTR state
    private var selectedTahun = 0
    private var selectedBrand = ""
    private var selectedTipe  = ""
    private var selectedOtrRow: OtrCatalogRow? = null
    private var maxPinjaman: Long? = null

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentSimulationBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        b.toggleJenis.check(R.id.btnMotor)
        b.togglePengajuan.check(R.id.btnNew)

        // Pasang click listener leasing sejak awal — tidak bergantung pada hasil network
        b.ddLeasing.setOnClickListener { b.ddLeasing.showDropDown() }

        b.toggleJenis.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (!isChecked) return@addOnButtonCheckedListener
            jenis = if (checkedId == R.id.btnMotor) "motor" else "mobil"
            b.btnNew.text = if (jenis == "motor") "NEW" else "REGULER"
            // Motor vs Mobil pakai katalog OTR berbeda (r2/r4) — brand/tipe/tahun yang
            // sudah dipilih jadi tidak relevan; dulu dropdown brand tidak di-refresh
            // sama sekali di sini sehingga tetap menampilkan brand jenis sebelumnya.
            selectedBrand = ""; selectedTipe = ""; selectedOtrRow = null; selectedTahun = 0; maxPinjaman = null
            b.ddBrand.setText("", false); b.ddTipe.setText("", false); b.ddTahun.setText("", false)
            b.tilTipe.isVisible = false; b.tilTahun.isVisible = false
            updateBrandDropdown()
            resetPencairan()
            recalc()
        }

        b.togglePengajuan.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (!isChecked) return@addOnButtonCheckedListener
            isRO = (checkedId == R.id.btnRo)
            resetPencairan()
            recalc()
        }

        // Brand → Tipe → Tahun
        b.ddBrand.setOnClickListener { b.ddBrand.showDropDown() }
        b.ddBrand.setOnItemClickListener { _, _, _, _ ->
            selectedBrand = b.ddBrand.text.toString()
            selectedTipe = ""; selectedOtrRow = null; selectedTahun = 0; maxPinjaman = null
            b.ddTipe.setText("", false); b.ddTahun.setText("", false)
            b.tilTipe.isVisible = true
            b.tilTahun.isVisible = false
            b.tilPencairan.isVisible = false
            b.tilTenor.isVisible = false
            b.llMaksPinjaman.isVisible = false
            updateTipeDropdown()
        }

        b.ddTipe.setOnClickListener { b.ddTipe.showDropDown() }
        b.ddTipe.setOnItemClickListener { _, _, _, _ ->
            selectedTipe = b.ddTipe.text.toString()
            selectedOtrRow = otrCatalog.find { it.brand == selectedBrand && it.tipe == selectedTipe }
            selectedTahun = 0; maxPinjaman = null
            b.ddTahun.setText("", false)
            b.tilTahun.isVisible = true
            b.tilPencairan.isVisible = false
            b.tilTenor.isVisible = false
            b.llMaksPinjaman.isVisible = false
            updateTahunDropdown()
        }

        b.ddTahun.setOnClickListener { b.ddTahun.showDropDown() }
        b.ddTahun.setOnItemClickListener { _, _, pos, _ ->
            val tahunList = availableTahuns()
            selectedTahun = tahunList[pos]
            onTahunSelected()
        }

        // Pakai maks tersedia
        b.btnPakaiMaks.setOnClickListener {
            val opts = pencairaOptions()
            if (opts.isNotEmpty()) {
                selectedPencairan = opts.last()
                b.ddPencairan.setText(formatRupiah(selectedPencairan), false)
                updateTenorDropdown()
                b.tilTenor.isVisible = true
                recalc()
            }
        }

        // Pencairan
        b.ddPencairan.setOnClickListener { b.ddPencairan.showDropDown() }
        b.ddPencairan.setOnItemClickListener { _, _, pos, _ ->
            selectedPencairan = pencairaOptions()[pos]
            updateTenorDropdown()
            b.tilTenor.isVisible = true
            recalc()
        }

        // Tenor
        b.ddTenor.setOnClickListener { b.ddTenor.showDropDown() }
        b.ddTenor.setOnItemClickListener { _, _, pos, _ ->
            selectedTenor = tenorList()[pos]
            recalc()
        }

        // Refresh token dulu (kadaluarsa ~1 jam) supaya load leasing tidak 401
        val session = SessionManager(requireContext())
        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.refreshSession(session)
            if (_b == null) return@launch
            val token = session.accessToken
            if (token != null) {
                loadLeasing(token)
                loadOtrCatalog(token)
            } else {
                showPlaceholder("Sesi belum aktif — coba logout dan login ulang")
            }
        }
    }

    private fun tenorList() = if (jenis == "motor") MOTOR_TENORS else CAR_TENORS

    private fun availableTahuns(): List<Int> {
        val row = selectedOtrRow ?: return OTR_YEARS
        return OTR_YEARS.filter { row.getOtr(it) != null }
    }

    private fun onTahunSelected() {
        val row = selectedOtrRow
        maxPinjaman = if (row != null && selectedTahun > 0) row.getMaxPinjaman(selectedTahun) else null
        val mp = maxPinjaman
        b.llMaksPinjaman.isVisible = mp != null
        if (mp != null) b.tvMaksPinjaman.text = formatRupiah(mp)
        updatePencairanDropdown()
        b.tilPencairan.isVisible = true
    }

    private fun updateTahunDropdown() {
        val tahuns = availableTahuns()
        b.ddTahun.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, tahuns.map { it.toString() }))
    }

    private fun pencairaOptions(): List<Long> {
        val typeKey = if (isRO) "ro" else if (jenis == "motor") "new" else "reg"
        val angKey = "${jenis}_${typeKey}_ang"
        val table = rateTables[angKey] ?: return emptyList()
        val keys = table.data.keys.mapNotNull { it.toLongOrNull() }.sorted()
        val all = keys.map { it * 1000L }
        val mp = maxPinjaman
        return if (isCMD && mp != null) all.filter { it <= mp } else all
    }

    private fun updatePencairanDropdown() {
        val opts = pencairaOptions()
        if (opts.isEmpty()) return
        val labels = opts.map { formatRupiah(it) }
        b.ddPencairan.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, labels))
        // Reset pilihan jika tidak ada di list
        if (selectedPencairan !in opts) {
            selectedPencairan = 0L
            b.ddPencairan.setText("", false)
        }
    }

    private fun updateTenorDropdown() {
        val list = tenorList()
        if (list.isEmpty()) return
        if (selectedTenor !in list) selectedTenor = list.getOrElse(1) { list.first() }
        b.ddTenor.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, list.map { "$it bulan" }))
        b.ddTenor.setText("$selectedTenor bulan", false)
    }

    private fun updateBrandDropdown() {
        val unitType = if (jenis == "motor") "r2" else "r4"
        val brands = otrCatalog
            .filter { it.unitType == null || it.unitType == unitType }
            .map { it.brand }.distinct().sorted()
        b.ddBrand.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, brands))
        // Reset tipe/tahun jika jenis berubah
        b.tilTipe.isVisible = false
        b.tilTahun.isVisible = false
    }

    private fun updateTipeDropdown() {
        val tipes = otrCatalog.filter { it.brand == selectedBrand }.map { it.tipe }
        b.ddTipe.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, tipes))
    }

    private fun resetPencairan() {
        selectedPencairan = 0L
        b.ddPencairan.setText("", false)
        b.tilTenor.isVisible = false
        if (!isCMD) updatePencairanDropdown()
    }

    private fun loadLeasing(token: String) {
        b.progress.isVisible = true
        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getLeasingPartners(token)
                .onSuccess { list ->
                    if (_b == null) return@onSuccess
                    leasingList = list.filter { it.status == null || it.status == "aktif" }
                    val names = leasingList.map { it.name }
                    b.ddLeasing.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, names))
                    b.ddLeasing.setOnItemClickListener { _, _, pos, _ ->
                        onLeasingSelected(leasingList[pos], token)
                    }
                    showPlaceholder(if (leasingList.isEmpty()) "Belum ada leasing aktif" else "Pilih leasing tujuan untuk memulai simulasi")
                }
                .onFailure { e ->
                    if (_b == null) return@onFailure
                    showPlaceholder("Gagal memuat leasing")
                    Toast.makeText(requireContext(), humanError(e), Toast.LENGTH_LONG).show()
                }
            b.progress.isVisible = false
        }
    }

    private fun loadOtrCatalog(token: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getOtrCatalog(token).onSuccess { rows ->
                if (_b == null) return@onSuccess
                otrCatalog = rows
                updateBrandDropdown()
                // Isi tahun dropdown
                b.ddTahun.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, OTR_YEARS.map { it.toString() }))
            }
        }
    }

    private fun onLeasingSelected(leasing: LeasingPartner, token: String) {
        selectedLeasing = leasing
        isCMD = leasing.name.trim().lowercase() == "cmd finance"
        rateTables = emptyMap()
        selectedPencairan = 0L; selectedTahun = 0
        selectedBrand = ""; selectedTipe = ""; selectedOtrRow = null; maxPinjaman = null

        b.llInputs.isVisible = true
        b.llCmdOtr.isVisible = isCMD
        b.tilTipe.isVisible = false
        b.tilTahun.isVisible = false
        b.tilPencairan.isVisible = !isCMD
        b.tilTenor.isVisible = false
        b.llMaksPinjaman.isVisible = false
        b.ddPencairan.setText("", false)
        b.ddTahun.setText("", false)
        b.ddBrand.setText("", false)
        b.ddTipe.setText("", false)

        showPlaceholder("Memuat tabel rate...")
        b.progress.isVisible = true

        val leasingKey = if (isCMD) "CMD" else leasing.id.toString()

        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getRateTables(token, leasingKey).onSuccess { tables ->
                if (_b == null) return@onSuccess
                rateTables = tables.associateBy { "${it.product}_${it.tipe}" }
                if (!isCMD) updatePencairanDropdown()
            }
            b.progress.isVisible = false
            showPlaceholder(if (isCMD) "Pilih tahun kendaraan terlebih dahulu" else "Pilih jumlah pencairan")
        }
    }

    private fun recalc() {
        if (_b == null) return
        val leasing = selectedLeasing ?: return
        if (selectedPencairan <= 0) return
        if (selectedTenor <= 0) return

        val pengajuan = if (jenis == "motor") (if (isRO) "ro" else "new") else (if (isRO) "ro" else "reg")
        val angKey = "${jenis}_${pengajuan}_ang"
        val feeKey = "${jenis}_${pengajuan}_fee"

        val angTable = rateTables[angKey]
        val feeTable = rateTables[feeKey]
        val tenors   = tenorList()
        val pRibu    = selectedPencairan / 1000L

        val angsuran = if (angTable != null) lookupVal(angTable, tenors, pRibu, selectedTenor) else null
        val fee      = if (feeTable != null) lookupVal(feeTable, tenors, pRibu, selectedTenor) else null

        if (angsuran == null || fee == null) {
            showPlaceholder(if (rateTables.isEmpty()) "Memuat tabel rate..." else "Data tidak tersedia untuk pilihan ini")
            return
        }

        showResult(
            leasing        = leasing.name,
            pengajuanLabel = if (jenis == "motor") (if (isRO) "RO" else "NEW") else (if (isRO) "RO" else "REGULER"),
            jenisLabel     = if (jenis == "motor") "Motor" else "Mobil",
            tenor          = selectedTenor,
            pencairan      = selectedPencairan,
            angsuran       = angsuran,
            fee            = fee
        )
    }

    private fun lookupVal(table: RateTable, tenors: List<Int>, pRibu: Long, tenorBln: Int): Long? {
        val ti = tenors.indexOf(tenorBln)
        if (ti == -1) return null
        val keys = table.data.keys.mapNotNull { it.toLongOrNull() }.sorted()
        if (keys.isEmpty()) return null
        fun rowVal(key: Long): Long? = table.data[key.toString()]?.jsonArray?.getOrNull(ti)?.jsonPrimitive?.long
        if (pRibu <= keys.first()) return (rowVal(keys.first()) ?: return null) * 1000L
        if (pRibu >= keys.last())  return (rowVal(keys.last())  ?: return null) * 1000L
        var lo = keys.first(); var hi = keys[1]
        for (i in 0 until keys.size - 1) {
            if (pRibu >= keys[i] && pRibu <= keys[i + 1]) { lo = keys[i]; hi = keys[i + 1]; break }
        }
        val v1 = rowVal(lo) ?: return null
        val v2 = rowVal(hi) ?: return null
        return Math.round(v1 + (pRibu - lo).toDouble() / (hi - lo) * (v2 - v1)) * 1000L
    }

    private fun showPlaceholder(msg: String) {
        val c = b.containerResult
        c.removeAllViews()
        c.addView(TextView(requireContext()).apply {
            text = msg; textSize = 13f
            setTextColor(0xFF94A3B8.toInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 24, 0, 24)
        })
    }

    private fun showResult(leasing: String, pengajuanLabel: String, jenisLabel: String, tenor: Int, pencairan: Long, angsuran: Long, fee: Long) {
        val c = b.containerResult
        c.removeAllViews()

        val card1 = com.google.android.material.card.MaterialCardView(requireContext()).apply {
            radius = 48f; cardElevation = 0f
            setCardBackgroundColor(android.graphics.Color.TRANSPARENT)
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).also { it.bottomMargin = 42 }
        }
        val inner1 = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 72, 60, 72)
            background = requireContext().getDrawable(R.drawable.bg_header_gradient)
        }
        inner1.addView(tv("$leasing · $jenisLabel $pengajuanLabel · $tenor Bulan", 11f, 0xFF93C5FD.toInt(), false, 6))
        inner1.addView(tv("Angsuran per Bulan", 11f, 0xFF93C5FD.toInt(), false, 4))
        inner1.addView(tv(formatRupiah(angsuran), 30f, 0xFFFFFFFF.toInt(), true, 48))
        val grid = LinearLayout(requireContext()).apply { orientation = LinearLayout.HORIZONTAL }
        val col1 = LinearLayout(requireContext()).apply { orientation = LinearLayout.VERTICAL; layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f) }
        val col2 = LinearLayout(requireContext()).apply { orientation = LinearLayout.VERTICAL; layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f) }
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
        card1.addView(inner1); c.addView(card1)

        val card2 = com.google.android.material.card.MaterialCardView(requireContext()).apply {
            radius = 42f; strokeColor = 0xFFBBF7D0.toInt(); strokeWidth = 4
            setCardBackgroundColor(0xFFF0FDF4.toInt())
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).also { it.bottomMargin = 42 }
        }
        val inner2 = LinearLayout(requireContext()).apply { orientation = LinearLayout.VERTICAL; setPadding(60, 54, 60, 54) }
        inner2.addView(tv("KOMISI LEASING", 11f, 0xFF15803D.toInt(), true, 8))
        inner2.addView(tv(formatRupiah(fee), 28f, 0xFF15803D.toInt(), true, 8))
        inner2.addView(tv("Per berkas disetujui · $leasing · $jenisLabel $pengajuanLabel", 12f, 0xFF16A34A.toInt(), false, 0))
        card2.addView(inner2); c.addView(card2)

        val noteCard = com.google.android.material.card.MaterialCardView(requireContext()).apply {
            radius = 30f; setCardBackgroundColor(requireContext().getColor(R.color.background)); cardElevation = 0f
        }
        val noteInner = LinearLayout(requireContext()).apply { setPadding(42, 36, 42, 36) }
        noteInner.addView(tv("Nilai berdasarkan tabel resmi $leasing. Owner dapat mengubah tabel di Master Data → Tabel Rate.", 11f, 0xFF64748B.toInt(), false, 0))
        noteCard.addView(noteInner); c.addView(noteCard)
    }

    private fun tv(text: String, size: Float, color: Int, bold: Boolean, bottomMargin: Int): TextView =
        TextView(requireContext()).apply {
            this.text = text; textSize = size; setTextColor(color.toLong().toInt())
            if (bold) setTypeface(null, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).also { it.bottomMargin = bottomMargin }
        }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
