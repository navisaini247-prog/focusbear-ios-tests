import LoginScreen from '../screenobjects/LoginScreen';
import HomeScreen from '../screenobjects/HomeScreen';

describe('Bear Project - Login', () => {
    it('Should be able login successfully', async () => {
        const userName = "INTERNALTEST+AUTOMATE";
        const email = `${userName}@focusbear.io`;
        const defaultPassword = 'Abcd123!@#'
        await LoginScreen.tapOnSignUpButton();
        await LoginScreen.tapOnSignInButton();
        await LoginScreen.tapOnSignInWithEmailButton();
        await LoginScreen.inputEmail(email);
        await LoginScreen.inputPassword(defaultPassword);
        await LoginScreen.tapOnSignInButton();
        await LoginScreen.tapOnAllowIfHavingGrantNoti();
        await LoginScreen.tapOnCancelIfHavingGrantAccess();
        await HomeScreen.verifyUserNameInWelcomeScreen(userName);
    });

});
