from pathlib import Path
a=Path("Zikrakan/app")
j=a/"src/main/java/com/zikr/zikrakan"
p=j/"ZikrPrefs.kt"
s=p.read_text()
assert "val enabled: Boolean = true," in s
s=s.replace("val enabled: Boolean = true,","val enabled: Boolean = true,\n    val banner: Boolean = true,")
s=s.replace('enabled = o.optBoolean("enabled", d.enabled),','enabled = o.optBoolean("enabled", d.enabled),\n                banner = o.optBoolean("banner", d.banner),')
p.write_text(s)

p=j/"Notifier.kt"
s=p.read_text()
start=s.index("    fun channelId(sound: Boolean, vibrate: Boolean): String")
end=s.index("    private fun dismissIntent(",start)
s=s[:start]+"""    // New channel IDs are required: Android does not let an app increase an old channel's importance.
    fun channelId(sound: Boolean, vibrate: Boolean, banner: Boolean): String =
        "zikr_" + (if (banner) "banner" else "normal") + "_" +
            (if (sound) "s" else "q") + (if (vibrate) "v" else "n") + "_v4"

    fun ensureChannels(ctx: Context) {
        val nm = ctx.getSystemService(NotificationManager::class.java)
        val soundUri = Uri.parse("android.resource://" + ctx.packageName + "/" + R.raw.zikr_golden_chime)
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
        for (banner in listOf(true, false)) for (sound in listOf(true, false)) for (vib in listOf(true, false)) {
            val name = "زیکرەکان — " + (if (banner) "بانەری سەرشاشە" else "نۆتیفیکەیشنی ئاسایی") +
                " / " + (if (sound) "دەنگ" else "بێ دەنگ") + " / " + (if (vib) "لەرزین" else "بێ لەرزین")
            val importance = if (banner) NotificationManager.IMPORTANCE_HIGH else NotificationManager.IMPORTANCE_DEFAULT
            val ch = NotificationChannel(channelId(sound,vib,banner),name,importance)
            ch.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            ch.enableVibration(vib)
            if(vib) ch.vibrationPattern=longArrayOf(0,250,150,250)
            if(sound) ch.setSound(soundUri,attrs) else ch.setSound(null,null)
            nm.createNotificationChannel(ch)
        }
    }

"""+s[end:]
assert "channelId(p.sound, p.vibrate)" in s
s=s.replace("channelId(p.sound, p.vibrate)","channelId(p.sound, p.vibrate, p.banner)")
s=s.replace("            .setAutoCancel(true)","            .setAutoCancel(true)\n            .setPriority(Notification.PRIORITY_HIGH)\n            .setOnlyAlertOnce(false)")
old="        ctx.getSystemService(NotificationManager::class.java).notify(NOTIF_ID, n)"
assert old in s
s=s.replace(old,"        val nm = ctx.getSystemService(NotificationManager::class.java)\n        nm.cancel(NOTIF_ID)\n        nm.notify(NOTIF_ID, n)")
assert "fun showSample" in s and "Overlay.show(" not in s
p.write_text(s)

p=j/"MainActivity.kt"
s=p.read_text()
needle="    /** پردی JavaScript"
assert needle in s
s=s.replace(needle,"""    private fun openBannerChannelSettings() {
        Notifier.ensureChannels(this)
        val pref = ZikrPrefs.load(this)
        val channel = Notifier.channelId(pref.sound,pref.vibrate,true)
        try {
            startActivity(Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE,packageName)
                .putExtra(Settings.EXTRA_CHANNEL_ID,channel))
        } catch (_: Exception) { openNotificationSettings() }
    }

"""+needle)
needle="    inner class Bridge {\n"
assert needle in s
s=s.replace(needle,needle+"""        @JavascriptInterface
        fun openSystemNotifications() {
            runOnUiThread { openNotificationSettings() }
        }

        @JavascriptInterface
        fun openSystemBanner() {
            runOnUiThread { openBannerChannelSettings() }
        }

        @JavascriptInterface
        fun requestNotificationPermission() {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= 33 &&
                    checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 18)
                } else {
                    val nm = getSystemService(android.app.NotificationManager::class.java)
                    if (!nm.areNotificationsEnabled()) openNotificationSettings()
                }
            }
        }

""")
p.write_text(s)

p=a/"src/main/assets/index.html"
s=p.read_text(encoding="utf-8")
assert "const DEFAULT = { enabled:true" in s
s=s.replace("const DEFAULT = { enabled:true","const DEFAULT = { enabled:true,banner:true")
old='<strong>نۆتیکەیشنەکان</strong><small>چالاککردن / ناچالاککردن</small>'
assert old in s
s=s.replace(old,'<strong>چالاککردنی نۆتیفیکەیشن</strong><small>ناردنی زیکرەکان لە کاتە دیاریکراوەکاندا</small>')
old='<input type="checkbox" class="toggle" id="enabled" ${prefs.enabled?\'checked\':\'\'}></div><div class="row"><div><strong>دەنگ</strong>'
# The template uses </div> immediately after the checkbox, not a closing input.
if old not in s:
    old='<input type="checkbox" class="toggle" id="enabled" ${prefs.enabled?\'checked\':\'\'}></div><div class="row"><div><strong>دەنگ</strong>'
assert old in s, "Cannot locate notification toggle section"
new='''<input type="checkbox" class="toggle" id="enabled" ${prefs.enabled?'checked':''}></div><div class="row"><div><strong>چالاککردنی بانەر</strong><small>بانەری سەرشاشە لە کاتی بەکارهێنانی ئەپەکانی دیکە</small></div><input type="checkbox" class="toggle" id="banner" ${prefs.banner?'checked':''}></div><div class="systemActions"><button type="button" id="systemNotifications" class="outlineBtn">⚙ ڕێکخستنی نۆتیفیکەیشن لە مۆبایل</button><button type="button" id="systemBanner" class="outlineBtn">⚙ ڕێکخستنی بانەری سەرشاشە</button></div><p class="note">ئەگەر بانەر نایەتە سەر شاشە، لە ڕێکخستنەکانی مۆبایل Floating notifications / Pop-up notifications چالاک بکە. دۆخی بێدەنگ یان Do Not Disturb دەکرێت بانەر ڕابگرێت.</p><div class="row"><div><strong>دەنگ</strong>'''
s=s.replace(old,new)
oldloop="for(const k of ['enabled','sound','vibrate'])x(k).onchange=e=>{prefs[k]=e.target.checked;store()};"
assert oldloop in s
newloop="""for(const k of ['enabled','banner','sound','vibrate'])x(k).onchange=e=>{
  prefs[k]=e.target.checked;store();
  if(k==='enabled'&&prefs.enabled&&window.Android&&Android.requestNotificationPermission){
    try{Android.requestNotificationPermission()}catch(_){}
  }
};
x('systemNotifications').onclick=()=>{
  if(window.Android&&Android.openSystemNotifications){try{Android.openSystemNotifications()}catch(_){}}
  else alert('ڕێکخستنی نۆتیفیکەیشنەکانی مۆبایل بکەرەوە.');
};
x('systemBanner').onclick=()=>{
  if(window.Android&&Android.openSystemBanner){try{Android.openSystemBanner()}catch(_){}}
  else alert('لە ڕێکخستنەکانی مۆبایل بانەری سەرشاشە چالاک بکە.');
};"""
s=s.replace(oldloop,newloop)
s=s.replace(".hidden,[hidden]{display:none!important}",".systemActions{display:grid;gap:9px;padding:10px 0 2px}.systemActions .outlineBtn{width:100%;font-family:inherit;text-align:center;font-size:13px;padding:12px}.hidden,[hidden]{display:none!important}")
s=s.replace("لەرزینەوە: ${prefs.vibrate?'چالاک':'ناچالاک'}","لەرزینەوە: ${prefs.vibrate?'چالاک':'ناچالاک'} &nbsp; • &nbsp; بانەر: ${prefs.banner?'چالاک':'ناچالاک'}")
p.write_text(s,encoding="utf-8")
p=a/"build.gradle.kts"
s=p.read_text()
assert 'versionCode = 7' in s and 'versionName = "2.3"' in s
p.write_text(s.replace("versionCode = 7","versionCode = 8").replace('versionName = "2.3"','versionName = "2.4"'))
print("v2.4 banner and notification controls patched")
