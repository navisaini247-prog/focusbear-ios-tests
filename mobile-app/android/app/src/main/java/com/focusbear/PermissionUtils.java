package com.focusbear;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;

/**
 * Utility class for permission checking logic.
 * Centralizes permission checks to avoid duplication across modules.
 */
public final class PermissionUtils {

    private PermissionUtils() {
        // Utility class - prevent instantiation
    }

    /**
     * Checks if the app has usage stats permission (required for querying app usage on Android M+).
     *
     * @param context Application or activity context
     * @return true if permission is granted or not required (pre-M), false otherwise
     */
    public static boolean hasUsageStatsPermission(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        if (appOps == null) return false;
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), context.getPackageName());
        if (mode == AppOpsManager.MODE_DEFAULT) {
            return context.checkCallingOrSelfPermission(android.Manifest.permission.PACKAGE_USAGE_STATS)
                    == PackageManager.PERMISSION_GRANTED;
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }
}
