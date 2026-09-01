plugins {
    id("com.android.application") version "9.2.1" apply false
    // org.jetbrains.kotlin.android dihapus — AGP 9.0+ sudah bawa Kotlin built-in,
    // plugin ini tidak lagi dibutuhkan (malah error kalau tetap diterapkan).
    id("org.jetbrains.kotlin.plugin.serialization") version "2.4.0" apply false
}
