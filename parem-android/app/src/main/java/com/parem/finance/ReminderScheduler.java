package com.parem.finance;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;
import java.util.Locale;

/**
 * Three daily, local-time expense reminders.
 *
 * Uses setAndAllowWhileIdle (not an exact alarm) to avoid requiring the
 * special exact-alarm permission; Android may delay delivery during Doze.
 * Each one-shot alarm schedules its successor after firing. Reboot/package
 * replacement/timezone changes reschedule all three reminders.
 */
public final class ReminderScheduler {
  private static final String PREFS = "parem_reminders";
  private static final String CHANNEL = "parem_daily_expenses";
  static final String ACTION_REMIND = "com.parem.finance.ACTION_REMIND";
  private static final int START_ID = 28000;
  private static final int NOTIFICATION_ID = 29000;
  static final String[] DEFAULTS = {"09:00", "14:00", "21:00"};

  private ReminderScheduler() {}

  static SharedPreferences prefs(Context c) {
    return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
  }
  static boolean isEnabled(Context c) {
    return prefs(c).getBoolean("enabled", true);
  }
  static String getTime(Context c, int slot) {
    return prefs(c).getString("time_" + slot, DEFAULTS[slot]);
  }
  static boolean valid(String v) {
    if (v == null || !v.matches("\\d{2}:\\d{2}")) return false;
    int h = Integer.parseInt(v.substring(0, 2));
    int m = Integer.parseInt(v.substring(3, 5));
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }
  static boolean notificationPermission(Context c) {
    return Build.VERSION.SDK_INT < 33 ||
      c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
  }
  public static String settingsJson(Context c) {
    try {
      JSONObject j = new JSONObject();
      j.put("enabled", isEnabled(c));
      j.put("permission", notificationPermission(c));
      JSONArray arr = new JSONArray();
      for (int i = 0; i < 3; i++) arr.put(getTime(c, i));
      j.put("times", arr);
      return j.toString();
    } catch (Exception e) {
      return "{\"enabled\":true,\"permission\":false,\"times\":[\"09:00\",\"14:00\",\"21:00\"]}";
    }
  }
  static boolean save(Context c, boolean enabled, String a, String b, String d) {
    if (!valid(a) || !valid(b) || !valid(d)) return false;
    if (a.equals(b) || a.equals(d) || b.equals(d)) return false;
    prefs(c).edit().putBoolean("enabled", enabled)
      .putString("time_0", a).putString("time_1", b).putString("time_2", d).apply();
    scheduleAll(c);
    return true;
  }
  private static PendingIntent pending(Context c, int slot) {
    Intent i = new Intent(c, ReminderReceiver.class).setAction(ACTION_REMIND);
    i.putExtra("slot", slot);
    return PendingIntent.getBroadcast(c, START_ID + slot, i,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }
  private static AlarmManager manager(Context c) {
    return (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
  }
  static void scheduleAll(Context c) {
    AlarmManager am = manager(c);
    if (am == null) return;
    for (int i = 0; i < 3; i++) am.cancel(pending(c, i));
    if (!isEnabled(c)) return;
    for (int i = 0; i < 3; i++) scheduleNext(c, i);
  }
  static void scheduleNext(Context c, int slot) {
    if (slot < 0 || slot >= 3 || !isEnabled(c)) return;
    String t = getTime(c, slot);
    if (!valid(t)) return;
    Calendar when = Calendar.getInstance();
    when.set(Calendar.HOUR_OF_DAY, Integer.parseInt(t.substring(0, 2)));
    when.set(Calendar.MINUTE, Integer.parseInt(t.substring(3)));
    when.set(Calendar.SECOND, 0);
    when.set(Calendar.MILLISECOND, 0);
    if (when.getTimeInMillis() <= System.currentTimeMillis() + 2000L) {
      when.add(Calendar.DAY_OF_YEAR, 1);
    }
    AlarmManager am = manager(c);
    if (am != null) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when.getTimeInMillis(), pending(c, slot));
  }
  static void makeChannel(Context c) {
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationManager nm = (NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
      if (nm == null) return;
      NotificationChannel ch = new NotificationChannel(CHANNEL, "بیرخستنەوەی خەرجییەکان",
        NotificationManager.IMPORTANCE_DEFAULT);
      ch.setDescription("سێ جار لە ڕۆژێکدا بیرخستنەوەی تۆمارکردنی خەرجی");
      nm.createNotificationChannel(ch);
    }
  }
  static void notifyUser(Context c, int slot) {
    if (!isEnabled(c) || !notificationPermission(c)) return;
    makeChannel(c);
    Intent open = new Intent(c, MainActivity.class);
    open.setAction("com.parem.finance.OPEN_EXPENSE");
    open.putExtra("open_expense", true);
    open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent openIntent = PendingIntent.getActivity(c, START_ID + slot, open,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    Notification.Builder builder = Build.VERSION.SDK_INT >= 26
      ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c);
    builder.setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle("پارەم ـ بیرخستنەوە")
      .setContentText("خەرجییەکانی ئەمڕۆت تۆمار کردووە؟ ئێستا زیادی بکە.")
      .setAutoCancel(true)
      .setContentIntent(openIntent);
    NotificationManager nm = (NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm != null) nm.notify(NOTIFICATION_ID + slot, builder.build());
  }
}
