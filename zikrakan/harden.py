from pathlib import Path

# Reduce sensitive permissions and preserve the original app's dhikr, UI and scheduler.
p = Path("Zikrakan")
app = p / "app"
manifest = app / "src/main/AndroidManifest.xml"
t = manifest.read_text()
for permission in [
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
]:
    line = f'    <uses-permission android:name="{permission}" />\n'
    if line not in t:
        raise RuntimeError(f"Missing permission line: {permission}")
    t = t.replace(line, "")
manifest.write_text(t)

gradle = app / "build.gradle.kts"
t = gradle.read_text()
t = t.replace("versionCode = 3", "versionCode = 6")
t = t.replace('versionName = "2.1"', 'versionName = "2.2"')
gradle.write_text(t)

j = app / "src/main/java/com/zikr/zikrakan"
main = j / "MainActivity.kt"
t = main.read_text()
for line in [
    "import android.app.AlertDialog\n",
    "import android.os.PowerManager\n",
]:
    t = t.replace(line, "")
start = t.index("        if (!Settings.canDrawOverlays(this)")
end = t.index("        if (Build.VERSION.SDK_INT >= 31", start)
t = t[:start] + t[end:]
start = t.index("        val pm = getSystemService(PowerManager::class.java)")
end = t.index("\n    }\n\n    private fun openNotificationSettings", start)
t = t[:start] + t[end:]
t = t.replace(
    "!Notifier.hasPermission(applicationContext) && !Notifier.hasOverlay(applicationContext)",
    "!Notifier.hasPermission(applicationContext)",
)
assert "canDrawOverlays" not in t
main.write_text(t)

notifier = j / "Notifier.kt"
t = notifier.read_text()
for line in [
    "import android.media.AudioManager\n",
    "import android.media.MediaPlayer\n",
    "import android.os.VibrationEffect\n",
    "import android.os.Vibrator\n",
    "import android.provider.Settings\n",
]:
    t = t.replace(line, "")
start = t.index("    fun hasOverlay(ctx: Context): Boolean")
end = t.index("    private fun loadDhikr", start)
t = t[:start] + t[end:]
start = t.index("    /** دەنگ و لەرزین بۆ کاتی Overlay")
end = t.index("    fun show(ctx: Context, p: ZikrPrefs)", start)
t = t[:start] + t[end:]
start = t.index("        if (hasOverlay(app)) {")
t = t[:start] + "        post(app, channelId(p.sound, p.vibrate), d)\n    }\n}\n"
assert "Overlay.show" not in t
notifier.write_text(t)

(j / "Overlay.kt").unlink(missing_ok=True)

html = app / "src/main/assets/index.html"
t = html.read_text()
t = t.replace(
    "زیکرەکان وەک کارتێک لەسەر هەموو ئەپەکان دەردەکەون، تەنانەت کاتێک ئەپەکە داخراوە. ئەگەر ڕێگەپێدانی «پیشاندان لەسەر ئەپەکانی دیکە» نەدرابێت، وەک نۆتیکەیشنی ئاسایی دێت.",
    "زیکرەکان بە نۆتیکەیشنی ستانداردی ئەندرۆید دەردەکەون. شێوازی دەرکەوتنی سەرشاشە و شاشەی قوفڵ بە ڕێکخستنەکانی مۆبایلەکەتەوە بەندە.",
)
html.write_text(t)

for forbidden in [
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
]:
    assert forbidden not in manifest.read_text()

print("Safe Zikrakan v2.2 source patch applied.")
