package com.parem.finance;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
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
  private String pendingJson = "";
  private static final int CREATE_BACKUP = 37;
  private static final int OPEN_BACKUP = 38;
  private static final String SITE = "https://parem-karzan-2026.loftytrail13.chatgpt.site";
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().setStatusBarColor(Color.rgb(10,18,35));
    getWindow().setNavigationBarColor(Color.rgb(10,18,35));
    getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
    web = new WebView(this);
    web.setBackgroundColor(Color.rgb(10,18,35));
    web.getSettings().setJavaScriptEnabled(true);
    web.getSettings().setDomStorageEnabled(true);
    web.getSettings().setAllowFileAccess(true);
    web.getSettings().setDefaultTextEncodingName("UTF-8");
    web.getSettings().setBuiltInZoomControls(false);
    web.getSettings().setDisplayZoomControls(false);
    web.setWebViewClient(new WebViewClient());
    web.setWebChromeClient(new WebChromeClient());
    web.addJavascriptInterface(new AppBridge(), "ParemAndroid");
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
  }
  public class AppBridge {
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
