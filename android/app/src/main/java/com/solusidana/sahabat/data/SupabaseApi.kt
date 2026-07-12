package com.solusidana.sahabat.data

import com.solusidana.sahabat.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object SupabaseApi {

    private val BASE_URL = BuildConfig.SUPABASE_URL
    private val ANON_KEY = BuildConfig.SUPABASE_ANON_KEY

    /** Semua panggilan jaringan (OkHttp execute) wajib berjalan di IO dispatcher. */
    private suspend fun <T> io(block: () -> T): Result<T> =
        withContext(Dispatchers.IO) { runCatching(block) }

    // isLenient: kolom DB bertipe angka (int/bigint) tetap bisa masuk ke field String
    // tanpa crash "Expected quotation mark" — pengaman untuk mismatch tipe yang belum ketahuan.
    val json = Json { ignoreUnknownKeys = true; coerceInputValues = true; isLenient = true }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC
                    else HttpLoggingInterceptor.Level.NONE
        })
        .build()

    private val JSON_TYPE = "application/json; charset=utf-8".toMediaType()

    /** Ekstrak pesan error Supabase/PostgREST dari body JSON, atau fallback ke kode HTTP. */
    private fun supabaseError(code: Int, body: String): String {
        return try {
            val obj = json.parseToJsonElement(body).jsonObject
            val msg = obj["message"]?.toString()?.trim('"')
                ?: obj["error_description"]?.toString()?.trim('"')
                ?: obj["error"]?.toString()?.trim('"')
            if (!msg.isNullOrBlank()) "HTTP $code: $msg" else "HTTP $code"
        } catch (_: Exception) {
            "HTTP $code"
        }
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> =
        io {
            val body = JSONObject().apply {
                put("email", email)
                put("password", password)
            }.toString().toRequestBody(JSON_TYPE)
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
                .url("$BASE_URL/rest/v1/dsd_profiles?id=eq.$userId&select=*")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            if (!resp.isSuccessful) error(supabaseError(resp.code, text))
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
            .url("$BASE_URL/rest/v1/dsd_applications?$filters")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        if (!resp.isSuccessful) error(supabaseError(resp.code, text))
        json.decodeFromString<List<Application>>(text)
    }

    suspend fun getApplicationById(token: String, id: String): Result<Application> =
        io {
            val req = Request.Builder()
                .url("$BASE_URL/rest/v1/dsd_applications?id=eq.$id&select=*")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            if (!resp.isSuccessful) error(supabaseError(resp.code, text))
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
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        val approveDate = if (newStatus == "approve") today else null
        val patchJson = JSONObject().apply {
            put("status", newStatus)
            if (!notes.isNullOrBlank()) put("notes", notes)
            if (!surveyDate.isNullOrBlank()) put("survey_date", surveyDate)
            if (!surveyTime.isNullOrBlank()) put("survey_time", surveyTime)
            if (approveDate != null) put("approve_date", approveDate)
        }
        val patchBody = patchJson.toString().toRequestBody(JSON_TYPE)

        val patchReq = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_applications?id=eq.$id")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .patch(patchBody)
            .build()
        val patchResp = client.newCall(patchReq).execute()
        if (!patchResp.isSuccessful) {
            val errBody = patchResp.body?.string() ?: ""
            error(supabaseError(patchResp.code, errBody))
        }

        // Insert status log
        val logJson = JSONObject().apply {
            put("app_id", id)
            put("to_status", newStatus)
            put("user", userName)
            put("date", today)
            if (!notes.isNullOrBlank()) put("notes", notes)
        }
        val logBody = "[${logJson}]".toRequestBody(JSON_TYPE)
        val logReq = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_status_logs")
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
                .url("$BASE_URL/rest/v1/dsd_status_logs?app_id=eq.$appId&select=*&order=id")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            if (!resp.isSuccessful) error(supabaseError(resp.code, text))
            json.decodeFromString<List<StatusLog>>(text)
        }

    suspend fun getAgents(token: String): Result<List<Agent>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_agents?select=*&order=name")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        if (!resp.isSuccessful) error(supabaseError(resp.code, text))
        json.decodeFromString<List<Agent>>(text)
    }

    suspend fun getLeasingPartners(token: String): Result<List<LeasingPartner>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_leasing_partners?select=id,name,rate,status,min_pinjaman,max_pinjaman&order=name")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        if (!resp.isSuccessful) error(supabaseError(resp.code, text))
        json.decodeFromString<List<LeasingPartner>>(text)
    }

    suspend fun getActivities(token: String, agentId: String? = null): Result<List<AgentActivity>> = io {
        val filters = buildString {
            append("select=*&order=date.desc,id.desc&limit=100")
            if (agentId != null) append("&agent_id=eq.$agentId")
        }
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_agent_activities?$filters")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        if (!resp.isSuccessful) error(supabaseError(resp.code, text))
        json.decodeFromString<List<AgentActivity>>(text)
    }

    suspend fun getAgentById(token: String, agentId: String): Result<Agent> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_agents?id=eq.$agentId&select=*")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        if (!resp.isSuccessful) error(supabaseError(resp.code, text))
        json.decodeFromString<List<Agent>>(text).firstOrNull() ?: error("Agen tidak ditemukan")
    }

    /** Update nama tampilan user (tabel profiles). */
    suspend fun updateProfileName(token: String, userId: String, name: String): Result<Unit> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"")
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_profiles?id=eq.$userId")
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
            .url("$BASE_URL/rest/v1/dsd_agents?id=eq.$agentId")
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

    /** Tambah agen baru (owner/admin/spv-agen). spvId diisi otomatis jika penambah adalah spv.
     *  Retry sekali jika terjadi tabrakan ID (race condition concurrent insert). */
    suspend fun insertAgent(
        token: String,
        name: String, phone: String, email: String, city: String,
        address: String, nik: String, bank: String, accountNumber: String,
        accountName: String, target: Int, spvId: String?
    ): Result<String> = io {
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())

        fun countAgents(): Int {
            val resp = client.newCall(
                Request.Builder()
                    .url("$BASE_URL/rest/v1/dsd_agents?select=id")
                    .addHeader("apikey", ANON_KEY)
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Prefer", "count=exact")
                    .addHeader("Range", "0-0")
                    .get().build()
            ).execute()
            return (resp.header("Content-Range") ?: "0/0").substringAfter("/").toIntOrNull() ?: 0
        }

        fun buildBody(id: String) = JSONObject().apply {
            put("id", id); put("name", name); put("phone", phone); put("email", email)
            put("city", city); put("address", address); put("nik", nik); put("status", "aktif")
            put("join_date", today); put("bank", bank)
            put("account_number", accountNumber); put("account_name", accountName)
            put("target", target); put("total_approve", 0); put("total_reject", 0); put("total_berkas", 0)
            if (spvId != null) put("spv_id", spvId) else put("spv_id", JSONObject.NULL)
        }.toString().toRequestBody(JSON_TYPE)

        fun tryInsert(id: String): okhttp3.Response = client.newCall(
            Request.Builder()
                .url("$BASE_URL/rest/v1/dsd_agents")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Prefer", "return=minimal")
                .post(buildBody(id)).build()
        ).execute()

        // First attempt
        val firstId = "AGT" + (countAgents() + 1).toString().padStart(3, '0')
        val firstResp = tryInsert(firstId)
        if (firstResp.isSuccessful) return@io firstId

        // Retry once on conflict (409) — re-count for a fresh ID
        if (firstResp.code == 409) {
            val retryId = "AGT" + (countAgents() + 1).toString().padStart(3, '0')
            val retryResp = tryInsert(retryId)
            if (retryResp.isSuccessful) return@io retryId
            error("Gagal tambah agen setelah retry: ${retryResp.code} ${retryResp.body?.string()?.take(200)}")
        }

        error("Gagal tambah agen: ${firstResp.code} ${firstResp.body?.string()?.take(200)}")
    }

    suspend fun getMasterOptions(token: String): Result<List<MasterOption>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_master_options?select=id,category,value,label,sort,active&order=category,sort")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        if (!resp.isSuccessful) error(supabaseError(resp.code, text))
        json.decodeFromString<List<MasterOption>>(text)
    }

    suspend fun insertMasterOption(token: String, category: String, value: String, sort: Int): Result<Unit> = io {
        fun esc(s: String) = s.replace("\\", "\\\\").replace("\"", "\\\"")
        val body = """{"category":"${esc(category)}","value":"${esc(value)}","sort":$sort,"active":true}"""
            .toRequestBody(JSON_TYPE)
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_master_options")
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
            .url("$BASE_URL/rest/v1/dsd_master_options?id=eq.$id")
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
            .url("$BASE_URL/rest/v1/dsd_master_options?id=eq.$id")
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
            .url("$BASE_URL/rest/v1/rpc/dsd_next_brk_id")
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
            .url("$BASE_URL/rest/v1/dsd_applications?select=id")
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
        leasingId: Long,
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
            "unit_type":"${esc(unitType)}","unit_brand":"${esc(unitBrand)}","unit_year":${unitYear.trim().toIntOrNull() ?: "null"},
            "pinjaman":$pinjaman,"tenor":$tenor,"estimasi_angsuran":$estimasiAngsuran,
            "leasing_id":$leasingId,"leasing_name":"${esc(leasingName)}",
            "input_date":"$today","notes":"${esc(notes)}"
        }""".trimIndent().toRequestBody(JSON_TYPE)

        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_applications")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(body)
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) error("Gagal simpan berkas: ${resp.code} ${resp.body?.string()?.take(200)}")

        // Log status awal agar riwayat berkas terisi sejak dibuat
        val firstLogBody = """[{"app_id":"${esc(id)}","to_status":"pending","user":"${esc(agentName)}","date":"$today","notes":"Berkas dibuat via aplikasi"}]"""
            .toRequestBody(JSON_TYPE)
        val firstLogReq = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_status_logs")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(firstLogBody)
            .build()
        client.newCall(firstLogReq).execute()

        // Notifikasi untuk web ERP
        val notifBody = """{"type":"berkas-baru","message":"Berkas baru dari ${esc(agentName)} - ${esc(customerName)}","time_ago":"Baru saja","read":false,"link":"/applications"}"""
            .toRequestBody(JSON_TYPE)
        val notifReq = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_notifications")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal")
            .post(notifBody)
            .build()
        client.newCall(notifReq).execute()
    }

    suspend fun getAgentLocations(token: String): Result<List<com.solusidana.sahabat.ui.map.AgentLocation>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_agent_locations?select=*&order=updated_at.desc")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        if (!resp.isSuccessful) error(supabaseError(resp.code, text))
        json.decodeFromString<List<com.solusidana.sahabat.ui.map.AgentLocation>>(text)
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
            .url("$BASE_URL/rest/v1/dsd_agent_activities")
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
                .url("$BASE_URL/rest/v1/dsd_commissions?$filters")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            if (!resp.isSuccessful) error(supabaseError(resp.code, text))
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
                .url("$BASE_URL/rest/v1/dsd_applications?$filters")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val text = resp.body?.string() ?: "[]"
            if (!resp.isSuccessful) error(supabaseError(resp.code, text))
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
            .url("$BASE_URL/rest/v1/dsd_agent_locations?on_conflict=user_id")
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

    suspend fun getOtrCatalog(token: String): Result<List<OtrCatalogRow>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_otr_catalog?leasing_key=eq.CMD&select=id,brand,tipe,ltv,ltv_rule,kategori,unit_type,otr_2026,otr_2025,otr_2024,otr_2023,otr_2022,otr_2021,otr_2020,otr_2019,otr_2018,otr_2017,otr_2016,otr_2015&order=brand&order=tipe")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get().build()
        val resp2 = client.newCall(req).execute()
        val text2 = resp2.body?.string() ?: "[]"
        if (!resp2.isSuccessful) error(supabaseError(resp2.code, text2))
        json.decodeFromString<List<OtrCatalogRow>>(text2)
    }

    /**
     * Ambil tabel rate untuk leasing tertentu.
     * leasingKey = "CMD" untuk CMD Finance, String(leasing.id) untuk leasing lain.
     */
    suspend fun getRateTables(token: String, leasingKey: String): Result<List<RateTable>> = io {
        val req = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_rate_tables?leasing_key=eq.$leasingKey&select=product,tipe,data")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        val resp = client.newCall(req).execute()
        val text = resp.body?.string() ?: "[]"
        if (!resp.isSuccessful) error(supabaseError(resp.code, text))
        json.decodeFromString<List<RateTable>>(text)
    }

    suspend fun getPendingApplicationsCount(token: String, agentId: String? = null): Result<Int> =
        io {
            val filter = buildString {
                append("status=not.in.(approve,reject,cancel)")
                if (agentId != null) append("&agent_id=eq.$agentId")
            }
            val req = Request.Builder()
                .url("$BASE_URL/rest/v1/dsd_applications?$filter&select=id")
                .addHeader("apikey", ANON_KEY)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Prefer", "count=exact")
                .get()
                .build()
            val resp = client.newCall(req).execute()
            val contentRange = resp.header("Content-Range") ?: "0/0"
            contentRange.substringAfter("/").toIntOrNull() ?: 0
        }

    /**
     * Ambil push messages untuk user ini sejak lastId yang sudah diproses.
     * Mengambil broadcast (target_user_id IS NULL) ATAU targeted ke userId ini.
     */
    suspend fun getPushMessages(token: String, userId: String, afterId: Long = 0L): Result<List<PushMessage>> {
        val idPart = if (afterId > 0L) "&id=gt.$afterId" else ""

        fun buildReq(extraFilter: String) = Request.Builder()
            .url("$BASE_URL/rest/v1/dsd_push_messages?$extraFilter$idPart&order=id.desc&limit=100")
            .addHeader("apikey", ANON_KEY)
            .addHeader("Authorization", "Bearer $token")
            .get().build()

        val broadcast = io {
            val resp = client.newCall(buildReq("target_user_id=is.null")).execute()
            val text = resp.body?.string() ?: "[]"
            if (!resp.isSuccessful) error(supabaseError(resp.code, text))
            json.decodeFromString<List<PushMessage>>(text)
        }.getOrElse { emptyList() }

        val targeted = io {
            val resp = client.newCall(buildReq("target_user_id=eq.$userId")).execute()
            val text = resp.body?.string() ?: "[]"
            if (!resp.isSuccessful) error(supabaseError(resp.code, text))
            json.decodeFromString<List<PushMessage>>(text)
        }.getOrElse { emptyList() }

        val merged = (broadcast + targeted).distinctBy { it.id }.sortedByDescending { it.id }
        return Result.success(merged)
    }
}
