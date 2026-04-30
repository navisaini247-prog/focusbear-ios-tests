#!/bin/bash

# Step 1: Ensure sentry.properties is in android/
check_sentry_properties() {
  echo "Checking for sentry.properties..."
  if [ ! -f "android/sentry.properties" ]; then
    echo "Error: sentry.properties not found in android/ directory."
    exit 1
  fi
  echo "sentry.properties is present."
}

# Step 2: Create required directories
create_directories() {
  echo "Creating required directories..."
  mkdir -p android/app/src/main/assets
  mkdir -p android/app/src/main/res_temp
}

# Step 3: Bundle the React Native app
bundle_app() {
  yarn
  echo "Bundling the React Native app..."
  npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res_temp
}

# Step 4: Build the Android app
build_android_app() {
  local build_type=$1

  echo "Building the Android app with $build_type..."
  cd android

  if [ "$build_type" = "local-apk" ]; then
    ./gradlew assembleRelease
  else
    ./gradlew bundleRelease
  fi
}

# Check for --local-apk option
build_type="bundle"
if [[ "$@" == *"--local-apk"* ]]; then
  build_type="local-apk"
fi

check_sentry_properties
create_directories
bundle_app
build_android_app "$build_type"

echo "Build process completed successfully."

if [ "$build_type" = "local-apk" ]; then
  echo "Check folder android/app/build/outputs/apk for apk file."
else
  echo "Check folder android/app/build/outputs/bundle for the AAB file."
fi
