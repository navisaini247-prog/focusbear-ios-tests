import LoginScreen from '../screenobjects/LoginScreen';
import HomeScreen from '../screenobjects/HomeScreen';
import FocusScreen from '../screenobjects/FocusScreen';

describe('Bear Project - Focus', () => {
    it('Should able to see the blocked popup', async () => {
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
        await HomeScreen.tapOnFocusButton();
        await FocusScreen.inputIntention(intention);
        await FocusScreen.tapOnStartFocus()
        await FocusScreen.waitForFocusSessionStart()
        await driver.activateApp("com.android.chrome");
        await driver.pause(2000)
        await FocusScreen.verifyTheTextNotVisible("Chrome")
    });

});
