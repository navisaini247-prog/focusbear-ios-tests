import LoginScreen from '../screenobjects/LoginScreen';
import HomeScreen from '../screenobjects/HomeScreen';
import ManageBlockListScreen from '../screenobjects/ManageBlockListScreen';

describe('Bear Project - Signup', () => {
  const defaultPassword = 'Abcd123!@#';
  beforeEach(async () => {
      await driver.launchApp();
  });

  afterAll(async () => {
    await driver.closeApp();
    await driver.removeApp('com.focusbear');
  });

  it('Should be able register successfully - select minimum time in the Take breaks', async () => {
    const userName = `INTERNALTEST+${
        Math.floor(Math.random() * 10000000) + 1
      }`
    const email = `${userName}@focusbear.io`;
    ;
    const habit = "Starter Habit Pack habit"
    await LoginScreen.tapOnSignUpButton();
    await LoginScreen.tapOnSignUpWithEmailButton();
    await LoginScreen.inputEmail(email);
    await LoginScreen.inputPassword(defaultPassword);
    await LoginScreen.checkTnc();
    await LoginScreen.tapOnSignUpButton();
    await LoginScreen.waitForLoadingCircleComplete();
    await LoginScreen.tapOnAllowIfHavingGrantNoti();
    await LoginScreen.verifyGoalScreenIsDisplayed();
    await LoginScreen.verifyHelpMeDevelopHabitsChkVisible();
    await LoginScreen.verifyHelpMeStayFocusedChkVisible();
    await LoginScreen.tapOnNextButton();
    await LoginScreen.verifySelectAHabitPackTitleVisible();
    await LoginScreen.selectAHabitByIndex(1);
    await LoginScreen.tapOnNextButton();
    await LoginScreen.verifySetStartupTimeTitleTitleVisible();
    await LoginScreen.tapOnNextButton();
    await LoginScreen.verifySetShutdownTimeTitleTitleVisible();
    await LoginScreen.tapOnNextButton();
    await LoginScreen.verifyReminderToTakeBreakPage();
    await LoginScreen.tapOnYesInTakeBreaksPage();
    await LoginScreen.verifyTakeBreaksPage();
    await LoginScreen.slideToMinimumTakeBreaks();
    await LoginScreen.tapOnNextButton();
    await LoginScreen.tapOnChooseSafeAppsButton();
    await ManageBlockListScreen.verifyNumAllowedApp(0);
    await ManageBlockListScreen.tapOnCompleteBtn();
    await LoginScreen.verifyAllDoneVisible();
    await LoginScreen.tapOnContinueButton();
    await LoginScreen.tapOnCancelIfHavingGrantAccess();
    await LoginScreen.tapOnCancelIfHavingGrantAccess(2);
    await HomeScreen.verifyUserNameInWelcomeScreen(userName);
  });
});
