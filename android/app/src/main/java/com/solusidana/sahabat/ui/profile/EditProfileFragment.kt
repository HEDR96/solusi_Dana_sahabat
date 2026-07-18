package com.solusidana.sahabat.ui.profile

import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.EditText
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.data.MasterData
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.databinding.FragmentEditProfileBinding
import kotlinx.coroutines.launch

/**
 * Lengkapi profil: nama tampilan (semua role) + kontak & rekening (role agen).
 * Termasuk ubah password akun.
 */
class EditProfileFragment : Fragment() {

    private var _b: FragmentEditProfileBinding? = null
    private val b get() = _b!!

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentEditProfileBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        val session = SessionManager(requireContext())
        val isAgen = session.userRole == "agen"
        val token = session.accessToken ?: return

        b.etName.setText(session.userName ?: "")
        b.sectionAgent.isVisible = isAgen

        // Prefill data agen sendiri + dropdown bank
        if (isAgen) {
            val agentId = session.agentId
            viewLifecycleOwner.lifecycleScope.launch {
                val master = MasterData.load(requireContext(), token)
                if (_b == null) return@launch
                master["bank"]?.let { banks ->
                    b.ddBank.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, banks))
                }
                master["city"]?.let { cities ->
                    b.etCity.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, cities))
                    // Field kota bisa diketik; tap juga harus memunculkan daftar
                    b.etCity.setOnClickListener { b.etCity.showDropDown() }
                }
                if (agentId != null) {
                    SupabaseApi.getAgentById(token, agentId).onSuccess { ag ->
                        if (_b == null) return@onSuccess
                        b.etPhone.setText(ag.phone ?: "")
                        // setText biasa memicu filter adapter → dropdown tampak kosong;
                        // argumen false menonaktifkan filtering saat prefill
                        b.etCity.setText(ag.city ?: "", false)
                        b.etAddress.setText(ag.address ?: "")
                        b.ddBank.setText(ag.bank ?: "", false)
                        b.etAccountNumber.setText(ag.accountNumber ?: "")
                        b.etAccountName.setText(ag.accountName ?: "")
                    }
                }
            }
        }

        b.btnSave.setOnClickListener { save(session, isAgen) }
        b.btnChangePassword.setOnClickListener { showChangePassword(token) }
    }

    private fun save(session: SessionManager, isAgen: Boolean) {
        val token = session.accessToken ?: return
        val userId = session.userId ?: return
        val name = b.etName.text.toString().trim()
        if (name.isBlank()) {
            Snackbar.make(b.root, "Nama tidak boleh kosong", Snackbar.LENGTH_SHORT).show()
            return
        }

        b.btnSave.isEnabled = false
        b.progress.isVisible = true

        viewLifecycleOwner.lifecycleScope.launch {
            var ok = SupabaseApi.updateProfileName(token, userId, name).isSuccess
            if (ok) session.userName = name

            if (ok && isAgen && session.agentId != null) {
                ok = SupabaseApi.updateAgentSelf(
                    token, session.agentId!!,
                    phone = b.etPhone.text.toString().trim(),
                    city = b.etCity.text.toString().trim(),
                    address = b.etAddress.text.toString().trim(),
                    bank = b.ddBank.text.toString().trim(),
                    accountNumber = b.etAccountNumber.text.toString().trim(),
                    accountName = b.etAccountName.text.toString().trim()
                ).isSuccess
            }

            if (_b == null) return@launch
            b.btnSave.isEnabled = true
            b.progress.isVisible = false

            if (ok) {
                Snackbar.make(b.root, "Profil tersimpan ✅", Snackbar.LENGTH_SHORT).show()
                findNavController().navigateUp()
            } else {
                Snackbar.make(b.root, "Gagal menyimpan — periksa koneksi", Snackbar.LENGTH_LONG).show()
            }
        }
    }

    private fun showChangePassword(token: String) {
        val et = EditText(requireContext()).apply {
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            hint = "Password baru (min. 6 karakter)"
            setPadding(48, 32, 48, 16)
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Ubah Password")
            .setView(et)
            .setPositiveButton("Simpan") { _, _ ->
                val pass = et.text.toString()
                if (pass.length < 6) {
                    Snackbar.make(b.root, "Password minimal 6 karakter", Snackbar.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                viewLifecycleOwner.lifecycleScope.launch {
                    SupabaseApi.changePassword(token, pass)
                        .onSuccess { Snackbar.make(b.root, "Password berhasil diubah 🔑", Snackbar.LENGTH_SHORT).show() }
                        .onFailure { Snackbar.make(b.root, it.message ?: "Gagal", Snackbar.LENGTH_LONG).show() }
                }
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
