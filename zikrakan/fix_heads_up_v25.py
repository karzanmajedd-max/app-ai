from pathlib import Path

app = Path("Zikrakan/app")
src = app / "src/main/java/com/zikr/zikrakan"

# Fresh channel identifiers and standard Android heads-up rendering.
notifier = src / "Notifier.kt"
t = notifier.read_text(encoding="utf-8")
assert '"_v4"' in t
t = t.replace('"_v4"', '"_v5"')
start = t.index("    fun ensureChannels(ctx: Context) {")
end = t.index("    private fun dismissIntent(", start)
t = t[:start] + """    /**
     * Create only the 2 active sound/vibration channel variants.
     * Android persists channel importance and user changes; _v5 starts fresh.
     */
    fun ensureChannels(ctx: Context) {
        val nm = ctx.getSystemService(NotificationManager::class.java)
        val p = ZikrPrefs.load(ctx)
        val uri = Uri.parse("android.resource://" + ctx.packageName + "/" + R.raw.zikr_golden_chime)
        val attrs = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
        for (banner in listOf(true, false)) {
            val channel = NotificationChannel(
                channelId(p.sound, p.vibrate, banner),
                if (banner) "زیکرەکان — بانەری سەرشاشە" else "زیکرەکان — نۆتیفیکەیشنی ئاسایی",
                if (banner) NotificationManager.IMPORTANCE_HIGH else NotificationManager.IMPORTANCE_DEFAULT
            )
            channel.description = if (banner)
                "بانەری زیکرەکان؛ لە ڕێکخستنەکانی مۆبایل Floating notifications چالاک بکە"
                else "نۆتیفیکەیشنی ئاسایی زیکرەکان"
            channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            channel.enableVibration(p.vibrate)
            if (p.vibrate) channel.vibrationPattern = longArrayOf(0, 250, 150, 250)
            if (p.sound) channel.setSound(uri, attrs) else channel.setSound(null, null)
            nm.createNotificationChannel(channel)
        }
    }

""" + t[end:]
start = t.index("    private fun post(ctx: Context, channel: String, d: Dhikr) {")
end = t.index("\n    private fun cancel(", start)
t = t[:start] + """    private fun post(ctx: Context, channel: String, d: Dhikr, id: Int = NOTIF_ID) {
        if (!hasPermission(ctx)) return
        val b = Notification.Builder(ctx, channel)
            .setSmallIcon(R.drawable.ic_stat_zikr)
            .setContentTitle("زیکرەکان")
            .setContentText(d.a + " — " + d.k)
            .setCategory(Notification.CATEGORY_REMINDER)
            .setPriority(Notification.PRIORITY_HIGH)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setOnlyAlertOnce(false)
            .setContentIntent(dismissIntent(ctx))
            .setShowWhen(true)
            .setWhen(System.currentTimeMillis())

        if (channel.contains("_banner_")) {
            // Standard heads-up content is the most compatible with POCO/HyperOS.
            // The rich custom design remains available when expanded.
            b.setStyle(Notification.BigTextStyle().bigText(d.a + "\\n" + d.k))
            b.setCustomBigContentView(customView(ctx, R.layout.notification_zikr_expanded, d))
        } else {
            b.setCustomContentView(customView(ctx, R.layout.notification_zikr_compact, d))
            b.setCustomBigContentView(customView(ctx, R.layout.notification_zikr_expanded, d))
        }
        val nm = ctx.getSystemService(NotificationManager::class.java)
        nm.cancel(id)
        nm.notify(id, b.build())
    }
""" + t[end:]
samp = "post(ctx, channelId(p.sound, p.vibrate, p.banner), Dhikr(arabic, kurdish, reference))"
assert samp in t
t = t.replace(samp,
              "post(ctx, channelId(p.sound, p.vibrate, p.banner), Dhikr(arabic, kurdish, reference), " +
              "id = 2100 + (testSequence.getAndIncrement() % 4))")
assert "object Notifier {" in t
t = t.replace("object Notifier {", "object Notifier {\n    private val testSequence = java.util.concurrent.atomic.AtomicInteger(0)")
notifier.write_text(t, encoding="utf-8")

# Explain actual channel status, Android permission, and user-facing OEM settings.
main = src / "MainActivity.kt"
t = main.read_text(encoding="utf-8")
assert "import android.app.NotificationManager" in t
t = t.replace("import android.app.NotificationManager\n",
              "import android.app.NotificationManager\nimport org.json.JSONObject\n")
anchor = "        @JavascriptInterface\n        fun openSystemNotifications()"
assert anchor in t
bridge = """        @JavascriptInterface
        fun notificationDiagnostic(): String {
            val p = ZikrPrefs.load(applicationContext)
            val nm = getSystemService(NotificationManager::class.java)
            Notifier.ensureChannels(applicationContext)
            val channel = nm.getNotificationChannel(Notifier.channelId(p.sound, p.vibrate, p.banner))
            val dnd = try {
                nm.currentInterruptionFilter == NotificationManager.INTERRUPTION_FILTER_NONE
            } catch (_: Exception) { false }
            return JSONObject()
                .put("banner", p.banner)
                .put("permission", Notifier.hasPermission(applicationContext))
                .put("appEnabled", nm.areNotificationsEnabled())
                .put("channelImportance", channel?.importance ?: -1)
                .put("dnd", dnd)
                .put("sound", p.sound)
                .put("vibrate", p.vibrate)
                .put("device", android.os.Build.MANUFACTURER)
                .toString()
        }

"""
t = t.replace(anchor, bridge + anchor)
t = t.replace('Toast.makeText(this, "نۆتیفیکەیشنی تاقیکردنەوە نێردرا", Toast.LENGTH_SHORT).show()',
              'Toast.makeText(this, "نۆتیفیکەیشن نێردرا؛ بانەر لە مۆبایل دەبێت چالاک بێت", Toast.LENGTH_LONG).show()')
main.write_text(t,encoding="utf-8")

# Add a working troubleshooting panel, not a fake always-on banner toggle.
html=app/"src/main/assets/index.html"
h=html.read_text(encoding="utf-8")
anchor='<div class="systemActions"><button type="button" id="systemNotifications"'
assert anchor in h
h=h.replace(anchor, '''<div class="systemActions"><button type="button" id="diagnoseBanner" class="outlineBtn">🔎 پشکنینی هۆکاری نەهاتنی بانەر</button>''' + anchor[len('<div class="systemActions">'):])
anchor='<p class="note">ئەگەر بانەر نایەتە سەر شاشە'
assert anchor in h
h=h.replace(anchor, '<p id="bannerDiagnosticResult" class="note" hidden aria-live="polite" style="white-space:pre-line"></p>' + anchor)
anchor = "x('systemBanner').onclick=()=>{"
assert anchor in h
js = """x('diagnoseBanner').onclick=()=>{
  const out=x('bannerDiagnosticResult');
  out.hidden=false;
  if(!(window.Android&&Android.notificationDiagnostic)){
    out.textContent='ئەم پشکنینە لە وەشانی ئەندرۆید کار دەکات.';
    return;
  }
  try{
    const s=JSON.parse(Android.notificationDiagnostic());
    const issues=[];
    if(!s.banner) issues.push('• بانەر لە ناو ئەپ ناچالاکە.');
    if(!s.permission||!s.appEnabled) issues.push('• ڕێگەپێدانی نۆتیفیکەیشن لە ئەندرۆید چالاک نییە.');
    if(s.channelImportance<4) issues.push('• کەناڵی بانەر گرنگیی بەرزی نییە؛ ڕێکخستنەکانی بانەر بکەرەوە.');
    if(s.dnd) issues.push('• Do Not Disturb چالاکە و دەتوانێت بانەر ڕابگرێت.');
    if(!s.sound&&!s.vibrate) issues.push('• دەنگ و لەرزین هەردووکیان ناچالاکن؛ هەندێک مۆبایل بانەری بێدەنگ پیشان نادات.');
    if(!issues.length) issues.push('✓ مۆڵەتی ئەپ و کەناڵی گرنگیی بەرز دروستن.');
    issues.push('• لە POCO/HyperOS: Settings → Notifications & status bar → Floating notifications → زیکرەکان → ON.');
    issues.push('• سیستەمی ئەندرۆید بڕیاری کۆتایی بۆ پیشاندانی بانەر دەدات.');
    out.textContent=issues.join('\\n');
  }catch(e){out.textContent='نەتوانرا دۆخی نۆتیفیکەیشن بپشکنرێت.';}
};
"""
h=h.replace(anchor,js+anchor)
html.write_text(h,encoding="utf-8")

g=app/"build.gradle.kts"
s=g.read_text()
assert "versionCode = 8" in s and 'versionName = "2.4"' in s
g.write_text(s.replace("versionCode = 8", "versionCode = 9")
             .replace('versionName = "2.4"','versionName = "2.5"'))
print("v2.5 native heads-up compatibility + diagnostics patch applied.")
