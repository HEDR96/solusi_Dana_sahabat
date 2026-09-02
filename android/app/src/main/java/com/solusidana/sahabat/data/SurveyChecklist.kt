package com.solusidana.sahabat.data

/**
 * Checklist survey terstruktur.
 *
 * `key` adalah kunci penyimpanan di kolom jsonb survey_checklist — JANGAN
 * diubah setelah dipakai, data lama akan yatim. Label boleh diubah kapan saja.
 * Definisi ini harus sama dengan SURVEY_CHECKLIST di src/data/dummyData.js.
 */
data class SurveyItem(val key: String, val label: String, val options: List<String>)

val SURVEY_CHECKLIST = listOf(
    SurveyItem("alamat_sesuai",  "Alamat sesuai KTP",         listOf("Ya", "Tidak")),
    SurveyItem("status_tinggal", "Status tempat tinggal",     listOf("Milik Sendiri", "Keluarga", "Sewa/Kontrak")),
    SurveyItem("kondisi_unit",   "Kondisi unit",              listOf("Baik", "Cukup", "Kurang")),
    SurveyItem("penghasilan",    "Penghasilan terverifikasi", listOf("Ya", "Sebagian", "Tidak")),
    SurveyItem("dokumen",        "Kelengkapan dokumen",       listOf("Lengkap", "Kurang")),
    SurveyItem("lingkungan",     "Karakter & lingkungan",     listOf("Baik", "Cukup", "Kurang")),
)

data class SurveyRecommendation(val key: String, val label: String, val color: Int)

val SURVEY_RECOMMENDATIONS = listOf(
    SurveyRecommendation("layak",           "Layak",           0xFF15803D.toInt()),
    SurveyRecommendation("layak-bersyarat", "Layak Bersyarat", 0xFFB45309.toInt()),
    SurveyRecommendation("tidak-layak",     "Tidak Layak",     0xFFDC2626.toInt()),
)

fun surveyRecLabel(key: String?): String? =
    SURVEY_RECOMMENDATIONS.firstOrNull { it.key == key }?.label
