package com.solusidana.sahabat.ui.agents

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.data.MasterData
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.databinding.FragmentAgentFormBinding
import kotlinx.coroutines.launch

/**
 * Form pendaftaran agen baru dari APK.
 * Owner/admin: agen tanpa supervisor. Spv-agen: otomatis jadi supervisor agen tsb.
 */
class AgentFormFragment : Fragment() {

    private var _b: FragmentAgentFormBinding? = null
    private val b get() = _b!!

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentAgentFormBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        val session = SessionManager(requireContext())
        val isSpv = session.userRole == "spv-agen"

        if (isSpv) {
            b.tvSpvInfo.isVisible = true
            b.tvSpvInfo.text = "👤 Agen ini otomatis menjadi binaan kamu (${session.userName})"
        }

        // Dropdown bank dari master data
        val token = session.accessToken
        if (token != null) {
            viewLifecycleOwner.lifecycleScope.launch {
                val master = MasterData.load(requireContext(), token)
                if (_b == null) return@launch
                master["bank"]?.let { banks ->
                    b.ddBank.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, banks))
                }
                master["city"]?.let { cities ->
                    b.etCity.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, cities))
                    b.etCity.setOnClickListener { b.etCity.showDropDown() }
                }
            }
        }

        b.btnSave.setOnClickListener { save(session, isSpv) }
    }

    private fun save(session: SessionManager, isSpv: Boolean) {
        val name  = b.etName.text.toString().trim()
        val nik   = b.etNik.text.toString().trim()
        val phone = b.etPhone.text.toString().trim()
        val city  = (b.etCity as? AutoCompleteTextView)?.text?.toString()?.trim()
            ?: b.etCity.text?.toString()?.trim() ?: ""

        val error = when {
            name.isBlank()   -> "Nama wajib diisi"
            nik.length != 16 -> "NIK harus 16 digit"
            phone.isBlank()  -> "Nomor HP wajib diisi"
            city.isBlank()   -> "Kota wajib diisi"
            else -> null
        }
        if (error != null) {
            Snackbar.make(b.root, error, Snackbar.LENGTH_LONG).show()
            return
        }

        val token = session.accessToken ?: return
        b.btnSave.isEnabled = false
        b.progress.isVisible = true

        val email = b.etEmail.text.toString().trim()

        viewLifecycleOwner.lifecycleScope.launch {
            val insertResult = SupabaseApi.insertAgent(
                token,
                name = name,
                phone = phone,
                email = email,
                city = city,
                address = b.etAddress.text.toString().trim(),
                nik = nik,
                bank = b.ddBank.text.toString().trim(),
                accountNumber = b.etAccountNumber.text.toString().trim(),
                accountName = b.etAccountName.text.toString().trim(),
                target = b.etTarget.text.toString().toIntOrNull() ?: 10,
                spvId = if (isSpv) session.userId else null
            )

            if (insertResult.isFailure) {
                if (_b == null) return@launch
                b.btnSave.isEnabled = true
                b.progress.isVisible = false
                Snackbar.make(b.root, insertResult.exceptionOrNull()?.message ?: "Gagal menyimpan", Snackbar.LENGTH_LONG).show()
                return@launch
            }

            val newId = insertResult.getOrThrow()

            // Paritas dengan web: buatkan akun login jika email diisi.
            // Endpoint hanya menerima owner/super-admin/admin — SPV diarahkan ke admin.
            val message = if (email.isNotBlank() && session.userRole in setOf("owner", "super-admin", "admin")) {
                SupabaseApi.createAgentLoginAccount(token, name, email, newId).fold(
                    onSuccess = { pass -> "Agen $name terdaftar ($newId) + akun login dibuat. Password: $pass" },
                    onFailure = { e -> "Agen terdaftar ($newId), tapi akun login gagal: ${e.message}" }
                )
            } else if (email.isNotBlank()) {
                "Agen $name terdaftar ($newId) ✅ — minta admin membuatkan akun login via web"
            } else {
                "Agen $name terdaftar ($newId) ✅"
            }

            if (_b == null) return@launch
            Snackbar.make(b.root, message, Snackbar.LENGTH_LONG).show()
            findNavController().navigateUp()
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
