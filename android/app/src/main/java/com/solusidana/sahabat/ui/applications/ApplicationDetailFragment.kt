package com.solusidana.sahabat.ui.applications

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.solusidana.sahabat.R
import com.solusidana.sahabat.data.SessionManager
import com.solusidana.sahabat.data.STATUSES
import com.solusidana.sahabat.data.SupabaseApi
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.data.statusColor
import com.solusidana.sahabat.data.statusLabel
import com.solusidana.sahabat.databinding.FragmentApplicationDetailBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File

class ApplicationDetailFragment : Fragment() {

    private var _b: FragmentApplicationDetailBinding? = null
    private val b get() = _b!!
    private val vm: ApplicationDetailViewModel by viewModels()
    private var appId = ""
    private var customerPhone: String? = null
    private var customerName: String = ""
    private var pendingDocType = ""
    private var cameraUri: Uri? = null

    private val docTypes = listOf("KTP", "KK", "STNK", "BPKB", "Slip Gaji", "Foto Unit")

    // Foto WAJIB langsung dari kamera (bukan galeri) — mencegah pemalsuan dokumen
    private val takePicture = registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        if (ok) cameraUri?.let { uploadImage(it) }
    }

    private val locationPermission = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        if (grants.values.any { it }) doCheckIn()
        else Snackbar.make(b.root, "Izin lokasi diperlukan untuk check-in", Snackbar.LENGTH_LONG).show()
    }

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _b = FragmentApplicationDetailBinding.inflate(i, c, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        appId = arguments?.getString("appId") ?: ""
        b.toolbar.setNavigationOnClickListener { findNavController().navigateUp() }

        val session = SessionManager(requireContext())
        // Paritas RLS/web: surveyor juga berhak mengubah status berkas
        val canEdit = session.userRole in listOf("owner", "super-admin", "admin", "spv-agen", "surveyor")

        vm.detail.observe(viewLifecycleOwner) { state ->
            when (state) {
                is DetailState.Loading -> {
                    b.progress.isVisible = true
                    b.content.isVisible  = false
                }
                is DetailState.Success -> {
                    b.progress.isVisible = false
                    b.content.isVisible  = true
                    val app = state.app

                    b.tvAppId.text    = app.id
                    b.tvCustomer.text = app.customerName
                    b.tvStatus.text   = statusLabel(app.status)
                    b.tvStatus.setTextColor(statusColor(app.status))
                    customerPhone = app.phone
                    customerName  = app.customerName

                    setRow(b.rowAgent,     "Agen",        app.agentName ?: "-")
                    setRow(b.rowLeasing,   "Leasing",     app.leasingName ?: "-")
                    setRow(b.rowPinjaman,  "Pinjaman",    formatRupiah(app.pinjaman))
                    setRow(b.rowTenor,     "Tenor",       "${app.tenor ?: "-"} bulan")
                    setRow(b.rowAngsuran,  "Angsuran/Bln",formatRupiah(app.estimasiAngsuran))
                    setRow(b.rowUnit,      "Unit",        "${app.unitType ?: ""} ${app.unitBrand ?: ""} ${app.unitYear ?: ""}".trim().ifBlank { "-" })
                    setRow(b.rowCity,      "Kota",        app.city ?: "-")
                    setRow(b.rowInputDate, "Tgl Masuk",   app.inputDate ?: "-")
                    setRow(b.rowSurvey,    "Survey",      if (!app.surveyDate.isNullOrBlank()) "${app.surveyDate} ${app.surveyTime ?: ""}".trim() else "-")
                    setRow(b.rowApprove,   "Approve",     if (!app.approveDate.isNullOrBlank()) "${app.approveDate} · ${formatRupiah(app.approvePinjaman)}" else "-")

                    b.tvNotes.text = if (!app.notes.isNullOrBlank()) "Catatan: ${app.notes}" else ""
                    b.tvNotes.isVisible = !app.notes.isNullOrBlank()

                    // Status logs
                    b.containerLogs.removeAllViews()
                    if (state.logs.isEmpty()) {
                        val tv = TextView(requireContext()).apply {
                            text = "Belum ada riwayat status"
                            textSize = 13f
                            setTextColor(0xFF94A3B8.toInt())
                        }
                        b.containerLogs.addView(tv)
                    } else {
                        val logColor = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.text_secondary)
                        state.logs.forEach { log ->
                            val tv = TextView(requireContext()).apply {
                                text = buildString {
                                    append("▸ ${statusLabel(log.toStatus)}")
                                    if (!log.date.isNullOrBlank()) append(" — ${log.date}")
                                    if (!log.user.isNullOrBlank()) append(" oleh ${log.user}")
                                    if (!log.notes.isNullOrBlank()) append("\n   ${log.notes}")
                                }
                                textSize = 13f
                                setPadding(0, 6, 0, 6)
                                setTextColor(logColor)
                            }
                            b.containerLogs.addView(tv)
                        }
                    }

                    b.btnUpdateStatus.isVisible = canEdit
                    b.btnUpdateStatus.setOnClickListener { showUpdateDialog(app.id, app.status) }

                    // Check-in hanya saat berkas dalam tahap survey
                    b.btnCheckIn.isVisible = app.status in listOf("janji-survey", "survey")
                    b.btnCheckIn.setOnClickListener { requestCheckIn() }
                }
                is DetailState.Error -> {
                    b.progress.isVisible = false
                    Snackbar.make(b.root, state.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }

        vm.update.observe(viewLifecycleOwner) { state ->
            when (state) {
                is UpdateState.Done ->
                    Snackbar.make(b.root, "Status berhasil diperbarui", Snackbar.LENGTH_SHORT).show()
                is UpdateState.Error ->
                    Snackbar.make(b.root, state.message, Snackbar.LENGTH_LONG).show()
                else -> {}
            }
        }

        // ── Telepon & WhatsApp ──
        b.btnCall.setOnClickListener {
            val phone = customerPhone
            if (phone.isNullOrBlank()) {
                Snackbar.make(b.root, "Nomor HP nasabah tidak tersedia", Snackbar.LENGTH_SHORT).show()
            } else {
                startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
            }
        }
        b.btnWhatsApp.setOnClickListener {
            val phone = customerPhone
            if (phone.isNullOrBlank()) {
                Snackbar.make(b.root, "Nomor HP nasabah tidak tersedia", Snackbar.LENGTH_SHORT).show()
            } else {
                val intl = phone.replace(Regex("[^0-9]"), "").let {
                    if (it.startsWith("0")) "62" + it.drop(1) else it
                }
                val msg = Uri.encode("Halo $customerName, saya dari Solusi Dana Sahabat terkait pengajuan Anda ($appId).")
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$intl?text=$msg")))
            }
        }

        // ── Upload dokumen ──
        b.btnUploadDoc.setOnClickListener { chooseDocType() }
        loadDocuments()

        vm.load(appId)
    }

    // ─── Dokumen ──────────────────────────────────────────────────────────────

    private fun chooseDocType() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Jenis Dokumen (foto langsung dari kamera)")
            .setItems(docTypes.toTypedArray()) { _, which ->
                pendingDocType = docTypes[which]
                launchCamera()   // hanya kamera — tanpa opsi galeri
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun launchCamera() {
        val dir = File(requireContext().cacheDir, "photos").apply { mkdirs() }
        val file = File(dir, "doc-${System.currentTimeMillis()}.jpg")
        cameraUri = FileProvider.getUriForFile(
            requireContext(),
            "${requireContext().packageName}.fileprovider",
            file
        )
        takePicture.launch(cameraUri)
    }

    private fun uploadImage(uri: Uri) {
        val token = SessionManager(requireContext()).accessToken ?: return
        Snackbar.make(b.root, "Mengupload $pendingDocType ke Google Drive...", Snackbar.LENGTH_SHORT).show()

        viewLifecycleOwner.lifecycleScope.launch {
            val bytes = withContext(Dispatchers.IO) { compressImage(uri) }
            if (bytes == null) {
                Snackbar.make(b.root, "Gagal membaca gambar", Snackbar.LENGTH_LONG).show()
                return@launch
            }
            SupabaseApi.uploadDocument(token, appId, pendingDocType, bytes)
                .onSuccess {
                    Snackbar.make(b.root, "$pendingDocType berhasil diupload", Snackbar.LENGTH_SHORT).show()
                    loadDocuments()
                }
                .onFailure {
                    Snackbar.make(b.root, it.message ?: "Upload gagal", Snackbar.LENGTH_LONG).show()
                }
        }
    }

    private fun compressImage(uri: Uri): ByteArray? {
        return try {
            val cr = requireContext().contentResolver

            // Pass 1: baca dimensi saja (tanpa decode piksel → tidak ada OOM)
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            cr.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }

            // Hitung inSampleSize: decode langsung ≤ 1600px sisi terpanjang
            val maxSide = 1600
            var sample = 1
            val longest = maxOf(bounds.outWidth, bounds.outHeight)
            while (longest / (sample * 2) > maxSide) sample *= 2

            // Pass 2: decode dengan inSampleSize + RGB_565 (setengah memori ARGB_8888)
            val opts = BitmapFactory.Options().apply {
                inSampleSize = sample
                inPreferredConfig = Bitmap.Config.RGB_565
            }
            val bitmap = cr.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, opts)
            } ?: return null

            // Fine-scale jika masih > 1600px setelah subsample
            val scale = minOf(1f, maxSide.toFloat() / maxOf(bitmap.width, bitmap.height))
            val resized = if (scale < 1f) Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * scale).toInt(),
                (bitmap.height * scale).toInt(),
                true
            ) else bitmap

            val out = ByteArrayOutputStream()
            resized.compress(Bitmap.CompressFormat.JPEG, 80, out)
            out.toByteArray()
        } catch (e: Exception) {
            null
        }
    }

    private fun loadDocuments() {
        val token = SessionManager(requireContext()).accessToken ?: return
        viewLifecycleOwner.lifecycleScope.launch {
            val docs = SupabaseApi.listDocuments(token, appId).getOrDefault(emptyList())
            if (_b == null) return@launch
            b.containerDocs.removeAllViews()
            if (docs.isEmpty()) {
                val tv = TextView(requireContext()).apply {
                    text = "Belum ada dokumen diupload"
                    textSize = 13f
                    setTextColor(0xFF94A3B8.toInt())
                }
                b.containerDocs.addView(tv)
            } else {
                docs.forEach { doc ->
                    val tv = TextView(requireContext()).apply {
                        text = "📎 ${doc.name}"
                        textSize = 13f
                        setTextColor(0xFF3B82F6.toInt())
                        setPadding(0, 10, 0, 10)
                        setOnClickListener {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(doc.link)))
                        }
                    }
                    b.containerDocs.addView(tv)
                }
            }
        }
    }

    // ─── Check-in GPS ─────────────────────────────────────────────────────────

    private fun requestCheckIn() {
        val fine   = android.Manifest.permission.ACCESS_FINE_LOCATION
        val coarse = android.Manifest.permission.ACCESS_COARSE_LOCATION
        val granted = androidx.core.content.ContextCompat.checkSelfPermission(requireContext(), fine) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
        if (granted) doCheckIn() else locationPermission.launch(arrayOf(fine, coarse))
    }

    @android.annotation.SuppressLint("MissingPermission")
    private fun doCheckIn() {
        Snackbar.make(b.root, "Mengambil lokasi...", Snackbar.LENGTH_SHORT).show()
        val client = com.google.android.gms.location.LocationServices
            .getFusedLocationProviderClient(requireActivity())

        client.getCurrentLocation(
            com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY, null
        ).addOnSuccessListener { location ->
            if (location == null) {
                Snackbar.make(b.root, "Lokasi tidak tersedia. Aktifkan GPS.", Snackbar.LENGTH_LONG).show()
                return@addOnSuccessListener
            }
            submitCheckIn(location.latitude, location.longitude)
        }.addOnFailureListener {
            Snackbar.make(b.root, "Gagal mengambil lokasi", Snackbar.LENGTH_LONG).show()
        }
    }

    private fun submitCheckIn(lat: Double, lng: Double) {
        val session = SessionManager(requireContext())
        val token = session.accessToken ?: return
        val mapsLink = "https://maps.google.com/?q=$lat,$lng"

        viewLifecycleOwner.lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                SupabaseApi.insertActivity(
                    token,
                    agentId   = session.agentId ?: session.userId ?: "",
                    agentName = session.userName ?: "",
                    type      = "survey",
                    description = "Check-in survey di lokasi nasabah $customerName ($mapsLink)",
                    outcome   = "hadir",
                    relatedAppId = appId
                )
            }
                .onSuccess {
                    Snackbar.make(b.root, "✅ Check-in berhasil tercatat", Snackbar.LENGTH_LONG).show()
                }
                .onFailure {
                    Snackbar.make(b.root, it.message ?: "Check-in gagal", Snackbar.LENGTH_LONG).show()
                }
        }
    }

    private fun setRow(row: com.solusidana.sahabat.databinding.RowInfoBinding, label: String, value: String) {
        row.tvLabel.text = label
        row.tvValue.text = value
    }

    private fun showUpdateDialog(id: String, current: String) {
        val keys    = STATUSES.filter { it != current }
        val options = keys.map { statusLabel(it) }.toTypedArray()
        var selected = 0

        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Ubah Status Berkas")
            .setSingleChoiceItems(options, 0) { _, which -> selected = which }
            .setPositiveButton("Lanjut") { _, _ ->
                showConfirmUpdate(id, current, keys[selected])
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun showConfirmUpdate(id: String, from: String, to: String) {
        if (to == "janji-survey") {
            pickDateThenTime { date, time -> doConfirmUpdate(id, from, to, date, time) }
        } else {
            doConfirmUpdate(id, from, to, "", "")
        }
    }

    private fun pickDateThenTime(onPicked: (date: String, time: String) -> Unit) {
        val cal = java.util.Calendar.getInstance()
        android.app.DatePickerDialog(
            requireContext(),
            { _, y, m, d ->
                val date = "%04d-%02d-%02d".format(y, m + 1, d)
                android.app.TimePickerDialog(
                    requireContext(),
                    { _, h, min ->
                        onPicked(date, "%02d:%02d".format(h, min))
                    },
                    cal.get(java.util.Calendar.HOUR_OF_DAY),
                    cal.get(java.util.Calendar.MINUTE),
                    true
                ).show()
            },
            cal.get(java.util.Calendar.YEAR),
            cal.get(java.util.Calendar.MONTH),
            cal.get(java.util.Calendar.DAY_OF_MONTH)
        ).show()
    }

    private fun doConfirmUpdate(id: String, from: String, to: String, surveyDate: String, surveyTime: String) {
        val notesInput = android.widget.EditText(requireContext()).apply {
            hint = "Catatan (opsional)"
            setPadding(48, 24, 48, 8)
        }
        val isTerminal = to in setOf("approve", "reject", "cancel")
        val title = if (isTerminal) "⚠️ Konfirmasi — Tidak Dapat Diubah" else "Konfirmasi"
        val message = buildString {
            append("${statusLabel(from)}  →  ${statusLabel(to)}")
            if (surveyDate.isNotBlank()) append("\nJadwal survey: $surveyDate $surveyTime")
            if (isTerminal) append("\n\nStatus ini bersifat FINAL dan tidak dapat diubah kembali setelah disimpan.")
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(title)
            .setMessage(message)
            .setView(notesInput)
            .setPositiveButton(if (isTerminal) "Ya, Konfirmasi" else "Simpan") { _, _ ->
                vm.updateStatus(id, to, notesInput.text.toString(), surveyDate, surveyTime)
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
