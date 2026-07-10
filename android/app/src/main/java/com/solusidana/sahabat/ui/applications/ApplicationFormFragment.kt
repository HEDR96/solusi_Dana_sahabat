package com.solusidana.sahabat.ui.applications

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.core.view.isVisible
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.data.Agent
import com.solusidana.sahabat.data.LeasingPartner
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.databinding.FragmentApplicationFormBinding

class ApplicationFormFragment : Fragment() {

    private var _b: FragmentApplicationFormBinding? = null
    private val b get() = _b!!
    private val vm: ApplicationFormViewModel by viewModels()

    private var selectedAgent: Agent? = null
    private var selectedLeasing: LeasingPartner? = null
    private var selectedTenor = 0

    // Diisi dari master_options DB (owner kelola di menu Master Data web)
    private var unitTypes = listOf("Motor", "Mobil", "Sertifikat")
    private var tenorOptions = listOf(6, 12, 18, 24, 36, 48)

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentApplicationFormBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        // Dropdown tipe unit & tenor — dimuat dari master data DB
        fun bindDropdowns() {
            b.ddUnitType.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, unitTypes))
            b.ddTenor.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, tenorOptions.map { "$it bulan" }))
            b.ddTenor.setOnItemClickListener { _, _, pos, _ ->
                selectedTenor = tenorOptions[pos]
                updateEstimasi()
            }
        }
        bindDropdowns()

        vm.masterOptions.observe(viewLifecycleOwner) { master ->
            if (master.isEmpty()) return@observe
            master["unit_type"]?.let { unitTypes = it }
            master["tenor"]?.let { list -> tenorOptions = list.mapNotNull { it.toIntOrNull() }.ifEmpty { tenorOptions } }
            master["city"]?.let { cities ->
                b.etCity.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, cities))
            }
            bindDropdowns()
        }

        // Dropdown agen (untuk non-agen)
        b.tilAgent.isVisible = !vm.isAgen
        vm.agents.observe(viewLifecycleOwner) { list ->
            b.ddAgent.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, list.map { it.name }))
            b.ddAgent.setOnItemClickListener { _, _, pos, _ -> selectedAgent = list[pos] }
        }

        // Dropdown leasing
        vm.leasing.observe(viewLifecycleOwner) { list ->
            b.ddLeasing.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, list.map { it.name }))
            b.ddLeasing.setOnItemClickListener { _, _, pos, _ ->
                selectedLeasing = list[pos]
                updateEstimasi()
            }
        }

        b.etPinjaman.doAfterTextChanged { updateEstimasi() }

        b.btnSave.setOnClickListener { save() }

        vm.state.observe(viewLifecycleOwner) { state ->
            when (state) {
                is FormState.Saving -> {
                    b.btnSave.isEnabled = false
                    b.progress.isVisible = true
                }
                is FormState.Saved -> {
                    Snackbar.make(b.root, "Berkas ${state.appId} berhasil disimpan", Snackbar.LENGTH_LONG).show()
                    findNavController().navigateUp()
                }
                is FormState.SavedAsDraft -> {
                    Snackbar.make(b.root, "📴 Offline — berkas disimpan sebagai draft, akan terkirim otomatis saat online", Snackbar.LENGTH_LONG).show()
                    findNavController().navigateUp()
                }
                is FormState.Error -> {
                    b.btnSave.isEnabled = true
                    b.progress.isVisible = false
                    Snackbar.make(b.root, state.message, Snackbar.LENGTH_LONG).show()
                }
                else -> {
                    b.btnSave.isEnabled = true
                    b.progress.isVisible = false
                }
            }
        }

        vm.loadOptions()
    }

    private fun updateEstimasi() {
        val pinjaman = b.etPinjaman.text.toString().toLongOrNull() ?: 0
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
        val pinjaman = b.etPinjaman.text.toString().toLongOrNull() ?: 0
        val unitType = b.ddUnitType.text.toString().trim()
        val leasing  = selectedLeasing

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
            unitBrand = b.etUnitBrand.text.toString().trim(),
            unitYear = b.etUnitYear.text.toString().trim(),
            pinjaman = pinjaman,
            tenor = selectedTenor,
            leasingPartner = leasing!!,
            notes = b.etNotes.text.toString().trim()
        )
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
