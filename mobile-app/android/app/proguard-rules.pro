# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
# http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.focusbear.BuildConfig { *; }
-keep public class com.horcrux.svg.** {*;}
-keep class com.transistorsoft.rnbackgroundfetch.HeadlessTask { *; }

# Keep the entry point of the application
-keepclasseswithmembers public class com.focusbear.MainApplication {
    public static void main(java.lang.String[]);
}

# React Native specific ProGuard rules
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.turbomodule.core.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep all native method names
-keepclassmembers class * {
    native <methods>;
}

# Keep classes that are accessed via reflection
-keep public class * extends com.facebook.react.view.ManagedEventModule {
    <fields>;
    <methods>;
}
