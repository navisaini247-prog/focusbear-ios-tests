package com.focusbear

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class CreateShortcutActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check which alias launched this activity
        val componentName = intent.component?.className ?: ""
        
        if (componentName.endsWith("ShortcutStartFocus")) {
            // Default to 25 minutes with no intention
            val url = "focusbear://home?action=start-focus-session&duration=25&intention="
            createShortcut(
                getString(R.string.shortcut_start_focus_short),
                url
            )
        } else if (componentName.endsWith("ShortcutStartHabit")) {
            createShortcut(
                getString(R.string.shortcut_start_habit_short),
                "focusbear://home?action=start-routine"
            )
        } else if (componentName.endsWith("ShortcutAddTask")) {
            createShortcut(
                getString(R.string.shortcut_add_task_short),
                "focusbear://home?action=add-task"
            )
        } else {
            finish()
        }
    }

    private fun createShortcut(shortLabel: String, dataUrl: String) {
        val shortcutIntent = Intent(Intent.ACTION_VIEW).apply {
            setClassName(this@CreateShortcutActivity, "com.focusbear.MainActivity")
            data = android.net.Uri.parse(dataUrl)
            action = Intent.ACTION_VIEW
        }

        // Return the shortcut intent to the caller (Launcher, MacroDroid, etc.)
        val resultIntent = Intent()
        resultIntent.putExtra(Intent.EXTRA_SHORTCUT_INTENT, shortcutIntent)
        resultIntent.putExtra(Intent.EXTRA_SHORTCUT_NAME, shortLabel)
        
        // Use the app icon as the shortcut icon
        val icon = Intent.ShortcutIconResource.fromContext(this, R.mipmap.ic_launcher)
        resultIntent.putExtra(Intent.EXTRA_SHORTCUT_ICON_RESOURCE, icon)

        setResult(Activity.RESULT_OK, resultIntent)
        finish()
    }
}
