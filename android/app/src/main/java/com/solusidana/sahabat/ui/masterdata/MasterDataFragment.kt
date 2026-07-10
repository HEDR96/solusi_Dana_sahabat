package com.solusidana.sahabat.ui.masterdata

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.button.MaterialButton
import com.google.android.material.chip.Chip
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.MasterOption
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.databinding.FragmentMasterDataBinding
import kotlinx.coroutines.launch

/**
 * Kelola opsi dropdown (master_options) langsung dari APK — khusus owner/super-admin.
 * Perubahan langsung berlaku di web & APK semua user.
 */
class MasterDataFragment : Fragment() {

    private var _b: FragmentMasterDataBinding? = null
    private val b get() = _b!!

    private val categories = listOf(
        "unit_type"        to "Tipe Unit",
        "tenor"            to "Tenor (bulan)",
        "bank"             to "Bank",
        "payment_method"   to "Metode Bayar",
        "city"             to "Kota",
        "activity_type"    to "Jenis Aktivitas",
        "activity_outcome" to "Hasil Aktivitas",
        "role"             to "Role (Label)"
    )
    private var currentCategory = "unit_type"
    private var allOptions = listOf<MasterOption>()

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentMasterDataBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        categories.forEach { (key, label) ->
            val chip = Chip(requireContext()).apply {
                text = label
                isCheckable = true
                isChecked = key == currentCategory
                setOnCheckedChangeListener { _, checked ->
                    if (checked) { currentCategory = key; render() }
                }
            }
            b.chipGroup.addView(chip)
        }

        b.btnAdd.setOnClickListener { addOption() }

        load()
    }

    private fun token() = SessionManager(requireContext()).accessToken

    private fun load() {
        val token = token() ?: return
        b.progress.isVisible = true
        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.getMasterOptions(token)
                .onSuccess { allOptions = it }
                .onFailure { Snackbar.make(b.root, it.message ?: "Gagal memuat", Snackbar.LENGTH_LONG).show() }
            if (_b == null) return@launch
            b.progress.isVisible = false
            render()
        }
    }

    private fun render() {
        if (_b == null) return
        b.containerItems.removeAllViews()
        val items = allOptions.filter { it.category == currentCategory }.sortedBy { it.sort }

        if (items.isEmpty()) {
            val tv = TextView(requireContext()).apply {
                text = "Belum ada data — pastikan migration master data sudah dijalankan"
                textSize = 13f
                setTextColor(0xFF94A3B8.toInt())
                setPadding(8, 16, 8, 16)
            }
            b.containerItems.addView(tv)
            return
        }

        items.forEach { opt ->
            val row = layoutInflater.inflate(R.layout.item_master_option, b.containerItems, false)
            val tvValue = row.findViewById<TextView>(R.id.tvValue)
            tvValue.text = if (opt.active) opt.value else "${opt.value}  (nonaktif)"
            tvValue.alpha = if (opt.active) 1f else 0.45f

            row.findViewById<MaterialButton>(R.id.btnToggle).apply {
                text = if (opt.active) "Sembunyikan" else "Aktifkan"
                setOnClickListener {
                    val id = opt.id ?: return@setOnClickListener
                    val token = token() ?: return@setOnClickListener
                    viewLifecycleOwner.lifecycleScope.launch {
                        SupabaseApi.setMasterOptionActive(token, id, !opt.active)
                            .onSuccess { load() }
                            .onFailure { Snackbar.make(b.root, it.message ?: "Gagal", Snackbar.LENGTH_SHORT).show() }
                    }
                }
            }

            row.findViewById<MaterialButton>(R.id.btnDelete).setOnClickListener {
                val id = opt.id ?: return@setOnClickListener
                MaterialAlertDialogBuilder(requireContext())
                    .setTitle("Hapus \"${opt.value}\"?")
                    .setMessage("Dropdown di web & aplikasi tidak akan menampilkannya lagi.")
                    .setPositiveButton("Hapus") { _, _ ->
                        val token = token() ?: return@setPositiveButton
                        viewLifecycleOwner.lifecycleScope.launch {
                            SupabaseApi.deleteMasterOption(token, id)
                                .onSuccess { load() }
                                .onFailure { Snackbar.make(b.root, it.message ?: "Gagal", Snackbar.LENGTH_SHORT).show() }
                        }
                    }
                    .setNegativeButton("Batal", null)
                    .show()
            }

            b.containerItems.addView(row)
        }
    }

    private fun addOption() {
        val value = b.etNewValue.text.toString().trim()
        if (value.isBlank()) {
            Snackbar.make(b.root, "Isi nilai dulu", Snackbar.LENGTH_SHORT).show()
            return
        }
        val token = token() ?: return
        val maxSort = allOptions.filter { it.category == currentCategory }.maxOfOrNull { it.sort } ?: 0

        viewLifecycleOwner.lifecycleScope.launch {
            SupabaseApi.insertMasterOption(token, currentCategory, value, maxSort + 1)
                .onSuccess {
                    if (_b == null) return@onSuccess
                    b.etNewValue.setText("")
                    Snackbar.make(b.root, "\"$value\" ditambahkan ✅", Snackbar.LENGTH_SHORT).show()
                    load()
                }
                .onFailure { Snackbar.make(b.root, it.message ?: "Gagal", Snackbar.LENGTH_LONG).show() }
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
