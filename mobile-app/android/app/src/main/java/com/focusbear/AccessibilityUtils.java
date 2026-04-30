package com.focusbear;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Browser;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import com.focusbear.SupportedBrowserConfig;
import com.focusbear.BrowserUrlService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class AccessibilityUtils {

    private static final String TAG = "AccessibilityUtils";
    private static AccessibilityUtils instance;
    private List<String> restrictedAddresses = null;
    private String redirectTo = "https://focusbear.io/blocked";
    private final HashMap<String, Long> previousUrlDetections = new HashMap<>();
    private String packageName = "";
    private String foregroundAppName = null;
    private SupportedBrowserConfig browserConfig = null;

    private AccessibilityUtils() {}
    private static final int CONTENT_CHANGE_TYPE_TEXT = 1;
    private static final int CONTENT_CHANGE_TYPE_CONTENT_DESCRIPTION = 2;
    private static final int CONTENT_CHANGE_TYPE_SUBTREE = 4;

    public static AccessibilityUtils getInstance() {
        if (instance == null) {
            instance = new AccessibilityUtils();
        }
        return instance;
    }

    public void setRestrictedAddresses(List<String> addresses) {
        this.restrictedAddresses = new ArrayList<>();
        for (String address : addresses) {
            this.restrictedAddresses.add(filterInputAddress(address));
        }
    }

    private String filterInputAddress(String edtRestrictedAddress) {
        if (edtRestrictedAddress.startsWith("www.")) {
            return edtRestrictedAddress.replaceFirst("www.", "");
        }
        return edtRestrictedAddress;
    }

    public boolean shouldBlockUrl(String url) {
        if (restrictedAddresses != null && !restrictedAddresses.isEmpty()) {
            for (String restrictedAddress : restrictedAddresses) {
                if (url.toLowerCase().contains(restrictedAddress.toLowerCase())) {
                    return true;
                }
            }
        }
        return false;
    }

    public void filterBrowserURL(AccessibilityEvent event, BrowserUrlService myAccessibilityService, List<SupportedBrowserConfig> getSupportedBrowsers) {
        try {
            AccessibilityNodeInfo parentNodeInfo = event.getSource();
            if (parentNodeInfo == null) {
                return;
            }

            if (event.getPackageName() != null) {
                packageName = event.getPackageName().toString();
            }

            PackageManager packageManager = myAccessibilityService.getPackageManager();
            try {
                ApplicationInfo applicationInfo = packageManager.getApplicationInfo(packageName, 0);
                foregroundAppName = (String) packageManager.getApplicationLabel(applicationInfo);
            } catch (PackageManager.NameNotFoundException e) {
                e.printStackTrace();
            }

            browserConfig = null;
            for (SupportedBrowserConfig config : getSupportedBrowsers) {
                if (config.getPackageName().equals(packageName)) {
                    browserConfig = config;
                    break;
                }
            }
            if (browserConfig == null) {
                return;
            }

            String capturedUrl = captureUrl(parentNodeInfo, browserConfig);
            parentNodeInfo.recycle();
            if (capturedUrl == null) {
                return;
            }

            long eventTime = event.getEventTime();
            String detectionId = packageName + ", and url " + capturedUrl;
            long lastRecordedTime = previousUrlDetections.getOrDefault(detectionId, 0L);
            int contentChangeTypes = event.getContentChangeTypes();
            int relevantContentChangeMask = (CONTENT_CHANGE_TYPE_TEXT | CONTENT_CHANGE_TYPE_CONTENT_DESCRIPTION | CONTENT_CHANGE_TYPE_SUBTREE);
            boolean hasRelevantContentChange = (contentChangeTypes & relevantContentChangeMask) != 0;

            if (shouldBlockUrl(capturedUrl)) {
                Log.d("AccessibilityUtils", "Event type: " + event.getEventType());
                Log.d("AccessibilityUtils", "Captured URL: " + capturedUrl + " " + detectionId);
                Log.d("AccessibilityUtils", "Content change types: " + contentChangeTypes);
                Log.d("AccessibilityUtils", "Has relevant content change: " + hasRelevantContentChange + " (mask=" + relevantContentChangeMask + ")");
                Log.d("AccessibilityUtils", "shouldBlockUrl: " + capturedUrl + ", restrictedAddresses: " + (restrictedAddresses != null ? restrictedAddresses.toString() : "null"));
                Log.d("AccessibilityUtils", "shouldBlockUrl result: " + shouldBlockUrl(capturedUrl));
                Log.d("AccessibilityUtils", "Current eventTime: " + eventTime);
                Log.d("AccessibilityUtils", "Last recorded time: " + lastRecordedTime);
                Log.d("AccessibilityUtils", "Time difference: " + (eventTime - lastRecordedTime));
            }

            boolean shouldProcessNow = false;

            // If this is the first time we see this URL or enough time has passed, process it
            if (lastRecordedTime == 0 || eventTime - lastRecordedTime > 500) {
                shouldProcessNow = true;
            }

            if (shouldProcessNow && hasRelevantContentChange) {
                // Store the most recent event time
                previousUrlDetections.put(detectionId, eventTime);

                Log.d("AccessibilityUtils", "Processing URL - time difference > 500ms");
                analyzeCapturedUrl(myAccessibilityService, capturedUrl, browserConfig.getPackageName());
            }
        } catch (Exception e) {
            Log.e("AccessibilityUtils", "Error in filterBrowserURL: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Recursively traverses the accessibility node tree starting from the given node.
     *
     * <p>This method explores all child nodes of the provided,
     * and continues to traverse their children in a depth-first manner. For each node, it
     * accesses the view ID resource name and text content (if present), although it does
     * not store or act upon them.</p>
     *
     * https://developer.android.com/reference/android/view/accessibility/AccessibilityNodeInfo
     * 
     * @param info The root from which traversal begins. Must not be null.
     */
    private void exploreAccessibilityTree(AccessibilityNodeInfo info) {
        int count = info.getChildCount();
        for (int i = 0; i < count; i++) {
            AccessibilityNodeInfo child = info.getChild(i);
            if (child != null) {
                child.getViewIdResourceName();
                if (child.getText() != null) {
                    child.getText().toString();
                }
                exploreAccessibilityTree(child);
            }
        }
    }

    private String captureUrl(AccessibilityNodeInfo info, SupportedBrowserConfig config) {
        if (config == null) return null;
        List<AccessibilityNodeInfo> nodes = info.findAccessibilityNodeInfosByViewId(config.getAddressBarId());
        if (nodes == null || nodes.isEmpty()) return null;

        AccessibilityNodeInfo addressBarNodeInfo = nodes.get(0);
        String url = null;
        if (addressBarNodeInfo.getText() != null) {
            url = addressBarNodeInfo.getText().toString();
        }
        addressBarNodeInfo.recycle();
        return url;
    }

    private void analyzeCapturedUrl(BrowserUrlService serviceMy, String capturedUrl, String browserPackage) {
        if (shouldBlockUrl(capturedUrl)) {
            performRedirect(serviceMy, redirectTo, browserPackage, capturedUrl);
        }
    }

    private void performRedirect(BrowserUrlService serviceMy, String redirectUrl, String browserPackage, String blockedUrl) {
        if (!redirectUrl.startsWith("https://")) {
            redirectUrl = "https://" + redirectUrl;
        }
        try {
            if (redirectUrl.isEmpty()) return;
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(redirectUrl));
            intent.setPackage(browserPackage);
            intent.putExtra(Browser.EXTRA_APPLICATION_ID, browserPackage);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            serviceMy.startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(redirectUrl));
            serviceMy.startActivity(intent);
        }
    }
}
