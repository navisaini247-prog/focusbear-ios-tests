package com.focusbear;

import android.content.Context;
import android.content.res.Configuration;

/**
 * Home screen widgets read {@code theme_mode} from SharedPreferences (set from the in-app theme).
 * Color resources still resolve using the {@link Context}'s UI night mode, which otherwise follows
 * the <em>device</em> theme. Use {@link #wrap(Context, boolean)} so {@code R.color} / night qualifiers
 * match the app theme.
 */
public final class WidgetThemeContext {

    private WidgetThemeContext() {
    }

    public static boolean isDarkTheme(String themeMode) {
        return themeMode != null && "dark".equalsIgnoreCase(themeMode.trim());
    }

    public static Context wrap(Context base, boolean appDarkTheme) {
        Context app = base.getApplicationContext();
        Configuration config = new Configuration(app.getResources().getConfiguration());
        int nightMode = appDarkTheme
            ? Configuration.UI_MODE_NIGHT_YES
            : Configuration.UI_MODE_NIGHT_NO;
        config.uiMode = (config.uiMode & ~Configuration.UI_MODE_NIGHT_MASK) | nightMode;
        return app.createConfigurationContext(config);
    }
}
