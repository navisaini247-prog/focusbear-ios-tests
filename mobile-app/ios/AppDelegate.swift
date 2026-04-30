import Firebase
import RNBootSplash
import React
import ReactAppDependencyProvider
import React_RCTAppDelegate
import TSBackgroundFetch
import UIKit
import AppIntents

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        FirebaseApp.configure()

        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()
        reactNativeDelegate = delegate
        reactNativeFactory = factory
        window = UIWindow(frame: UIScreen.main.bounds)
        factory.startReactNative(
            withModuleName: "FocusBear",
            in: window,
            launchOptions: launchOptions
        )
        // Background fetch initialization
        TSBackgroundFetch.sharedInstance().didFinishLaunching()

        // Register App Shortcuts so the app appears in the Shortcuts app.
        if #available(iOS 16.0, *) {
            FocusBearShortcuts.updateAppShortcutParameters()
        }

        return true
    }
    
    // MARK: - Quick Actions (Home Screen Long Press)
    func application(
        _ application: UIApplication,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        
        let urlString: String
        switch shortcutItem.type {
        case "com.focusbear.startfocus":
            urlString = "focusbear://home?action=start-focus-session"
        case "com.focusbear.startnexthabit":
            urlString = "focusbear://home?action=start-routine"
        case "com.focusbear.addtask":
            urlString = "focusbear://home?action=add-task"
        default:
            completionHandler(false)
            return
        }
        
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url, options: [:]) { success in
                completionHandler(success)
            }
        } else {
            completionHandler(false)
        }
    }
    
    // MARK: - Deep Linking (Custom URL Schemes)
    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        return RCTLinkingManager.application(app, open: url, options: options)
    }
    
    // MARK: - Universal Links
    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        return RCTLinkingManager.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }
    
    // MARK: - Push Notifications
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        print("Registered for remote notifications with token: \(deviceToken)")
    }
    
    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        completionHandler(.newData)
    }
    
    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Remote notification support is unavailable due to error: \(error.localizedDescription)")
    }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge!) -> URL! {
        return self.bundleURL()
    }
    
    override func bundleURL() -> URL! {
        #if DEBUG
            return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
            return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
    
    override func customize(_ rootView: RCTRootView) {
        super.customize(rootView)
        RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
    }
}
