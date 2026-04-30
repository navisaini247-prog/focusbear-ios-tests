# FocusBear

## 📂 Folder structure

This project follows a very simple project structure:

- `src`: This folder is the main container of all the code inside your application.
  - `actions`: This folder contains all actions that can be dispatched to redux.
  - `assets`: Asset folder to store all images, vectors, etc.
  - `components`: Folder to store any common component that you use through your app (such as a generic button)
  - `constants`: Folder to store any kind of constant that you have.
  - `controllers`: Folder to store all your network logic (you should have one controller per resource).
  - `localization`: Folder to store the languages files.
  - `navigation`: Folder to store the navigators.
  - `reducers`: This folder should have all your reducers, and expose the combined result using its `index.js`
  - `screens`: Folder that contains all your application screens/features.
    - `Screen`: Each screen should be stored inside its own folder, and inside it a file for its code and a separate one for the styles and tests.
      - `Screen.js`
      - `Screen.styles.js`
  - `selectors`: Folder to store your selectors for each reducer.
  - `storage`: Folder that contains the application storage logic.
  - `store`: Folder to put all redux middlewares and the store.
  - `theme`: Folder to store all the styling concerns related to the application theme.
  - `App.js`: Main component that starts your whole app.
- `index.js`: Entry point of your application as per React-Native standards.

## 📦 Libraries we use

- [axios](https://github.com/axios/axios) for networking.
- [react-native-config](https://github.com/luggit/react-native-config) to manage envionments.
- [react-navigation](https://reactnavigation.org/) navigation library.
- [react-native-bootsplash](https://github.com/zoontek/react-native-bootsplash) app splash screen.
- [i81next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) to handle translations and localisation.
- [react-native-localize](https://github.com/zoontek/react-native-localize) to get device locale info.
- [react-native-mmkv-storage](https://github.com/ammarahm-ed/react-native-mmkv-storage#readme) as storage solution.
- [redux](https://redux.js.org/) for state management.
- [redux-persist](https://github.com/rt2zz/redux-persist) as persistance layer.
- [redux-thunk](https://github.com/gaearon/redux-thunk) to dispatch asynchronous actions.
- [jest](https://facebook.github.io/jest/) and [react-native-testing-library](https://callstack.github.io/react-native-testing-library/) for testing.
- [eslint](https://eslint.org/) and [eslint-plugin-react-native](https://github.com/intellicode/eslint-plugin-react-native) for linting.

---

## 🧑‍💻 Setting Up Dev Environment (iOS and Android)

### Make sure you have these installed on your system

- [Node.js &gt; 12](https://nodejs.org) - Recommended: Use [nvm](https://github.com/nvm-sh/nvm)
- [Yarn](https://www.npmjs.com/package/yarn)
- [Watchman](https://facebook.github.io/watchman)
- [Prettier Extension](https://prettier.io/) - Install this extension in your IDE (VSCode/Cursor etc.)

## 🍎 iOS Setup (Xcode on macOS)

### Prerequisites

- **[Xcode 26](https://developer.apple.com/xcode)**
- **CocoaPods**
- Ensure you have the latest **macOS**, **Xcode**, and **Simulator** installed.

#### In Terminal

1. Clone the repository and install packages
   ```bash
   git clone https://github.com/Focus-Bear/mobile-app.git
   cd mobile-app
   yarn
   ```

#### In Xcode

1. Open the project in Xcode:
   - Open `project_root/mobile-app/ios/FocusBear.xcworkspace`.
2. In **Signing & Capabilities** for `FocusBear`:
   - Update the **Team** field with your Apple developer account.
   - Update the **Bundle Identifier** by appending your name or any string to the current identifier (e.g., `com.FocusBear.development -> com.FocusBear.development.[YOUR_NAME]`).
3. Repeat the above steps for other packages such as `FocusShield` if needed.

#### ⚠️ Note on iOS Signing Issues

If the app fails to build after updating the **Team** or **Bundle Identifier** fields in Xcode, try running the project without modifying these settings.  
In some cases, the project is already configured with a working provisioning profile and changing these values may cause build or launch errors in the iOS simulator.

> Common errors include:
>
> - `Embedded binary's bundle identifier is not prefixed with the parent app's bundle identifier`
> - `No profiles for 'com.FocusBear.development.[NAME]' were found`

#### Notes:

- If you encounter build errors in dependency files, look for Xcode's **fix** link and click it.
- If you see the error: \"error: An organization slug is required (provide with --org)\", this is a Sentry-related issue. Create a file named `ios/sentry.properties` with the following content (ask a developer for the values):

  ```bash
  defaults.url=
  defaults.org=
  defaults.project=
  auth.token=
  ```

  Alternatively, you can rename this file to `.sentryclirc` and place it in the top-level folder of the project.

You should now be able to build and run the app in the emulator via Xcode.

For additional steps on Testflight upload, follow [this link](https://docs.google.com/document/d/10FDMiUJIvblJxUgu_Z2Gt-_F-BeCjenzZQwZleCHYhY/edit?usp=sharing).

## 💚 Android Setup

### Prerequisites

- JDK > 11 ([Orcale JDK](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html) or [Microsoft OpenJDK](https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-11))
- [Android Studio and Android SDK](https://developer.android.com/studio)
- Ensure `JAVA_HOME` is correctly set and pointing to the JDK.
- Ensure `ANDROID_HOME` is set and pointing to the Android SDK.

#### Setup

1. Clone the repository and install packages:
   ```bash
   git clone https://github.com/Focus-Bear/mobile-app.git
   cd mobile-app
   yarn
   ```

#### Building and running the App

2. Ensure the Android emulator is open, or a device (with USB/WiFi debugging) is connected
3. Run the following command to build and launch the app:
   ```bash
   yarn android
   ```

#### Running the app without rebuilding

If you've already got a build installed and there's no new packages/assets/config changes: you can rebundle updated code without having to rebuild the app comletely.

1. Open the app on the emulator/device
2. Start the dev server
   ```bash
   adb reverse tcp:8081 tcp:8081 # Expose the 8081 port
   yarn start # Start Metro bundler
   ```
3. Press **`r`** in Metro to reload the app

### Android Windows Users

#### Enable Long Path Support (Required)

On Windows, file paths are limited to 260 characters by default. React Native projects with deep `node_modules` paths (e.g., packages like `react-native-keyboard-controller`) can exceed this limit, causing CMake build errors. Enabling long path support before building resolves the issue.

**Steps:**

1. **Open PowerShell as Administrator** (Right-click PowerShell → "Run as Administrator")

2. **Enable long path support:**

   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

3. **Restart your computer** (required for the change to take effect)

4. **Verify it's enabled** (optional):
   ```powershell
   Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled"
   ```
   Should return `LongPathsEnabled : 1`

#### Upgrade Ninja Binary

Older Android SDK versions bundle a version of Ninja that predates Windows long path support. Upgrading to **Ninja v1.12.0 or later** resolves this, as it adds support for paths beyond the 260-character `MAX_PATH` limit.

**Steps:**

1. Download the latest Ninja binary from [ninja-build/ninja releases](https://github.com/ninja-build/ninja/releases).

2. Extract the zip and locate `ninja.exe`.

3. Back up the existing binary in your CMake toolchain directory by renaming it (e.g., `ninja.exe` → `ninja.exe.old`):

   ```
   %LOCALAPPDATA%\Android\Sdk\cmake<cmake_version>\bin\
   ```

4. Replace the old binary with the newly downloaded `ninja.exe`.

<details>

<summary><h3>Android Linux Users</h3></summary>

- Since Most Linux Distros Ship With there own version of Java JDK Make Sure The Correct Version Of Java is Installed and is the Default version selected for your ENV.
- To Check Current Java Version:
  ```
  java -version
  ```
- To Install Correct Java Version (In-This case Version 17):

  #### Ubuntu/Debian

      sudo apt install java-17-openjdk java-17-openjdk-devel

  #### Fedora RPM

      sudo dnf install java-17-openjdk java-17-openjdk-devel

  #### Arch Linux

      sudo pacman -S jdk17-openjdk

  #### openSUSE

      sudo zypper install java-17-openjdk java-17-openjdk-devel

- Set The Default Java Version:

      sudo alternatives --config java

      Select the path for Java 17 from the list that appears.

- Clear Gradle Cache

  ```
  rm -rf ~/.gradle/caches
  ```

- Rebuild the Project
  ```
  cd android
  ./gradlew clean
  cd ..
  yarn android
  ```

</details>

## Release Process for iOS & Android

The release process covers how to prepare, build, and deploy production-ready versions of FocusBear to the App Store (iOS) and Google Play Store (Android).

### iOS Release Process

[Watch the iOS release process video](https://drive.google.com/file/d/1d_sbssoxRfRuswzDHHBmbLlSXSH7AhW9/view)

### Android Release Process

[Watch the Android release process video](https://drive.google.com/file/d/1Ss45JZHd7mr51kbJ8hkSNa7-63MQiNNB/view)

---

## TIPS FOR NEW DEVELOPERS

### Architecture of the App

A new user will be navigated to the Onboarding Navigator stack, and go through each screens in the onboarding folder, until after AllDone screen they will be navigated to the App Navigator stack, which includes a TabNavigator(Home, Focus, Help, Settings) and other screens. If you're unsure which screen you are at, maybe think about how you navigated from a TabNavigator screen to current screen, and read in the code based on that. Some screens can be wrapped inside a folder, so that some components and the style file can be split out.

### How to commit my work

1. For each issue, create a new branch from `develop`, and work on the new branch. (Make sure you give a proper name to the branch!)
2. When you're ready for feedback or finished, you can create a Pull Request to merge your branch into `develop`.
3. Update your branch based on the feedback, until your PR is approved.
4. If there is a Merge Conflict in your PR, you need to pull `develop` into your branch, solve the conflicts, commit and push.
5. You can leave the branch after PR, no need to delete it.
6. Switch back to `develop`(pull to refresh if needed), create another branch for a new issue.

Some common mistakes:

- `console.log()`. You can use it for debugging but remember to remove them before commit.
- For unused imports, variables, functions, remove instead of comment out.
- Forgot to lcoalize strings.

### How to locate the implementation of a component?

- Press `d` in Metro, click show element inspecter on your phone/emulator and click on the UI element to see which component rendered it.
- A more hacky way: If you're really lost, search on the text in en.js and find its localization key, then search on the key to find where that key is used, e.g. search `t("my_string`.

---

## Steps to build apk and aab

#### Pre-Build

1. Increment versionCode value in android/app/build.gradle - this may done automatically by a github action, but if that's not available it needs to be done manually
2. Make sure sentry.properties is in android/ and enter the environment value
3. Perform mini smoke test locally (signup/onboarding & login)

#### APK Build

4.1 Run `./script/android-build-script.sh --local-apk`

#### AAB Build (for internal testing and production release)

4.2 Run `./script/android-build-script.sh`

4.3 Access https://play.google.com/console and upload it to internal test

#### Post-Build

8. apply this naming convention to the apk file: {OS*name}*{version}({build_number}).apk e.g. android_1.0.9(14).apk

this section by Bao (baohogia1508@gmail.com) 5 Nov 24

## Using Cursor for development

Quick tutorial: https://www.youtube.com/watch?v=ocMOZpuAMw4

Notes & Best Practices (How I use it):

Don’t rely on AI to come up with the full solution. It might work sometimes, but over-reliance will hinder your growth as an engineer. Always think through the problem, plan your approach, and then use Cursor to assist not replace your thinking.

Always review the code carefully.

Use it for boilerplate and repetitive tasks.

Ask it to explain code or errors.

Leverage it for refactoring and documentation. Cursor can help rename variables, extract functions, or even generate doc and comments.

Stay curious and skeptical. If something feels off, dig into it. Treat Cursor as a smart assistant not a source of absolute truth.

Advanced tips: https://www.youtube.com/watch?v=azXNHRtzd5s
