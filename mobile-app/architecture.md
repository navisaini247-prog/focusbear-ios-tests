# Architecture Notes

## App Routine State Management

The app updates its state based on responses from the server. Upon opening the main screen (`home.js`), a call is made to `getRoutineData()`. This function calls the API and dispatches the response to Redux.

Simultaneously, a call to `getCurrentActivities()` is made. This function determines the current routine by comparing the startup and shutdown times with the current time. It sets the current routine name key and formats the `currentRoutineData` variable to include the activities and methods for the current routine. This is then used to set the current index and display the list for the current routine on the `home.js` screen.

- Routine data fetching and setting state: [ActivityActions.js#L463](https://github.com/Focus-Bear/mobile-app/blob/b6d73f6176d8ae3842b92ab9062a12dfee9ebb5a/src/actions/ActivityActions.js#L463)
- User login and routine data setup actions: [Home.js#L301](https://github.com/Focus-Bear/mobile-app/blob/b6d73f6176d8ae3842b92ab9062a12dfee9ebb5a/src/screens/Home/Home.js#L301)

## New Signups State

The app marks the new signup routine as complete based on a specific function. Currently, the app assumes the first routine is complete unless the user opts for a different action upon signup.

- New signup routine completion: [UserActions.js#L245](https://github.com/Focus-Bear/mobile-app/blob/b6d73f6176d8ae3842b92ab9062a12dfee9ebb5a/src/actions/UserActions.js#L245)

## Pusher Notifications

Using the `handleNotification` function, the app updates the Redux state based on the payload. Pusher notifications are sent whenever a routine is completed, focus mode is started, or there is a change from startup to shutdown time.

To test pusher notifications, ensure you have admin access and use the debug console at [Pusher Debug Console](https://dashboard.pusher.com/beams/instances/e1978d28-33b8-4206-ad36-2b62afe9fb59/debug_console) while the mobile app is running. Make sure the app is subscribed to Pusher logs before testing.

- Push notifications handling: [PusherMethods.js#L213](https://github.com/Focus-Bear/mobile-app/blob/b6d73f6176d8ae3842b92ab9062a12dfee9ebb5a/src/utils/PusherMethods.js#L213)

## Background Services

The app blocks user-selected apps by running Android background services. These services check for user-selected allowed and disallowed apps and block them accordingly.

Functions in the `OverlayModule.java` are responsible for:

1. Retrieving and listing all installed apps.
2. Saving them in cache.

In the `OverlayControl.java` file, the blocking service code mainly deals with filtering system apps, allowing user-selected apps, disallowing distracting apps, and excluding manually specified core system apps.

- Overlay module functions for retrieving and listing: [OverlayModule.java#L74](https://github.com/Focus-Bear/mobile-app/blob/b6d73f6176d8ae3842b92ab9062a12dfee9ebb5a/android/app/src/main/java/com/focusbear/OverlayModule.java#L74)
- Blocking service code: [OverlayControl.java#L53](https://github.com/Focus-Bear/mobile-app/blob/b6d73f6176d8ae3842b92ab9062a12dfee9ebb5a/android/app/src/main/java/com/focusbear/OverlayControl.java#L53)

## iOS Blocking Service

The iOS Shield Service facilitates communication between React Native and Objective-C through the React Native bridge. The [ControlFunctionBridge.m](https://github.com/Focus-Bear/mobile-app/blob/develop/ios/ControlFunctionBridge.m) file establishes this connection.

The [ControlModel.swift](https://github.com/Focus-Bear/mobile-app/blob/develop/ios/ControlModel.swift) file is responsible for storing selected app tokens and initializing them when a user selects the apps.

The Start Overlay Service method checks the screen time permissions and initiates the service by calling the `controlFunction` through the bridge as shown in [NativeModuleMethods.js](https://github.com/Focus-Bear/mobile-app/blob/b6d73f6176d8ae3842b92ab9062a12dfee9ebb5a/src/utils/NativeModuleMethods.js#L49).
