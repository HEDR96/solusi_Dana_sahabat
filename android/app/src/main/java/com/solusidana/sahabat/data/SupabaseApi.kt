package com.solusidana.sahabat.data

import com.solusidana.sahabat.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor

object SupabaseApi {

    private val BASE_URL = BuildConfig.SUPABASE_URL
    private val ANON_KEY = BuildConfig.SUPABASE_ANON_KEY

    /** Semua panggilan jaringan (OkHttp execute) wajib berjalan di IO dispatcher. */
    private suspend fun <T> io(block: () -> T): Result<T> =
        withContext(Dispatchers.IO) { runCatching(block) }

    val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }

    private val client = OkHttpClient.Builder()
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        .build()

    private val JSON_TYPE = "application/json; charset=utf-8".toMediaType()

    suspend fun login(email: String, password: String): Result<AuthResponse> =
        io {
            val body = """{"email":"$email","password":"$password"}"""
                .toRequestBody(JSON_TYPE)
            val req = Request.Builder()
                .url("$BASE_URL/auth/v1/token?grant_type=password")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: ""
            if (!resp.isSuccessful) error("Login gagal: ${resp.code}")
            json.decodeFromString<AuthResponse>(text)
        }

    /**
     * Perbarui access token pakai refresh token (token Supabase kadaluarsa ~1 jam).
     * Dipanggil setiap buka app dan di awal setiap worker background.
     */
    suspend fun refreshSession(session: SessionManager): Boolean {
        val refresh = session.refreshToken ?: return session.accessToken != null
        val result = io {
            val body = """{"refresh_token":"$refresh"}""".toRequestBody(JSON_TYPE)
            val req = Request.Builder()
                .url("$BASE_URL/auth/v1/token?grant_type=refresh_token")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: ""
            if (!resp.isSuccessful) error("Refresh gagal: ${resp.code}")
            json.decodeFromString<AuthResponse>(text)
        }
        result.onSuccess { auth ->
            session.accessToken  = auth.accessToken
            session.refreshToken = auth.refreshToken
        }
        return result.isSuccess || session.accessToken != null
    }

    suspend fun getProfile(token: String, userId: String): Result<Profile> =
        io {
            val req = Request.Builder()
                .url("$BASE_URL/rest/v1/profiles?id=eq.$userId&select=*")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            val list = json.decodeFromString<List<Profile>>(text)
            list.firstOrNull() ?: error("Profil tidak ditemukan")
        }

    suspend fun getApplications(
        token: String,
        agentId: String? = null,
        status: String? = null
    ): Result<List<Application>> = io {
        val filters = buildString {
            append("select=*&order=input_date.desc")
            if (agentId != null) append("&agent_id=eq.$agentId")
            if (status != null) append("&status=eq.$status")
        }
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/applications?$filters")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        json.decodeFromString<List<Application>>(text)
    }

    suspend fun getApplicationById(token: String, id: String): Result<Application> =
        io {
            val req = Request.Builder()
                .url("$BASE_URL/rest/v1/applications?id=eq.$id&select=*")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            val list = json.decodeFromString<List<Application>>(text)
            list.firstOrNull() ?: error("Berkas tidak ditemukan")
        }

    suspend fun updateApplicationStatus(
        token: String,
        id: String,
        newStatus: String,
        notes: String?,
        surveyDate: String?,
        surveyTime: String?,
        userName: String
    ): Result<Unit> = io {
        val approveDate = if (newStatus == "approve") java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date()) else null
        val patchBody = buildString {
            append("{\"status\":\"$newStatus\"")
            if (!notes.isNullOrBlank()) append(",\"notes\":\"$notes\"")
            if (!surveyDate.isNullOrBlank()) append(",\"survey_date\":\"$surveyDate\"")
            if (!surveyTime.isNullOrBlank()) append(",\"survey_time\":\"$surveyTime\"")
            if (approveDate != null) append(",\"approve_date\":\"$approveDate\"")
            append("}")
        }.toRequestBody(JSON_TYPE)

        val patchReq = Request.Builder()
            .url("$BASE_URL/rest/v1/applications?id=eq.$id")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .patch(patchBody)
            .build()
        client.newCall(patchReq).execute()

        // Insert status log
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        val logBody = """[{"app_id":"$id","to_status":"$newStatus","user":"$userName","date":"$today","notes":${if (notes.isNullOrBlank()) "null" else "\"$notes\""}}]"""
            .toRequestBody(JSON_TYPE)
        val logReq = Request.Builder()
            .url("$BASE_URL/rest/v1/status_logs")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(logBody)
            .build()
        client.newCall(logReq).execute()
    }

    suspend fun getStatusLogs(token: String, appId: String): Result<List<StatusLog>> =
        io {
            val req = Request.Builder()
                .url("$BASE_URL/rest/v1/status_logs?app_id=eq.$appId&select=*&order=id")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            json.decodeFromString<List<StatusLog>>(text)
        }

    suspend fun getAgents(token: String): Result<List<Agent>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/agents?select=*&order=name")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        json.decodeFromString<List<Agent>>(text)
    }

    suspend fun getLeasingPartners(token: String): Result<List<LeasingPartner>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/leasing_partners?select=id,name,rate,status,min_pinjaman,max_pinjaman&order=name")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        json.decodeFromString<List<LeasingPartner>>(text)
    }

    suspend fun getActivities(token: String, agentId: String? = null): Result<List<AgentActivity>> = io {
        val filters = buildString {
            append("select=*&order=date.desc,id.desc&limit=100")
            if (agentId != null) append("&agent_id=eq.$agentId")
        }
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/agent_activities?$filters")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        json.decodeFromString<List<AgentActivity>>(text)
    }

    suspend fun getAgentById(token: String, agentId: String): Result<Agent> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/agents?id=eq.$agentId&select=*")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        json.decodeFromString<List<Agent>>(text).firstOrNull() ?: error("Agen tidak ditemukan")
    }

    /** Update nama tampilan user (tabel profiles). */
    suspend fun updateProfileName(token: String, userId: String, name: String): Result<Unit> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"")
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/profiles?id=eq.$userId")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .patch("""{"name":"${esc(name)}"}""".toRequestBody(JSON_TYPE))
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Gagal update profil: ${resp.code}")
    }

    /** Agen melengkapi data dirinya sendiri (kontak & rekening). */
    suspend fun updateAgentSelf(
        token: String, agentId: String,
        phone: String, city: String, address: String,
        bank: String, accountNumber: String, accountName: String
    ): Result<Unit> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")
        val body = """{"phone":"${esc(phone)}","city":"${esc(city)}","address":"${esc(address)}","bank":"${esc(bank)}","account_number":"${esc(accountNumber)}","account_name":"${esc(accountName)}"}"""
            .toRequestBody(JSON_TYPE)
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/agents?id=eq.$agentId")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .patch(body)
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Gagal update data: ${resp.code}")
    }

    /** Ganti password akun (Supabase Auth). */
    suspend fun changePassword(token: String, newPassword: String): Result<Unit> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"")
        val req = Request.Builder()
            .url("$BASE_URL/auth/v1/user")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Content-Type", "application/json")
            .put("""{"password":"${esc(newPassword)}"}""".toRequestBody(JSON_TYPE))
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) {
            val text = resp.body?.string() ?: ""
            error(if (text.contains("least")) "Password minimal 6 karakter" else "Gagal ganti password: ${resp.code}")
        }
    }

    /** Tambah agen baru (owner/admin/spv-agen). spvId diisi otomatis jika penambah adalah spv. */
    suspend fun insertAgent(
        token: String,
        name: String, phone: String, email: String, city: String,
        address: String, nik: String, bank: String, accountNumber: String,
        accountName: String, target: Int, spvId: String?
    ): Result<String> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")

        // ID format sama dengan web: AGT + urutan 3 digit
        val countReq = Request.Builder()
            .url("$BASE_URL/rest/v1/agents?select=id")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "count=exact")
            .addHeader("Range", "0-0")
            .get()
            .build()
        val countResp = client.newCall(countReq).execute()
        val count = (countResp.header("Content-Range") ?: "0/0")
            .substringAfter("/").toIntOrNull() ?: 0
        val newId = "AGT" + (count + 1).toString().padStart(3, '0')

        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        val body = """{
            "id":"$newId","name":"${esc(name)}","phone":"${esc(phone)}","email":"${esc(email)}",
            "city":"${esc(city)}","address":"${esc(address)}","nik":"${esc(nik)}","status":"aktif",
            "join_date":"$today","bank":"${esc(bank)}","account_number":"${esc(accountNumber)}",
            "account_name":"${esc(accountName)}","target":$target,
            "total_approve":0,"total_reject":0,"total_berkas":0,
            "spv_id":${if (spvId == null) "null" else "\"${esc(spvId)}\""}
        }""".trimIndent().toRequestBody(JSON_TYPE)

        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/agents")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(body)
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Gagal tambah agen: ${resp.code} ${resp.body?.string()?.take(200)}")
        newId
    }

    suspend fun getMasterOptions(token: String): Result<List<MasterOption>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/master_options?select=id,category,value,sort,active&order=category,sort")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        json.decodeFromString<List<MasterOption>>(text)
    }

    suspend fun insertMasterOption(token: String, category: String, value: String, sort: Int): Result<Unit> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"")
        val body = """{"category":"${esc(category)}","value":"${esc(value)}","sort":$sort,"active":true}"""
            .toRequestBody(JSON_TYPE)
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/master_options")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(body)
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) {
            val text = resp.body?.string() ?: ""
            error(if (text.contains("duplicate")) "Nilai sudah ada" else "Gagal: ${resp.code}")
        }
    }

    suspend fun setMasterOptionActive(token: String, id: Long, active: Boolean): Result<Unit> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/master_options?id=eq.$id")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .patch("""{"active":$active}""".toRequestBody(JSON_TYPE))
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Gagal update: ${resp.code}")
    }

    suspend fun deleteMasterOption(token: String, id: Long): Result<Unit> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/master_options?id=eq.$id")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .delete()
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Gagal hapus: ${resp.code}")
    }

    /** Nomor berkas berikutnya dari sequence DB (anti-tabrakan). */
    suspend fun nextBrkId(token: String): Result<String> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/rpc/next_brk_id")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Content-Type", "application/json")
            .post("{}".toRequestBody(JSON_TYPE))
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string()?.trim()?.removeSurrounding("\"") ?: ""
        if (!resp.isSuccessful || !text.startsWith("BRK")) error("RPC next_brk_id gagal: ${resp.code}")
        text
    }

    suspend fun getApplicationsCount(token: String): Result<Int> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/applications?select=id")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "count=exact")
            .addHeader("Range", "0-0")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val contentRange = resp.header("Content-Range") ?: "0/0"
        contentRange.substringAfter("/").toIntOrNull() ?: 0
    }

    suspend fun insertApplication(
        token: String,
        id: String,
        agentId: String,
        agentName: String,
        customerName: String,
        nik: String,
        phone: String,
        city: String,
        address: String,
        unitType: String,
        unitBrand: String,
        unitYear: String,
        pinjaman: Long,
        tenor: Int,
        estimasiAngsuran: Long,
        leasingId: String,
        leasingName: String,
        notes: String
    ): Result<Unit> = io {
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")
        val body = """{
            "id":"${esc(id)}","status":"pending",
            "agent_id":"${esc(agentId)}","agent_name":"${esc(agentName)}",
            "customer_name":"${esc(customerName)}","nik":"${esc(nik)}","phone":"${esc(phone)}",
            "city":"${esc(city)}","address":"${esc(address)}",
            "unit_type":"${esc(unitType)}","unit_brand":"${esc(unitBrand)}","unit_year":"${esc(unitYear)}",
            "pinjaman":$pinjaman,"tenor":$tenor,"estimasi_angsuran":$estimasiAngsuran,
            "leasing_id":"${esc(leasingId)}","leasing_name":"${esc(leasingName)}",
            "input_date":"$today","notes":"${esc(notes)}"
        }""".trimIndent().toRequestBody(JSON_TYPE)

        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/applications")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(body)
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Gagal simpan berkas: ${resp.code} ${resp.body?.string()?.take(200)}")

        // Notifikasi untuk web ERP
        val notifBody = """{"type":"berkas-baru","message":"Berkas baru dari ${esc(agentName)} - ${esc(customerName)}","time_ago":"Baru saja","read":false,"link":"/applications"}"""
            .toRequestBody(JSON_TYPE)
        val notifReq = Request.Builder()
            .url("$BASE_URL/rest/v1/notifications")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(notifBody)
            .build()
        client.newCall(notifReq).execute()
    }

    suspend fun insertActivity(
        token: String,
        agentId: String,
        agentName: String,
        type: String,
        description: String,
        outcome: String,
        relatedAppId: String?
    ): Result<Unit> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        val body = """{"agent_id":"${esc(agentId)}","agent_name":"${esc(agentName)}","date":"$today","type":"${esc(type)}","description":"${esc(description)}","outcome":"${esc(outcome)}","related_app_id":${if (relatedAppId == null) "null" else "\"${esc(relatedAppId)}\""}}"""
            .toRequestBody(JSON_TYPE)
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/agent_activities")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(body)
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Check-in gagal: ${resp.code}")
    }

    suspend fun getCommissions(token: String, agentId: String? = null): Result<List<Commission>> =
        io {
            val filters = buildString {
                append("select=*&order=id.desc")
                if (agentId != null) append("&agent_id=eq.$agentId")
            }
            val req = Request.Builder()
                .url("$BASE_URL/rest/v1/commissions?$filters")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            json.decodeFromString<List<Commission>>(text)
        }

    suspend fun getTodaySurveys(token: String, agentId: String? = null): Result<List<Application>> =
        io {
            val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
            val filters = buildString {
                append("select=*&survey_date=eq.$today&status=in.(janji-survey,survey)&order=survey_time")
                if (agentId != null) append("&agent_id=eq.$agentId")
            }
            val req = Request.Builder()
                .url("$BASE_URL/rest/v1/applications?$filters")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            json.decodeFromString<List<Application>>(text)
        }

    /** Kirim/perbarui lokasi terakhir user (untuk Peta Agen di web, khusus owner). */
    suspend fun upsertLocation(
        token: String,
        userId: String,
        name: String,
        role: String,
        lat: Double,
        lng: Double
    ): Result<Unit> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"")
        val now = java.time.Instant.now().toString()
        val body = """{"user_id":"${esc(userId)}","name":"${esc(name)}","role":"${esc(role)}","lat":$lat,"lng":$lng,"updated_at":"$now"}"""
            .toRequestBody(JSON_TYPE)
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/agent_locations?on_conflict=user_id")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "resolution=merge-duplicates,return=minimal")
            .post(body)
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Gagal update lokasi: ${resp.code}")
    }

    // ── Google Drive (via endpoint Vercel — service account aman di server) ──

    private const val GDRIVE_API = "https://solusi-dana-sahabat.vercel.app/api/gdrive"

    data class DriveFile(val name: String, val link: String)

    suspend fun uploadDocument(
        token: String,
        appId: String,
        docType: String,
        imageBytes: ByteArray
    ): Result<String> = io {
        val safeType = docType.lowercase().replace(" ", "-")
        val filename = "${appId}_${safeType}_${System.currentTimeMillis()}.jpg"
        val dataBase64 = java.util.Base64.getEncoder().encodeToString(imageBytes)
        val body = """{"filename":"$filename","contentType":"image/jpeg","dataBase64":"$dataBase64"}"""
            .toRequestBody(JSON_TYPE)
        val req = Request.Builder()
            .url(GDRIVE_API)
            .addHeader("Authorization", "Bearer $token")
            .post(body)
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: ""
        if (!resp.isSuccessful) error("Upload gagal: ${resp.code} ${text.take(200)}")
        filename
    }

    suspend fun listDocuments(token: String, appId: String): Result<List<DriveFile>> = io {
        val req = Request.Builder()
            .url("$GDRIVE_API?appId=$appId")
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "{}"
        // Parse ringan: pasangan name + webViewLink dari array files
        Regex("\\{[^{}]*\"name\"\\s*:\\s*\"([^\"]+)\"[^{}]*\"webViewLink\"\\s*:\\s*\"([^\"]+)\"[^{}]*\\}")
            .findAll(text)
            .map { DriveFile(it.groupValues[1], it.groupValues[2]) }
            .toList()
    }

    suspend fun getPendingApplicationsCount(token: String, agentId: String? = null): Result<Int> =
        io {
            val filter = buildString {
                append("status=not.in.(approve,reject,cancel)")
                if (agentId != null) append("&agent_id=eq.$agentId")
            }
            val req = Request.Builder()
                .url("$BASE_URL/rest/v1/applications?$filter&select=id")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Prefer", "count=exact")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val contentRange = resp.header("Content-Range") ?: "0/0"
            contentRange.substringAfter("/").toIntOrNull() ?: 0
        }
}
