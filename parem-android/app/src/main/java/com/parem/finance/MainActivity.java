package com.parem.finance;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.webkit.JavascriptInterface;
import android.view.WindowManager;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.OutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
  private WebView web;
  private boolean pageReady = false;
  private boolean pendingExpense = false;
  private static final int REQUEST_NOTIFICATIONS = 119;
  private String pendingJson = "";
  private static final int CREATE_BACKUP = 37;
  private static final int OPEN_BACKUP = 38;
  private static final String SITE = "https://parem-karzan-2026.loftytrail13.chatgpt.site";
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    pendingExpense = getIntent() != null && getIntent().getBooleanExtra("open_expense", false);
    getWindow().setStatusBarColor(Color.rgb(10,18,35));
    getWindow().setNavigationBarColor(Color.rgb(10,18,35));
    getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
    web = new WebView(this);
    web.setBackgroundColor(Color.rgb(10,18,35));
    web.getSettings().setJavaScriptEnabled(true);
    web.getSettings().setDomStorageEnabled(true);
    web.getSettings().setAllowFileAccess(true);
    web.getSettings().setAllowFileAccessFromFileURLs(false);
    web.getSettings().setAllowUniversalAccessFromFileURLs(false);
    web.getSettings().setAllowContentAccess(false);
    web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    web.getSettings().setDefaultTextEncodingName("UTF-8");
    web.getSettings().setBuiltInZoomControls(false);
    web.getSettings().setDisplayZoomControls(false);
    web.setWebViewClient(new WebViewClient() {
      private boolean allowOrOpenExternally(String url) {
        if (url.startsWith("file:///android_asset/")) return false;
        if (url.startsWith("https://") || url.startsWith("http://")) {
          try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
          } catch (Exception ignored) {}
        }
        return true;
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        return allowOrOpenExternally(request.getUrl().toString());
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return allowOrOpenExternally(url);
      }
      @Override public void onPageFinished(WebView view, String url) {
        pageReady = true;
        if (pendingExpense) openExpenseFromNotification();
      }
    });
    web.setWebChromeClient(new WebChromeClient());
    web.addJavascriptInterface(new AppBridge(), "ParemAndroid");
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
    ReminderScheduler.makeChannel(this);
    ReminderScheduler.scheduleAll(this);
    askNotificationPermissionIfNeeded();
  }
  private void askNotificationPermissionIfNeeded() {
    if (Build.VERSION.SDK_INT >= 33 &&
        checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
      requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_NOTIFICATIONS);
    }
  }
  private void updateReminderUi() {
    if (pageReady && web != null) {
      web.evaluateJavascript("window.paremRefreshReminderSettings && window.paremRefreshReminderSettings()", null);
    }
  }
  private void openExpenseFromNotification() {
    if (pageReady && web != null) {
      pendingExpense = false;
      web.evaluateJavascript("window.paremOpenExpense && window.paremOpenExpense()", null);
    } else {
      pendingExpense = true;
    }
  }
  @Override protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    if (intent != null && intent.getBooleanExtra("open_expense", false)) {
      openExpenseFromNotification();
    }
  }
  @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (requestCode == REQUEST_NOTIFICATIONS) {
      if (ReminderScheduler.notificationPermission(this)) {
        ReminderScheduler.scheduleAll(this);
        Toast.makeText(this, "ئاگادارکردنەوەکان چالاک بوون", Toast.LENGTH_SHORT).show();
      } else {
        Toast.makeText(this, "ڕێگەدان بە نۆتیکیشن پێویستە", Toast.LENGTH_LONG).show();
      }
      updateReminderUi();
    }
  }
  @Override protected void onResume() {
    super.onResume();
    updateReminderUi();
  }
  public class AppBridge {
    @JavascriptInterface public String getReminderSettings() {
      return ReminderScheduler.settingsJson(MainActivity.this);
    }
    @JavascriptInterface public void setReminderSettings(boolean enabled, String first, String second, String third) {
      runOnUiThread(() -> {
        boolean accepted = ReminderScheduler.save(MainActivity.this, enabled, first, second, third);
        if (!accepted) {
          Toast.makeText(MainActivity.this, "سێ کاتی جیاواز و دروست هەڵبژێرە", Toast.LENGTH_LONG).show();
          updateReminderUi();
          return;
        }
        Toast.makeText(MainActivity.this, enabled ? "سێ بیرخستنەوەی ڕۆژانە پاشەکەوت کران" : "نۆتیکیشنەکان ناچالاک کران",
          Toast.LENGTH_SHORT).show();
        if (enabled && !ReminderScheduler.notificationPermission(MainActivity.this)) {
          askNotificationPermissionIfNeeded();
        }
        updateReminderUi();
      });
    }
    @JavascriptInterface public void requestReminderPermission() {
      runOnUiThread(() -> askNotificationPermissionIfNeeded());
    }
    @JavascriptInterface public void openNotificationSettings() {
      runOnUiThread(() -> {
        try {
          Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
          startActivity(intent);
        } catch (Exception ex) {
          Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.parse("package:" + getPackageName()));
          startActivity(intent);
        }
      });
    }
    @JavascriptInterface public void saveBackup(String json) {
      pendingJson = json;
      runOnUiThread(() -> {
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("application/json");
        i.putExtra(Intent.EXTRA_TITLE, "Parem-Backup.json");
        startActivityForResult(i, CREATE_BACKUP);
      });
    }
    @JavascriptInterface public void openBackup() {
      runOnUiThread(() -> {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("application/json");
        startActivityForResult(i, OPEN_BACKUP);
      });
    }
    @JavascriptInterface public void openWebsite() {
      runOnUiThread(() -> {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(SITE))); }
        catch (Exception e) { Toast.makeText(MainActivity.this, "ناتوانرێت وێبسایت بکرێتەوە", Toast.LENGTH_LONG).show(); }
      });
    }
  }
  @Override protected void onActivityResult(int req, int result, Intent data) {
    super.onActivityResult(req,result,data);
    if (result != RESULT_OK || data == null || data.getData() == null) return;
    Uri uri = data.getData();
    try {
      if (req == CREATE_BACKUP) {
        try (OutputStream out=getContentResolver().openOutputStream(uri)) {
          if(out != null) out.write(pendingJson.getBytes(StandardCharsets.UTF_8));
        }
        Toast.makeText(this,"Backup پاشەکەوت کرا",Toast.LENGTH_SHORT).show();
      } else if (req == OPEN_BACKUP) {
        byte[] dataBytes;
        try (InputStream in=getContentResolver().openInputStream(uri); java.io.ByteArrayOutputStream buf=new java.io.ByteArrayOutputStream()) {
          byte[] chunk = new byte[8192]; int n; int total=0;
          while ((n=in.read(chunk))!=-1) { total+=n; if(total>5_000_000) throw new Exception("large backup"); buf.write(chunk,0,n); }
          dataBytes=buf.toByteArray();
        }
        String json = new String(dataBytes,StandardCharsets.UTF_8);
        web.evaluateJavascript("window.receiveBackup("+JSONObject.quote(json)+")",null);
      }
    } catch(Exception e) {
      Toast.makeText(this,"هەڵە لە Backup: "+e.getMessage(),Toast.LENGTH_LONG).show();
    }
  }
  @Override public void onBackPressed() {
    web.evaluateJavascript("window.paremBack && window.paremBack()", null);
  }
}
