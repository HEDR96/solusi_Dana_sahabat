import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

val localProps = Properties().also { props ->
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { props.load(it) }
}

android {
    namespace = "com.solusidana.sahabat"
    compileSdk = 34

    defaultConfig {
        applicationId = "solusidanasahabat.myapp"
        minSdk = 26
        targetSdk = 35
        versionCode = 8
        versionName = "1.7"

        buildConfigField("String", "SUPABASE_URL", "\"https://jltdidqhdqdsyiakdaqy.supabase.co\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGRpZHFoZHFkc3lpYWtkYXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDQ4MzcsImV4cCI6MjA5MzIyMDgzN30.IxAEaotwiKoNpIBlXtq9t9x_n0hOPujlddstAA2TPGo\"")
    }

    signingConfigs {
        create("release") {
            storeFile = file("../solusidana-release.jks")
            storePassword = localProps.getProperty("KEYSTORE_STORE_PASSWORD") ?: ""
            keyAlias = "solusidana"
            keyPassword = localProps.getProperty("KEYSTORE_KEY_PASSWORD") ?: ""
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    // AndroidX Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")

    // Navigation
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.7")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.7")

    // ViewModel + LiveData
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // WorkManager (notifikasi background)
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // HTTP Client
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // JSON
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // RecyclerView
    implementation("androidx.recyclerview:recyclerview:1.3.2")

    // Encrypted SharedPreferences (JWT storage)
    implementation("androidx.security:security-crypto:1.0.0")

    // Lokasi (check-in survey)
    implementation("com.google.android.gms:play-services-location:21.2.0")
}
