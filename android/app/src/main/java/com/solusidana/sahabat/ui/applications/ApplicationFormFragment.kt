package com.solusidana.sahabat.ui.applications

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.core.view.isVisible
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.data.Agent
import com.solusidana.sahabat.data.LeasingPartner
import com.solusidana.sahabat.data.OTR_YEARS
import com.solusidana.sahabat.data.OtrCatalogRow
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.databinding.FragmentApplicationFormBinding
import kotlinx.coroutines.launch

class ApplicationFormFragment : Fragment() {

    private var _b: FragmentApplicationFormBinding? = null
    private val b get() = _b!!
    private val vm: ApplicationFormViewModel by viewModels()
    private val listVm: ApplicationListViewModel by activityViewModels()

    private var selectedAgent: Agent? = null
    private var selectedLeasing: LeasingPartner? = null
    private var selectedTenor = 0
    private var isCMD = false

    // OTR state
    private var otrCatalog: List<OtrCatalogRow> = emptyList()
    private var selectedOtrBrand = ""
    private var selectedOtrTipe = ""
    private var selectedOtrRow: OtrCatalogRow? = null
    private var selectedOtrTahun = 0
    private var maxPinjaman: Long? = null
    private var selectedPinjaman = 0L

    private var unitTypes = listOf("Motor", "Mobil", "Sertifikat")
    private var tenorOptions = listOf(6, 12, 18, 24, 36, 48)
    private val fallbackCities = listOf(
        "Medan", "Binjai", "Deli Serdang", "Langkat",
        "Tebing Tinggi", "Pematang Siantar"
    )

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentApplicationFormBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        fun bindDropdowns() {
            b.ddUnitType.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, unitTypes))
            b.ddUnitType.setOnClickListener { b.ddUnitType.showDropDown() }
            b.ddUnitType.setOnItemClickListener { _, _, _, _ ->
                // Motor vs Mobil pakai katalog OTR berbeda (r2/r4) — pilihan brand/tipe/tahun
                // lama jadi tidak relevan lagi dan harus direset, lalu daftar brand di-refresh.
                if (isCMD) {
                    selectedOtrBrand = ""; selectedOtrTipe = ""; selectedOtrRow = null; selectedOtrTahun = 0; maxPinjaman = null
                    b.ddOtrBrand.setText("", false); b.ddOtrTipe.setText("", false); b.ddOtrTahun.setText("", false)
                    b.tilOtrTipe.isVisible = false; b.tilOtrTahun.isVisible = false; b.llOtrMaks.isVisible = false
                    resetPinjamanToText()
                    refreshOtrBrands()
                }
            }
            b.ddTenor.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, tenorOptions.map { "$it bulan" }))
            b.ddTenor.setOnClickListener { b.ddTenor.showDropDown() }
            b.ddTenor.setOnItemClickListener { _, _, pos, _ ->
                selectedTenor = tenorOptions[pos]
                updateEstimasi()
            }
        }
        bindDropdowns()

        b.etCity.setOnClickListener { b.etCity.showDropDown() }
        b.etCity.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, fallbackCities))

        vm.masterOptions.observe(viewLifecycleOwner) { master ->
            if (master.isEmpty()) return@observe
            master["unit_type"]?.let { unitTypes = it }
            master["tenor"]?.let { list -> tenorOptions = list.mapNotNull { it.toIntOrNull() }.ifEmpty { tenorOptions } }
            val cities = master["city"]?.takeIf { it.isNotEmpty() } ?: fallbackCities
            b.etCity.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, cities))
            bindDropdowns()
        }

        b.tilAgent.isVisible = !vm.isAgen
        vm.agents.observe(viewLifecycleOwner) { list ->
            b.ddAgent.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, list.map { it.name }))
            b.ddAgent.setOnClickListener { b.ddAgent.showDropDown() }
            b.ddAgent.setOnItemClickListener { _, _, pos, _ -> selectedAgent = list[pos] }
        }

        vm.leasing.observe(viewLifecycleOwner) { list ->
            b.ddLeasing.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, list.map { it.name }))
            b.ddLeasing.setOnClickListener { b.ddLeasing.showDropDown() }
            b.ddLeasing.setOnItemClickListener { _, _, pos, _ ->
                selectedLeasing = list[pos]
                isCMD = list[pos].name.trim().lowercase() == "cmd finance"
                onLeasingChanged()
                updateEstimasi()
            }
        }

        // OTR Brand → Tipe → Tahun
        b.ddOtrBrand.setOnClickListener { b.ddOtrBrand.showDropDown() }
        b.ddOtrBrand.setOnItemClickListener { _, _, _, _ ->
            selectedOtrBrand = b.ddOtrBrand.text.toString()
            selectedOtrTipe = ""; selectedOtrRow = null; selectedOtrTahun = 0; maxPinjaman = null
            b.ddOtrTipe.setText("", false); b.ddOtrTahun.setText("", false)
            b.tilOtrTipe.isVisible = true
            b.tilOtrTahun.isVisible = false
            b.llOtrMaks.isVisible = false
            b.tilUnitYearDropdown.isVisible = false
            resetPinjamanToText()
            val tipes = otrCatalog.filter { it.brand == selectedOtrBrand }.map { it.tipe }
            b.ddOtrTipe.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, tipes))
        }

        b.ddOtrTipe.setOnClickListener { b.ddOtrTipe.showDropDown() }
        b.ddOtrTipe.setOnItemClickListener { _, _, _, _ ->
            selectedOtrTipe = b.ddOtrTipe.text.toString()
            selectedOtrRow = otrCatalog.find { it.brand == selectedOtrBrand && it.tipe == selectedOtrTipe }
            selectedOtrTahun = 0; maxPinjaman = null
            b.ddOtrTahun.setText("", false)
            b.tilOtrTahun.isVisible = true
            b.llOtrMaks.isVisible = false
            resetPinjamanToText()
            val tahuns = OTR_YEARS.filter { yr -> selectedOtrRow?.getOtr(yr) != null }
            b.ddOtrTahun.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, tahuns.map { it.toString() }))
            // Sync ke tilUnitYearDropdown juga
            b.tilUnitYearDropdown.isVisible = false
        }

        b.ddOtrTahun.setOnClickListener { b.ddOtrTahun.showDropDown() }
        b.ddOtrTahun.setOnItemClickListener { _, _, _, _ ->
            selectedOtrTahun = b.ddOtrTahun.text.toString().toIntOrNull() ?: 0
            maxPinjaman = selectedOtrRow?.getMaxPinjaman(selectedOtrTahun)
            val mp = maxPinjaman
            b.llOtrMaks.isVisible = mp != null
            if (mp != null) b.tvOtrMaks.text = formatRupiah(mp)
            // Sync tahun ke unitYear dropdown
            b.ddUnitYear.setText(selectedOtrTahun.toString(), false)
            b.tilUnitYearDropdown.isVisible = true
            b.tilUnitYearText.isVisible = false
            // Auto-fill brand
            b.etUnitBrand.setText("${selectedOtrBrand} ${selectedOtrTipe}")
            // Switch pinjaman ke dropdown
            updatePinjamanDropdown()
        }

        // Tahun dropdown standalone (non-OTR atau OTR sudah memilih tahun)
        b.ddUnitYear.setOnClickListener { b.ddUnitYear.showDropDown() }
        b.ddUnitYear.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, OTR_YEARS.map { it.toString() }))
        b.ddUnitYear.setOnItemClickListener { _, _, _, _ ->
            if (selectedOtrRow != null) {
                selectedOtrTahun = b.ddUnitYear.text.toString().toIntOrNull() ?: 0
                maxPinjaman = selectedOtrRow?.getMaxPinjaman(selectedOtrTahun)
                val mp = maxPinjaman
                b.llOtrMaks.isVisible = mp != null
                if (mp != null) b.tvOtrMaks.text = formatRupiah(mp)
                updatePinjamanDropdown()
            }
        }

        // Pinjaman dropdown (CMD mode)
        b.ddPinjaman.setOnClickListener { b.ddPinjaman.showDropDown() }
        b.ddPinjaman.setOnItemClickListener { _, _, pos, _ ->
            selectedPinjaman = pinjamanOptions()[pos]
            updateEstimasi()
        }

        b.btnPakaiMaks.setOnClickListener {
            val opts = pinjamanOptions()
            if (opts.isNotEmpty()) {
                selectedPinjaman = opts.last()
                b.ddPinjaman.setText(formatRupiah(selectedPinjaman), false)
                updateEstimasi()
            }
        }

        b.etPinjaman.doAfterTextChanged {
            selectedPinjaman = b.etPinjaman.text.toString().toLongOrNull() ?: 0
            updateEstimasi()
        }

        b.btnSave.setOnClickListener { save() }

        vm.state.observe(viewLifecycleOwner) { state ->
            when (state) {
                is FormState.Saving -> { b.btnSave.isEnabled = false; b.progress.isVisible = true }
                is FormState.Saved -> {
                    listVm.needsRefresh = true
                    Snackbar.make(b.root, "Berkas ${state.appId} berhasil disimpan", Snackbar.LENGTH_LONG).show()
                    findNavController().navigateUp()
                }
                is FormState.SavedAsDraft -> {
                    Snackbar.make(b.root, "📴 Offline — berkas disimpan sebagai draft, akan terkirim otomatis saat online", Snackbar.LENGTH_LONG).show()
                    findNavController().navigateUp()
                }
                is FormState.Error -> {
                    b.btnSave.isEnabled = true; b.progress.isVisible = false
                    Snackbar.make(b.root, state.message, Snackbar.LENGTH_LONG).show()
                }
                else -> { b.btnSave.isEnabled = true; b.progress.isVisible = false }
            }
        }

        // Kegagalan memuat dropdown (leasing/agen) ditampilkan + bisa dicoba ulang
        vm.loadError.observe(viewLifecycleOwner) { msg ->
            if (msg == null) return@observe
            Snackbar.make(b.root, msg, Snackbar.LENGTH_INDEFINITE)
                .setAction("Coba lagi") { vm.loadOptions() }
                .show()
        }

        vm.loadOptions()
        // OTR juga butuh token segar (refreshSession di-throttle, aman dipanggil ganda)
        val session = SessionManager(requireContext())
        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.refreshSession(session)
            if (_b == null) return@launch
            session.accessToken?.let { loadOtrCatalog(it) }
        }
    }

    private fun loadOtrCatalog(token: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getOtrCatalog(token)
                .onSuccess { rows ->
                    if (_b == null) return@onSuccess
                    otrCatalog = rows
                    // Kalau leasing CMD sudah dipilih SEBELUM katalog ini selesai dimuat,
                    // dropdown brand tadi difilter dari list kosong dan tidak pernah
                    // di-refresh lagi — perbaiki begitu data katalog datang.
                    refreshOtrBrands()
                }
                .onFailure { e ->
                    if (_b == null) return@onFailure
                    // Tanpa ini kegagalan di sini diam-diam bikin dropdown Brand
                    // OTR kosong selamanya tanpa penjelasan.
                    Snackbar.make(b.root, "Gagal memuat katalog OTR: ${e.message}", Snackbar.LENGTH_LONG).show()
                }
        }
    }

    /** Filter brand OTR sesuai Tipe Unit (Motor/Mobil) dan isi ulang dropdown. */
    private fun refreshOtrBrands() {
        if (_b == null || !isCMD) return
        val wantMotor = b.ddUnitType.text.toString().trim().equals("motor", ignoreCase = true)
        val brands = otrCatalog.filter { it.isMotor() == wantMotor }.map { it.brand }.distinct().sorted()
        b.ddOtrBrand.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, brands))
    }

    private fun onLeasingChanged() {
        b.llCmdOtr.isVisible = isCMD
        b.tilUnitYearDropdown.isVisible = false
        b.tilUnitYearText.isVisible = true
        resetPinjamanToText()
        // Reset OTR state
        selectedOtrBrand = ""; selectedOtrTipe = ""; selectedOtrRow = null; selectedOtrTahun = 0; maxPinjaman = null
        b.ddOtrBrand.setText("", false); b.ddOtrTipe.setText("", false); b.ddOtrTahun.setText("", false)
        b.tilOtrTipe.isVisible = false; b.tilOtrTahun.isVisible = false; b.llOtrMaks.isVisible = false
        refreshOtrBrands()
    }

    private fun resetPinjamanToText() {
        b.tilPinjamanDropdown.isVisible = false
        b.tilPinjamanText.isVisible = true
        selectedPinjaman = b.etPinjaman.text.toString().toLongOrNull() ?: 0
    }

    private fun pinjamanOptions(): List<Long> {
        val mp = maxPinjaman ?: return emptyList()
        if (mp < 5_000_000L) return listOf(mp)
        // Langkah Rp 1 juta mulai dari 5 juta, lalu pastikan maks sendiri selalu
        // ada sebagai pilihan terakhir (dulu kalau maks bukan kelipatan bulat
        // 1 juta di atas 5 juta, nilai maks yang sebenarnya tidak pernah muncul
        // di dropdown sama sekali).
        val steps = mutableListOf<Long>()
        var v = 5_000_000L
        while (v < mp) { steps.add(v); v += 1_000_000L }
        steps.add(mp)
        return steps
    }

    private fun updatePinjamanDropdown() {
        val opts = pinjamanOptions()
        if (opts.isEmpty()) { resetPinjamanToText(); return }
        val labels = opts.map { formatRupiah(it) }
        b.ddPinjaman.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, labels))
        b.ddPinjaman.setText("", false)
        selectedPinjaman = 0L
        b.tilPinjamanDropdown.isVisible = true
        b.tilPinjamanText.isVisible = false
        updateEstimasi()
    }

    private fun updateEstimasi() {
        val pinjaman = if (isCMD && b.tilPinjamanDropdown.isVisible) selectedPinjaman
                       else b.etPinjaman.text.toString().toLongOrNull() ?: 0L
        val leasing = selectedLeasing
        if (pinjaman > 0 && selectedTenor > 0 && leasing != null) {
            val rate = leasing.rate ?: 1.5
            val bunga = (pinjaman * rate / 100 * selectedTenor / 12).toLong()
            val angsuran = (pinjaman + bunga) / selectedTenor
            b.tvEstimasi.text = "Estimasi angsuran: ${formatRupiah(angsuran)}/bulan (rate ${rate}%)"
        } else {
            b.tvEstimasi.text = "Estimasi angsuran akan dihitung otomatis"
        }
    }

    private fun save() {
        val name     = b.etCustomerName.text.toString().trim()
        val nik      = b.etNik.text.toString().trim()
        val phone    = b.etPhone.text.toString().trim()
        val city     = b.etCity.text.toString().trim()
        val unitType = b.ddUnitType.text.toString().trim()
        val leasing  = selectedLeasing
        val pinjaman = if (isCMD && b.tilPinjamanDropdown.isVisible) selectedPinjaman
                       else b.etPinjaman.text.toString().toLongOrNull() ?: 0L
        val unitYear = if (isCMD && b.tilUnitYearDropdown.isVisible) b.ddUnitYear.text.toString().trim()
                       else b.etUnitYear.text.toString().trim()
        val unitBrand = b.etUnitBrand.text.toString().trim()

        val error = when {
            name.isBlank()        -> "Nama nasabah wajib diisi"
            nik.length != 16      -> "NIK harus 16 digit"
            phone.isBlank()       -> "Nomor HP wajib diisi"
            city.isBlank()        -> "Kota wajib diisi"
            unitType.isBlank()    -> "Pilih tipe unit"
            pinjaman <= 0         -> "Pinjaman wajib diisi"
            selectedTenor <= 0    -> "Pilih tenor"
            leasing == null       -> "Pilih leasing tujuan"
            !vm.isAgen && selectedAgent == null -> "Pilih agen"
            else -> null
        }
        if (error != null) {
            Snackbar.make(b.root, error, Snackbar.LENGTH_LONG).show()
            return
        }

        vm.save(
            agent = selectedAgent,
            customerName = name,
            nik = nik,
            phone = phone,
            city = city,
            address = b.etAddress.text.toString().trim(),
            unitType = unitType,
            unitBrand = unitBrand,
            unitYear = unitYear,
            pinjaman = pinjaman,
            tenor = selectedTenor,
            leasingPartner = leasing!!,
            notes = b.etNotes.text.toString().trim()
        )
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
