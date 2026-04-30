package com.focusbear

import android.app.Application
import android.content.BroadcastReceiver
import android.content.Context
import android.content.IntentFilter
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.views.text.ReactFontManager
import com.facebook.soloader.SoLoader
import org.wonday.orientation.OrientationActivityLifecycle
import com.facebook.react.soloader.OpenSourceMergedSoMapping;

import android.content.Intent
import com.focusbear.blocking.react.BlockingSchedulePackage
import com.focusbear.googlesignin.GoogleCredentialManagerPackage
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage

class MainApplication : Application(), ReactApplication {
    companion object {
        var maincontext: MainApplication? = null
        var PACKAGE_NAME: String? = null
    }

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
                // Packages that cannot be autolinked yet can be added manually here, for example:
                // add(MyReactNativePackage())
                add(OverlayPackage())
                add(UsagePermissionPackage())
                add(AlarmPackage())
                add(ScheduleTasksPackage())
                add(FloatingViewPackage())
                add(WearCommunicationReactPackage())
                add(LauncherKitPackage())
                add(AccessibilityPackage())
                add(WindowPackage())
                add(LateNoMorePackage())
                add(FocusWidgetPackage())
                add(BlockingSchedulePackage())
                add(GoogleCredentialManagerPackage())
                add(ReactNativeFirebaseAppPackage())
                add(ReactNativeFirebaseMessagingPackage())
            }

        override fun getJSMainModuleName(): String = "index"
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun registerReceiver(receiver: BroadcastReceiver?, filter: IntentFilter): Intent? {
        return if (android.os.Build.VERSION.SDK_INT >= 34 && applicationInfo.targetSdkVersion >= 34) {
            super.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            super.registerReceiver(receiver, filter)
        }
    }

    override fun onCreate() {
        super.onCreate()
        maincontext = this
        PACKAGE_NAME = applicationContext.packageName
        ReactFontManager.getInstance().addCustomFont(this, "Fenwick", R.font.fenwick)
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load()
        }
        registerActivityLifecycleCallbacks(OrientationActivityLifecycle.getInstance())
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
    }
}  