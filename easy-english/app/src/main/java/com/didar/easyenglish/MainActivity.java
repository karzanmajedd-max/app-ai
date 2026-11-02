package com.didar.easyenglish;
import android.Manifest;import android.app.*;import android.os.*;import android.content.*;import android.content.pm.PackageManager;import android.graphics.Color;import android.webkit.*;import android.speech.*;import android.speech.tts.*;import android.view.*;import android.security.keystore.KeyGenParameterSpec;import android.security.keystore.KeyProperties;
import java.util.*;import java.net.*;import android.net.Uri;import java.io.*;import javax.crypto.*;import javax.crypto.spec.GCMParameterSpec;import java.security.KeyStore;import android.util.Base64;import org.json.JSONObject;
public class MainActivity extends Activity {
 WebView web;TextToSpeech tts;boolean ready=false;SpeechRecognizer rec;String pendingWord=null;String memoryKey="";final String STORE="easyenglishGemini",ALIAS="EasyEnglishGeminiV1";static final int AUDIO_PERMISSION=7411;
 @Override public void onCreate(Bundle b){super.onCreate(b);getWindow().setStatusBarColor(0xff31442e);getWindow().setNavigationBarColor(0xfff4f0e7);if(Build.VERSION.SDK_INT>=26)getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
 web=new WebView(this);web.setBackgroundColor(0xfff4f0e7);WebSettings ws=web.getSettings();ws.setJavaScriptEnabled(true);ws.setDomStorageEnabled(true);ws.setAllowFileAccess(false);ws.setAllowUniversalAccessFromFileURLs(false);ws.setAllowFileAccessFromFileURLs(false);ws.setJavaScriptCanOpenWindowsAutomatically(false);
 web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if("file".equals(uri.getScheme())&&"android_asset".equals(uri.getHost()))return false;try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}return true;}});web.addJavascriptInterface(new Bridge(),"Android");setContentView(web);
 if(Build.VERSION.SDK_INT>=30)web.setOnApplyWindowInsetsListener((v,in)->{android.graphics.Insets x=in.getInsets(WindowInsets.Type.systemBars());web.setPadding(0,x.top,0,x.bottom);return in;});
 web.loadUrl("file:///android_asset/index.html");tts=new TextToSpeech(this,s->{if(s==TextToSpeech.SUCCESS&&tts!=null){int r=tts.setLanguage(Locale.US);ready=r!=TextToSpeech.LANG_MISSING_DATA&&r!=TextToSpeech.LANG_NOT_SUPPORTED;}}); ReminderReceiver.channel(this);
 }
 void callback(String js){runOnUiThread(()->{if(web!=null)web.evaluateJavascript(js,null);});}
 void heard(String txt, boolean recognized){callback("window.easyEnglishOnNativeSpeech("+JSONObject.quote(txt)+","+recognized+")");}
 void listen(String word){if(!SpeechRecognizer.isRecognitionAvailable(this)){speechIntentFallback();return;}try{if(rec!=null)rec.destroy();rec=SpeechRecognizer.createSpeechRecognizer(this);rec.setRecognitionListener(new RecognitionListener(){public void onReadyForSpeech(Bundle b){heard("🎙 قسە بکە...",false);}public void onBeginningOfSpeech(){}public void onRmsChanged(float r){}public void onBufferReceived(byte[] b){}public void onEndOfSpeech(){}public void onError(int n){if(n==SpeechRecognizer.ERROR_CLIENT||n==SpeechRecognizer.ERROR_SERVER||n==SpeechRecognizer.ERROR_RECOGNIZER_BUSY){speechIntentFallback();return;}String msg=(n==SpeechRecognizer.ERROR_NO_MATCH)?"دەنگێک بە ڕوونی نەناسرا؛ دووبارە هەوڵ بدە.":(n==SpeechRecognizer.ERROR_SPEECH_TIMEOUT)?"هیچ قسەیەک نەبیسترا؛ دووبارە مایکرۆفۆن دابگرە.":(n==SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS)?"مۆڵەتی مایکرۆفۆن لە ڕێکخستنەکانی مۆبایل چالاک بکە.":(n==SpeechRecognizer.ERROR_NETWORK||n==SpeechRecognizer.ERROR_NETWORK_TIMEOUT)?"ناسینەوەی دەنگی مۆبایلەکەت پێویستی بە ئینتەرنێت هەیە.":"ناسینەوەی دەنگ سەرکەوتوو نەبوو (هەڵە "+n+").";heard(msg,false);}public void onResults(Bundle b){ArrayList<String>a=b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);heard(a==null||a.isEmpty()?"":a.get(0),true);}public void onPartialResults(Bundle b){}public void onEvent(int t,Bundle b){} });Intent i=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);i.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"en-US");i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);rec.startListening(i);}catch(Exception e){speechIntentFallback();}}

 void speechIntentFallback(){try{Intent i=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);i.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"en-US");i.putExtra(RecognizerIntent.EXTRA_PROMPT,"Speak English");startActivityForResult(i,7412);}catch(Exception e){heard("ناسینەوەی دەنگ لەم مۆبایلەدا بەردەست نییە. مایکرۆفۆنی Gboard بەکاربهێنە.",false);}}
 @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){super.onActivityResult(requestCode,resultCode,data);if(requestCode==7412){if(resultCode==RESULT_OK&&data!=null){ArrayList<String> a=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);heard(a!=null&&!a.isEmpty()?a.get(0):"",a!=null&&!a.isEmpty());}else heard("گوێگرتن هەڵوەشایەوە؛ دووبارە هەوڵ بدە.",false);}}
 @Override public void onRequestPermissionsResult(int req,String[] p,int[] grants){super.onRequestPermissionsResult(req,p,grants);if(req==AUDIO_PERMISSION){if(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED&&pendingWord!=null)listen(pendingWord);else heard("مۆڵەتی مایکرۆفۆن نەدرا",false);pendingWord=null;}}
 boolean speak(String t,float rate,String gender){if(!ready||tts==null)return false; Voice found=null; if("male".equals(gender)){Set<Voice>vs=tts.getVoices();if(vs!=null)for(Voice v:vs){if(!"en".equals(v.getLocale().getLanguage()))continue;String n=v.getName().toLowerCase(Locale.US);if(n.matches(".*(male|david|daniel|george|ryan|james|guy|mark|henry).*")&&!n.contains("female")){found=v;break;}}if(found==null)return false;}tts.stop();tts.setSpeechRate(Math.min(1.3f,Math.max(.25f,rate)));if(found==null)tts.setLanguage(Locale.US);else tts.setVoice(found);return tts.speak(t,TextToSpeech.QUEUE_FLUSH,null,"easy-english")!=TextToSpeech.ERROR;}
 float rate(String s){try{return Float.parseFloat(s);}catch(Exception e){return .67f;}}
 String secret(){if(!memoryKey.isEmpty())return memoryKey;try{String stored=getPreferences(0).getString(STORE,"");if(stored.isEmpty())return "";String[] parts=stored.split(":");KeyStore k=KeyStore.getInstance("AndroidKeyStore");k.load(null);javax.crypto.SecretKey key=(javax.crypto.SecretKey)k.getKey(ALIAS,null);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key,new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));return new String(c.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),"UTF-8");}catch(Exception e){return "";}}
 boolean storeSecret(String key,boolean remember){memoryKey=key==null?"":key;if(!remember){getPreferences(0).edit().remove(STORE).apply();return true;}try{KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);if(!ks.containsAlias(ALIAS)){KeyGenerator kg=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");kg.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());kg.generateKey();}javax.crypto.SecretKey sk=(javax.crypto.SecretKey)ks.getKey(ALIAS,null);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,sk);String value=Base64.encodeToString(c.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(c.doFinal(memoryKey.getBytes("UTF-8")),Base64.NO_WRAP);getPreferences(0).edit().putString(STORE,value).apply();return true;}catch(Exception e){return false;}}
 class Bridge{
 @JavascriptInterface public boolean speakEnglish(String t,String r){return speak(t,rate(r),"female");}
 @JavascriptInterface public boolean speakWithGender(String t,String r,String g){return speak(t,rate(r),g);}
 @JavascriptInterface public void stopEnglish(){runOnUiThread(()->{if(tts!=null)tts.stop();});}
 @JavascriptInterface public boolean startSpeechPractice(String w){pendingWord=w;runOnUiThread(()->{if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},AUDIO_PERMISSION);else listen(w);});return true;}
 @JavascriptInterface public boolean saveGeminiKey(String k,boolean remember){return storeSecret(k,remember);}
 @JavascriptInterface public boolean hasGeminiKey(){return !secret().isEmpty();}
 @JavascriptInterface public void clearGeminiKey(){memoryKey="";getPreferences(0).edit().remove(STORE).apply();}
 @JavascriptInterface public void geminiListModels(String id,String pageToken){
  if(pageToken==null||pageToken.length()>4096){geminiResult(id,false,"Invalid page token");return;}
  try{geminiRequest(id,"GET","models?pageSize=1000"+(pageToken.isEmpty()?"":"&pageToken="+java.net.URLEncoder.encode(pageToken,"UTF-8")),null);}catch(Exception e){geminiResult(id,false,"Invalid page token");}
 }
 @JavascriptInterface public void geminiGenerate(String model,String id,String body){
  if(model==null||!model.matches("gemini-[A-Za-z0-9._-]{1,150}")){geminiResult(id,false,"Invalid model name");return;}
  geminiRequest(id,"POST","models/"+model+":generateContent",body);
 }
 void geminiResult(String id,boolean ok,String response){callback("window.easyEnglishGeminiNativeResult("+JSONObject.quote(id)+","+ok+","+JSONObject.quote(response)+")");}
 void geminiRequest(String id,String method,String path,String body){new Thread(()->{
  String response="",key="";boolean ok=false;HttpURLConnection conn=null;
  try{
   key=secret();if(key.isEmpty())throw new IOException("Gemini API Key نییە");
   conn=(HttpURLConnection)new URL("https://generativelanguage.googleapis.com/v1beta/"+path).openConnection();
   conn.setConnectTimeout(15000);conn.setReadTimeout(30000);conn.setInstanceFollowRedirects(false);
   conn.setRequestMethod(method);conn.setRequestProperty("x-goog-api-key",key);
   if("POST".equals(method)){conn.setDoOutput(true);conn.setRequestProperty("Content-Type","application/json");try(OutputStream out=conn.getOutputStream()){out.write(body.getBytes("UTF-8"));}}
   int status=conn.getResponseCode();ok=status>=200&&status<300;
   InputStream stream=ok?conn.getInputStream():conn.getErrorStream();ByteArrayOutputStream out=new ByteArrayOutputStream();
   if(stream!=null)try(InputStream in=stream){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){if(out.size()+n>2000000)throw new IOException("Gemini response too large");out.write(b,0,n);}}
   response=out.toString("UTF-8");
   if(!ok){JSONObject error;try{error=new JSONObject(response).optJSONObject("error");}catch(Exception e){error=null;}
    if(error==null)error=new JSONObject().put("message","Gemini HTTP "+status);
    response=new JSONObject().put("httpStatus",status).put("error",error).toString();}
  }catch(Exception ex){ok=false;response=ex.getMessage()==null?"Connection error":ex.getMessage();}
  finally{if(conn!=null)conn.disconnect();}
  if(!key.isEmpty())response=response.replace(key,"[REDACTED]");
  geminiResult(id,ok,response);
 }).start();}
 @JavascriptInterface public void setDailyReminder(boolean on,int h,int m,String text){ReminderReceiver.schedule(MainActivity.this,on,h,m,text);}
 }
 @Override protected void onDestroy(){if(rec!=null)rec.destroy();if(tts!=null){tts.stop();tts.shutdown();}if(web!=null)web.destroy();super.onDestroy();}
}
