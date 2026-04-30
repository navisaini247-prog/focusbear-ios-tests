## iOS Native Modules

- `ControlView`: This view contains a table containing the details of blocked apps, categories & webDomains.
- `BlockListView`: This view contains the list of apps, categories & webdomains. Which when selected is blocked from opening.

## iOS Native Methods

- `ControlFunction`
  - `startBlockingDistractingApps()`: This method starts monitoring.
  - `stopBlockingDistractingApps()`: This method stops monitoring.
  - `selectApps()`: This method brings the FamilyActivityPicker on top of swift's controlView.
  - `shouldViewDisable(callback)`: This method emits whether anything is disabled or not.

## Important notes

- The selectApps() method should only be paired with ControlView, as it brings FamilyActivityPicker as bottom sheet on top of the ControlView.

- When using BlockListView, after selection of apps... startBlockingDistractingApps() can be called to setup 12hrs time and a lot more!

- All the required modlues(ControlView & BlockListView) and methods (ControlFunction) are exposed in 'src/utils/NativeModuleMethods.js'.

- A sample usage of native view is applied on 'src/screens/Home/Home.js'.
