package com.parem.finance;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ReminderReceiver extends BroadcastReceiver {
  @Override public void onReceive(Context context, Intent intent) {
    String action = intent == null ? null : intent.getAction();
    if (ReminderScheduler.ACTION_REMIND.equals(action)) {
      int slot = intent.getIntExtra("slot", -1);
      if (slot >= 0 && slot < 3) {
        ReminderScheduler.notifyUser(context, slot);
        ReminderScheduler.scheduleNext(context, slot);
      }
    } else if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
               Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
               Intent.ACTION_TIMEZONE_CHANGED.equals(action) ||
               Intent.ACTION_TIME_CHANGED.equals(action)) {
      ReminderScheduler.makeChannel(context);
      ReminderScheduler.scheduleAll(context);
    }
  }
}
