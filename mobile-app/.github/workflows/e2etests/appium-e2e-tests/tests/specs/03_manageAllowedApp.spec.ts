import LoginScreen from '../screenobjects/LoginScreen';
import HomeScreen from '../screenobjects/HomeScreen';
import SettingsScreen from '../screenobjects/SettingsScreen';
import FocusScreen from '../screenobjects/FocusScreen';
import ManageBlockListScreen from '../screenobjects/ManageBlockListScreen';


describe('Bear Project - Manage allowed app', () => {
    beforeEach(async () => {
        await driver.launchApp();
    });
    afterAll(async () => {
        await driver.closeApp();
    });
    
    it('Should able to see the blocked when restricting an app', async () => {
        const userName = "INTERNALTEST+AUTOMATE";
        const email = `${userName}@focusbear.io`;
        const defaultPassword = 'Abcd123!@#';
        const intention = "I'm focusing now"
        await LoginScreen.tapOnSignUpButton();
        await LoginScreen.tapOnSignInButton();
        await LoginScreen.tapOnSignInWithEmailButton();
        await LoginScreen.inputEmail(email);
        await LoginScreen.inputPassword(defaultPassword);
        await LoginScreen.tapOnSignInButton();
        await LoginScreen.tapOnAllowIfHavingGrantNoti();
        await LoginScreen.tapOnGrantAccessButtonIfExist();
        await HomeScreen.verifyUserNameInWelcomeScreen(userName);
        await HomeScreen.tapOnSettingsButton();
        await SettingsScreen.tapOnManageBlocklistsBtn();
        await ManageBlockListScreen.tapOnManageAllowedAppBtn();
        await ManageBlockListScreen.waitForManageAllowedAppScreenVisible();
        await LoginScreen.waitForLoadingCircleComplete();
        await ManageBlockListScreen.removeAllAllowedApp(); 
        await driver.pressKeyCode(4)
        await driver.pressKeyCode(4)
        await HomeScreen.tapOnHabitsButton();
        await LoginScreen.waitForLoadingCircleComplete();
        await HomeScreen.tapOnFocusButton();
        await FocusScreen.inputIntention(intention);
        await FocusScreen.tapOnStartFocus()
        await FocusScreen.waitForFocusSessionStart()
        await driver.activateApp("com.google.android.calendar");
        await LoginScreen.waitForLoadingCircleComplete(2000);
        await FocusScreen.verifyTheTextNotVisible("Google Calendar")
    });

    it('Should not able to see the blocked when allowing an app', async () => {
        const userName = "INTERNALTEST+AUTOMATE";
        const email = `${userName}@focusbear.io`;
        const defaultPassword = 'Abcd123!@#';
        const intention = "I'm focusing now"
        await LoginScreen.tapOnSignUpButton();
        await LoginScreen.tapOnSignInButton();
        await LoginScreen.tapOnSignInWithEmailButton();
        await LoginScreen.inputEmail(email);
        await LoginScreen.inputPassword(defaultPassword);
        await LoginScreen.tapOnSignInButton();
        await LoginScreen.tapOnAllowIfHavingGrantNoti();
        await LoginScreen.tapOnGrantAccessButtonIfExist();
        await HomeScreen.verifyUserNameInWelcomeScreen(userName);
        await HomeScreen.tapOnSettingsButton();
        await SettingsScreen.tapOnManageBlocklistsBtn();
        await ManageBlockListScreen.tapOnManageAllowedAppBtn();
        await ManageBlockListScreen.waitForManageAllowedAppScreenVisible();
        await ManageBlockListScreen.removeAllAllowedApp(); 
        await ManageBlockListScreen.tapOnCalendarAppTile();
        await LoginScreen.waitForLoadingCircleComplete(1000);
        await ManageBlockListScreen.verifyNumAllowedApp(1);    
        await driver.pressKeyCode(4);
        await driver.pressKeyCode(4);
        await HomeScreen.tapOnHabitsButton();
        await LoginScreen.waitForLoadingCircleComplete();
        await HomeScreen.tapOnFocusButton();
        await FocusScreen.inputIntention(intention);
        await FocusScreen.tapOnStartFocus();
        await FocusScreen.waitForFocusSessionStart();
        await driver.activateApp("com.google.android.calendar");
        await LoginScreen.waitForLoadingCircleComplete(2000);
        await FocusScreen.verifyTheTextVisible("Google Calendar");
    });

});
