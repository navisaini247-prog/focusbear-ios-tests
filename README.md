# trigger ci
#  Focus Bear iOS Automation (Appium + WebdriverIO)

##  Overview
This project demonstrates an end-to-end mobile automation framework for the **Focus Bear iOS application** using Appium and WebdriverIO.

The goal was to simulate real user behavior and build **stable, reliable test automation** despite dynamic UI elements and unpredictable overlays.

---

## Tech Stack
- **Appium (XCUITest)**
- **WebdriverIO (Mocha)**
- **iOS Simulator**
- **JavaScript (Node.js)**
- **GitHub Actions (CI/CD)**
- **Allure Reporting**

---

## Test Coverage

###  Authentication
- Login (success)
- Login (invalid credentials)
- Login (empty fields)
- Forgot password
- Password visibility toggle

###  Core App Flows
- Dashboard validation
- Habit activity flow
- Focus session (start + end)

###  Validation Testing
- Signup password validation (weak password rules)

---

##  Key Challenges Solved

### 1. Dynamic UI Overlays
- Handled popups and tooltips using conditional logic
- Implemented safe screen tap strategies

### 2. Flaky Input Handling
- Built custom typing helpers to avoid incorrect input
- Ensured reliable field clearing

### 3. Unpredictable UI State
- Managed expanded/collapsed components dynamically
- Avoided blind clicks using visibility checks

### 4. Stability Across Runs
- Reduced reliance on static waits
- Used conditional waits and reusable utilities

---

##  CI/CD Integration

- GitHub Actions pipeline configured
- Smoke tests run automatically on push
- Full test suite available via manual trigger

---

## Test Reporting

- Integrated **Allure Reports**
- Includes:
  - Pass/fail status
  - Test steps
  - Screenshots on failure

---

## ▶How to Run Tests

```bash
npm install
npx wdio run ./wdio.conf.js