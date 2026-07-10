package com.solusidana.sahabat.ui.simulation

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.databinding.FragmentSimulationBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Kalkulator angsuran flat sederhana.
 * Rate leasing di-cache di SharedPreferences agar tetap bisa dipakai offline.
 */
class SimulationFragment : Fragment() {

    private var _b: FragmentSimulationBinding? = null
    private val b get() = _b!!

    private var tenors = listOf(6, 12, 18, 24, 36, 48)   // dimuat ulang dari master data DB
    private var leasingRates: List<Pair<String, Double>> = emptyList()

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentSimulationBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        b.etPinjaman.doAfterTextChanged { recalc() }
        b.etRate.doAfterTextChanged { recalc() }

        loadRates()
    }

    private fun loadRates() {
        val prefs = requireContext().getSharedPreferences("rate_cache", Context.MODE_PRIVATE)

        // Muat cache dulu (untuk offline)
        val cached = prefs.getString("rates", null)
        if (cached != null) applyRates(parseRates(cached), fromCache = true)

        // Coba refresh dari server
        val token = SessionManager(requireContext()).accessToken ?: return
        viewLifecycleOwner.lifecycleScope.launch {
            // Tenor dari master data (dengan cache offline)
            val master = com.solusidana.sahabat.data.MasterData.load(requireContext(), token)
            master["tenor"]?.mapNotNull { it.toIntOrNull() }?.takeIf { it.isNotEmpty() }?.let {
                tenors = it
                if (_b != null) recalc()
            }
            val result = withContext(Dispatchers.IO) { SupabaseApi.getLeasingPartners(token) }
            result.onSuccess { list ->
                if (_b == null) return@onSuccess
                val serialized = list.joinToString("|") { "${it.name};${it.rate ?: 1.5}" }
                prefs.edit().putString("rates", serialized).apply()
                applyRates(parseRates(serialized), fromCache = false)
            }
        }
    }

    private fun parseRates(s: String): List<Pair<String, Double>> =
        s.split("|").mapNotNull {
            val parts = it.split(";")
            if (parts.size == 2) parts[0] to (parts[1].toDoubleOrNull() ?: 1.5) else null
        }

    private fun applyRates(rates: List<Pair<String, Double>>, fromCache: Boolean) {
        leasingRates = rates
        b.tvOffline.isVisible = fromCache && rates.isNotEmpty()
        b.ddLeasing.setAdapter(
            ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1,
                rates.map { "${it.first} (${it.second}%)" })
        )
        b.ddLeasing.setOnItemClickListener { _, _, pos, _ ->
            b.etRate.setText(rates[pos].second.toString())
        }
    }

    private fun recalc() {
        val pinjaman = b.etPinjaman.text.toString().toLongOrNull() ?: 0
        val rate     = b.etRate.text.toString().toDoubleOrNull() ?: 0.0

        b.containerResults.removeAllViews()
        if (pinjaman <= 0 || rate <= 0) {
            val tv = TextView(requireContext()).apply {
                text = "Masukkan pinjaman dan rate untuk melihat hasil"
                textSize = 13f
                setTextColor(0xFF94A3B8.toInt())
            }
            b.containerResults.addView(tv)
            return
        }

        val textPrimary = androidx.core.content.ContextCompat.getColor(requireContext(), com.solusidana.sahabat.R.color.text_primary)
        val surface = androidx.core.content.ContextCompat.getColor(requireContext(), com.solusidana.sahabat.R.color.surface)
        val bgAlt = androidx.core.content.ContextCompat.getColor(requireContext(), com.solusidana.sahabat.R.color.background)
        tenors.forEach { tenor ->
            val bunga    = (pinjaman * rate / 100 * tenor / 12).toLong()
            val total    = pinjaman + bunga
            val angsuran = total / tenor

            val row = TextView(requireContext()).apply {
                text = "▸ $tenor bulan   →   ${formatRupiah(angsuran)}/bln   (total ${formatRupiah(total)})"
                textSize = 14f
                setTextColor(textPrimary)
                setPadding(16, 20, 16, 20)
                setBackgroundColor(if (tenors.indexOf(tenor) % 2 == 0) surface else bgAlt)
            }
            b.containerResults.addView(row)
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
