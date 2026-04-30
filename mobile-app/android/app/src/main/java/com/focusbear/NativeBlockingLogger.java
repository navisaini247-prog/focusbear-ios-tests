package com.focusbear;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import java.io.File;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class NativeBlockingLogger {
    private static final String TAG = "NativeBlockingLogger";
    private static final String LOG_FILE_NAME = "focusbear-native-blocking.log";
    private static final String LOGS_DIR_NAME = "logs";
    private static final long LOG_RETENTION_MS = 24L * 60L * 60L * 1000L;
    private static final long PRUNE_INTERVAL_MS = 60L * 60L * 1000L;
    private static long lastPruneTimeMs = 0L;
    private static final int TIMESTAMP_PREFIX_LEN = 23; // yyyy-MM-dd HH:mm:ss.SSS
    private static final SimpleDateFormat LINE_TIMESTAMP_FORMAT =
            new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US);
    // Collapse consecutive identical log lines to reduce noise.
    private static String lastLevel = null;
    private static String lastMessage = null;
    private static int suppressedRepeatCount = 0;
    private static boolean duplicateSuppressionLineWritten = false;

    /** Default max labels before splitting into +more= for blocking_decision_check logs. */
    public static final int DEFAULT_BLOCKED_PREVIEW_MAX_PRIMARY = 20;
    public static final int DEFAULT_URL_PREVIEW_MAX_PRIMARY = 20;

    private NativeBlockingLogger() {}

    /**
     * Human-readable blocked-app preview for logs: sorted display names, not package names.
     * If there are more than maxPrimary apps, the remainder are listed in full under +more.
     */
    public static String formatBlockedPreviewLabels(Context context, Set<String> packageNames, int maxPrimary) {
        if (context == null || packageNames == null || packageNames.isEmpty()) {
            return "[]";
        }
        PackageManager pm = context.getPackageManager();
        List<String> labels = new ArrayList<>();
        for (String pkg : packageNames) {
            if (pkg == null || pkg.isEmpty()) {
                continue;
            }
            try {
                ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
                CharSequence label = pm.getApplicationLabel(info);
                labels.add(label != null ? label.toString().trim() : pkg);
            } catch (PackageManager.NameNotFoundException e) {
                labels.add(pkg);
            }
        }
        Collections.sort(labels);
        if (labels.size() <= maxPrimary) {
            return labels.toString();
        }
        List<String> first = new ArrayList<>(labels.subList(0, maxPrimary));
        List<String> rest = new ArrayList<>(labels.subList(maxPrimary, labels.size()));
        return first + " +more=" + rest;
    }

    public static String formatStringPreview(List<String> values, int maxPrimary) {
        if (values == null || values.isEmpty()) {
            return "[]";
        }
        List<String> copy = new ArrayList<>();
        for (String value : values) {
            if (value == null || value.trim().isEmpty()) {
                continue;
            }
            copy.add(value.trim());
        }
        if (copy.isEmpty()) {
            return "[]";
        }
        Collections.sort(copy);
        if (copy.size() <= maxPrimary) {
            return copy.toString();
        }
        List<String> first = new ArrayList<>(copy.subList(0, maxPrimary));
        List<String> rest = new ArrayList<>(copy.subList(maxPrimary, copy.size()));
        return first + " +more=" + rest;
    }

    public static void logBlockingEvent(Context context, String message) {
        write(context, "INFO", message, null);
    }

    public static void logBlockingError(Context context, String message, Throwable throwable) {
        write(context, "ERROR", message, throwable);
    }

    private static synchronized void write(Context context, String level, String message, Throwable throwable) {
        if (context == null) {
            Log.w(TAG, "Context is null; skipping native blocking log write");
            return;
        }

        try {
            File externalCacheDir = context.getExternalCacheDir();
            if (externalCacheDir == null) {
                Log.w(TAG, "External cache directory unavailable; skipping log write");
                return;
            }

            File logsDir = new File(externalCacheDir, LOGS_DIR_NAME);
            if (!logsDir.exists() && !logsDir.mkdirs()) {
                Log.w(TAG, "Failed to create logs directory: " + logsDir.getAbsolutePath());
                return;
            }

            File logFile = new File(logsDir, LOG_FILE_NAME);
            String effectiveMessage = message;
            if (throwable != null) {
                effectiveMessage += " | " + throwable.getClass().getSimpleName() + ": " + throwable.getMessage();
            }

            boolean isSameAsPrevious =
                    level != null && level.equals(lastLevel)
                            && effectiveMessage != null && effectiveMessage.equals(lastMessage);

            if (isSameAsPrevious) {
                suppressedRepeatCount++;
                if (!duplicateSuppressionLineWritten) {
                    String suppressionLine = buildLine(
                            "INFO",
                            "... duplicate native blocking logs suppressed for this message");
                    appendLine(logFile, suppressionLine);
                    duplicateSuppressionLineWritten = true;
                }
                return;
            }

            maybePruneExpiredLines(logFile);

            if (duplicateSuppressionLineWritten && suppressedRepeatCount > 0) {
                String summaryLine = buildLine(
                        "INFO",
                        "... previous native blocking log repeated " + suppressedRepeatCount + " more times");
                appendLine(logFile, summaryLine);
            }

            suppressedRepeatCount = 0;
            duplicateSuppressionLineWritten = false;
            lastLevel = level;
            lastMessage = effectiveMessage;

            String line = buildLine(level, effectiveMessage);
            appendLine(logFile, line);
        } catch (IOException ioException) {
            Log.e(TAG, "Failed to write native blocking log", ioException);
        }
    }

    private static String buildLine(String level, String message) {
        String timestamp = LINE_TIMESTAMP_FORMAT.format(new Date());
        return timestamp + " [" + level + "] [NATIVE_BLOCKING] " + message;
    }

    private static void maybePruneExpiredLines(File logFile) {
        long now = System.currentTimeMillis();
        if (now - lastPruneTimeMs < PRUNE_INTERVAL_MS) {
            return;
        }
        lastPruneTimeMs = now;
        pruneExpiredLines(logFile);
    }

    private static void appendLine(File logFile, String line) throws IOException {
        try (FileWriter writer = new FileWriter(logFile, true)) {
            writer.append(line).append('\n');
        }
    }

    private static void pruneExpiredLines(File logFile) {
        if (logFile == null || !logFile.exists()) {
            return;
        }
        long cutoffMs = System.currentTimeMillis() - LOG_RETENTION_MS;
        List<String> retained = new ArrayList<>();
        boolean changed = false;
        SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US);
        parser.setLenient(false);

        try (BufferedReader reader = new BufferedReader(new FileReader(logFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                Long ts = parseTimestamp(line, parser);
                if (ts == null || ts >= cutoffMs) {
                    retained.add(line);
                } else {
                    changed = true;
                }
            }
        } catch (IOException e) {
            Log.w(TAG, "Failed reading native blocking log for pruning: " + logFile.getAbsolutePath(), e);
            return;
        }

        if (!changed) {
            return;
        }

        try (FileOutputStream out = new FileOutputStream(logFile, false)) {
            for (String line : retained) {
                out.write(line.getBytes());
                out.write('\n');
            }
        } catch (IOException e) {
            Log.w(TAG, "Failed rewriting pruned native blocking log: " + logFile.getAbsolutePath(), e);
        }
    }

    private static Long parseTimestamp(String line, SimpleDateFormat parser) {
        if (line == null || line.length() < TIMESTAMP_PREFIX_LEN) {
            return null;
        }
        try {
            Date parsed = parser.parse(line.substring(0, TIMESTAMP_PREFIX_LEN));
            return parsed != null ? parsed.getTime() : null;
        } catch (ParseException ignored) {
            return null;
        }
    }
}
