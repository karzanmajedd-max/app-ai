from pathlib import Path

root = Path("Zikrakan")
app = root / "app"
jsfile = app / "src/main/assets/index.html"
t = jsfile.read_text(encoding="utf-8")
old = "function notifyPreview(){if(window.Android){try{Android.showTest()}catch(e){}return}if(prefs.sound)playZikrSound();const d=nextNotif();$('notAr').textContent=d.a;$('notKu').textContent=d.k;$('mockNotif').classList.add('visible')}"
new = """function notifyPreview(){
  const d=nextNotif();
  $('notAr').textContent=d.a;
  $('notKu').textContent=d.k;
  $('mockNotif').classList.add('visible');
  const status=$('testStatus');
  if(status){status.textContent='نموونەی زیکرەکە لە سەر شاشە پیشان درا. ئەگەر نۆتیفیکەیشنی سیستەم نەهات، ڕێگەپێدانی نۆتیفیکەیشن لە ڕێکخستنەکانی ئەندرۆید بپشکنە.';status.hidden=false;}
  if(window.Android && typeof Android.showTest==='function'){
    try{Android.showTest(d.a,d.k,d.r||'')}catch(e){
      if(status){status.textContent='نموونەکە لە ناو ئەپ پیشان درا، بەڵام ناردنی نۆتیفیکەیشنی سیستەم سەرکەوتوو نەبوو.';}
    }
  } else if(prefs.sound){playZikrSound();}
}"""
assert t.count(old) == 1
t = t.replace(old, new)
button = '<button class="goldBtn" id="test">پیشاندانی نموونەی نۆتیکەیشن</button>'
status = '<p id="testStatus" class="note" hidden aria-live="polite"></p>'
assert t.count(button) == 1
t = t.replace(button, button + status)
button2 = '<button id="test" class="goldBtn">پیشاندانی نموونەی نۆتیکەیشن</button>'
assert t.count(button2) == 1
t = t.replace(button2, button2 + status)
t = t.replace('.hidden{display:none!important}', '.hidden,[hidden]{display:none!important}')
jsfile.write_text(t, encoding="utf-8")

ktpath = app / "src/main/java/com/zikr/zikrakan/MainActivity.kt"
t = ktpath.read_text(encoding="utf-8")
t = t.replace("import android.content.Intent\n", "import android.content.Intent\nimport android.app.NotificationManager\n")
start = t.index("        @JavascriptInterface\n        fun showTest() {")
end = t.index("\n    }\n}", start)
t = t[:start] + """        @JavascriptInterface
        fun showTest(arabic: String, kurdish: String, reference: String) {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= 33 &&
                    checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                ) {
                    pendingPreview = Triple(arabic, kurdish, reference)
                    Toast.makeText(this@MainActivity, "ڕێگە بە نۆتیفیکەیشنەکان بدە", Toast.LENGTH_LONG).show()
                    requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 16)
                    return@runOnUiThread
                }
                postPreview(arabic, kurdish, reference)
            }
        }""" + t[end:]
start2 = t.index("    /** پردی JavaScript")
helper = """    private var pendingPreview: Triple<String, String, String>? = null

    private fun postPreview(arabic: String, kurdish: String, reference: String) {
        val nm = getSystemService(NotificationManager::class.java)
        if (!nm.areNotificationsEnabled()) {
            Toast.makeText(this, "نۆتیفیکەیشن ناچالاکە؛ لە ڕێکخستن چالاکی بکە", Toast.LENGTH_LONG).show()
            openNotificationSettings()
            return
        }
        try {
            Notifier.showSample(this, ZikrPrefs.load(this), arabic, kurdish, reference)
            Toast.makeText(this, "نۆتیفیکەیشنی تاقیکردنەوە نێردرا", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "ناردنی نۆتیفیکەیشن سەرکەوتوو نەبوو", Toast.LENGTH_LONG).show()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 16) {
            val p = pendingPreview
            pendingPreview = null
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED && p != null) {
                postPreview(p.first, p.second, p.third)
            } else {
                Toast.makeText(this, "نموونەکە لە ناو ئەپ دەرکەوت؛ نۆتیفیکەیشن ڕێگەپێدراو نییە", Toast.LENGTH_LONG).show()
            }
        }
    }

"""
t = t[:start2] + helper + t[start2:]
ktpath.write_text(t, encoding="utf-8")

np = app / "src/main/java/com/zikr/zikrakan/Notifier.kt"
t = np.read_text(encoding="utf-8")
needle = "    fun show(ctx: Context, p: ZikrPrefs) {"
assert t.count(needle) == 1
append = """    /** Post exactly the same dhikr shown by the in-app preview. */
    fun showSample(ctx: Context, p: ZikrPrefs, arabic: String, kurdish: String, reference: String) {
        if (!hasPermission(ctx)) return
        ensureChannels(ctx)
        post(ctx, channelId(p.sound, p.vibrate), Dhikr(arabic, kurdish, reference))
    }

"""
t = t.replace(needle, append + needle)
np.write_text(t, encoding="utf-8")

g = app / "build.gradle.kts"
t = g.read_text()
assert 'versionCode = 6' in t and 'versionName = "2.2"' in t
t = t.replace("versionCode = 6", "versionCode = 7").replace('versionName = "2.2"', 'versionName = "2.3"')
g.write_text(t)
print("Zikrakan v2.3 preview fix applied")
