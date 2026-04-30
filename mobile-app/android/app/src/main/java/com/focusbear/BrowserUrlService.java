package com.focusbear;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;

import java.util.ArrayList;
import java.util.List;
import android.util.Log;


public class BrowserUrlService extends AccessibilityService {

    public static BrowserUrlService instance;

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;

        Log.d("BrowserUrlService", "onServiceConnected");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            AccessibilityServiceInfo info = new AccessibilityServiceInfo();
            info.eventTypes = AccessibilityEvent.TYPES_ALL_MASK;
            info.packageNames = getPackageNames();
            info.feedbackType = AccessibilityServiceInfo.FEEDBACK_VISUAL;
            info.notificationTimeout = 300;
            info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS |
                         AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
            
            setServiceInfo(info);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (OverlayModule.isServiceRunning) {
            AccessibilityUtils.getInstance().filterBrowserURL(event, this, getSupportedBrowsers());
        }
    }

    @Override
    public void onInterrupt() {
        // ignore
    }

    private List<SupportedBrowserConfig> getSupportedBrowsers() {
        List<SupportedBrowserConfig> browsers = new ArrayList<>();
        browsers.add(new SupportedBrowserConfig("com.android.chrome", "com.android.chrome:id/url_bar"));
        browsers.add(new SupportedBrowserConfig("org.mozilla.firefox", "org.mozilla.firefox:id/mozac_browser_toolbar_url_view"));
        browsers.add(new SupportedBrowserConfig("com.opera.browser", "com.opera.browser:id/url_field"));
        browsers.add(new SupportedBrowserConfig("com.opera.mini.native", "com.opera.mini.native:id/url_field"));
        browsers.add(new SupportedBrowserConfig("com.duckduckgo.mobile.android", "com.duckduckgo.mobile.android:id/omnibarTextInput"));
        browsers.add(new SupportedBrowserConfig("com.microsoft.emmx", "com.microsoft.emmx:id/url_bar"));
        browsers.add(new SupportedBrowserConfig("com.coloros.browser", "com.coloros.browser:id/azt"));
        browsers.add(new SupportedBrowserConfig("com.sec.android.app.sbrowser", "com.sec.android.app.sbrowser:id/location_bar_edit_text"));
        return browsers;
    }

    private String[] getPackageNames() {
        List<String> packageNames = new ArrayList<>();
        for (SupportedBrowserConfig config : getSupportedBrowsers()) {
            packageNames.add(config.getPackageName());
        }
        return packageNames.toArray(new String[0]);
    }
}
