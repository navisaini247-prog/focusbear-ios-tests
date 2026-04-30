import AppScreen from './AppScreen';
import AndroidSettings from './AndroidSettings';
import HomeScreen from '../screenobjects/HomeScreen';

const androidViewClass = "android.widget.TextView"
const androidEditTextClass = "android.widget.EditText"
const androidButtonClass = "android.widget.Button"
const defaultTimeOut = 10000;
class LoginScreen extends AppScreen {
    constructor () {
        super('android=new UiSelector().className("android.widget.TextView").text("Welcome aboard!")');
    }

    private get signInButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Sign In');}
    private get signUpButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Sign up');}
    private get signUpWithEmailButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Sign Up with Email');}
    private get signInWithEmailButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Sign In with Email');}
    private get emailInput () {return AndroidSettings.findAndroidElementByClassAndText(androidEditTextClass, 'Email Address');}
    private get passwordInput () {return AndroidSettings.findAndroidElementByClassAndText(androidEditTextClass, 'Password');}
    private get tnCCheckbox () {return $('//android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[3]');}
    private get invalidEmailPanel () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Please enter valid email');}
    private get blankPasswordPanel () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Please enter password');}
    private get okButton () {return AndroidSettings.findAndroidElementByClassAndText(androidButtonClass, 'OK');}
    private get goalScreen () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'What are your goals?');}
    private get helpMeDevelopCheckbox () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Help me develop healthy habits.');}
    private get helpMeStayFocusedCheckbox () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Help me stay focused during the day.');}
    private get selectAHabitPackTitle () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Select a Habit Pack');}
    private get rightArrowInHabitButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, '');}
    private get leftArrowInHabitButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, '');}
    private get nextButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Next');}
    private get setStartupTimeTitle () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Set Startup Time');}
    private get setShutdownTitle () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Set Shutdown Time');}
    private get cancelPermissionButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Cancel');}
    private get alreadyExistUserPopup () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'The user already exists.');}
    private get reminderToTakeBreaksTxt () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Do you want to get reminders to take breaks on your phone?');}
    private get howOftenTakeBreaksTxt () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'How often do you want to take breaks?');}
    private get subTakeBreaksTxt () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, '(Optometrists recommend taking a break every 20 minutes to rest your eyes)');}
    private get defaultTimeTxt () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Time: 20 mins');}
    private get takeBreaksSliderTrack () {return $('//android.view.ViewGroup[@resource-id = "RNE__Slider_Track_maximum"]');}
    private get loadingCircleEle () {return $('//android.widget.ProgressBar');}
    private get yesButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Yes');}
    private get noButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'No');}
    private get grantAccessButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Grant Access');}
    private get usageAccessTitle () {return AndroidSettings.findAndroidElementByText('Usage access');}
    private get appBearTxt () {return AndroidSettings.findAndroidElementByText('Focus Bear');}
    private get permitUsageAccessTxt () {return AndroidSettings.findAndroidElementByText('Permit Usage access');}
    private get displayOverOtherApps () {return AndroidSettings.findAndroidElementByText('Display over other apps');}
    private get allowDisplayOverOtherApps () {return AndroidSettings.findAndroidElementByText('allow display over other apps');}
    private get acceptTermsAndConditionsMsg () {return AndroidSettings.findAndroidElementByText('Please accept terms and conditions by clicking on checkbox');}
    private get weakPasswordMsg () {return AndroidSettings.findAndroidElementByText(`Password must be 8 characters in length.`);}
    private get habitOptions () {return ["Break Activities Only", "Starter Habit Pack", "Focus Bear Habit Pack", "Yoga Habit Pack by Emily Hughes", "Lauren Watson Habit Pack",
    "Fly Lady Inspired Habit Pack", "No Movement Habit Pack"];}
    private get chooseSafeAppsButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Choose Safe Apps');}
    private get allDoneTitle () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'All Done!');}
    private get continueButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Continue');}

    async verifyAllDoneVisible(){
        await (await this.allDoneTitle).waitForDisplayed({ timeout: 10000 });
        expect(await (await this.allDoneTitle).isDisplayed()).toBeTruthy();
    } 

    async tapOnContinueButton(){
        await (await this.continueButton).waitForDisplayed({ timeout: 10000 });
        await (await this.continueButton).click();
    } 

    async tapOnChooseSafeAppsButton(){
        await (await this.chooseSafeAppsButton).waitForDisplayed({ timeout: 10000 });
        await (await this.chooseSafeAppsButton).click();
    } 

    async tapOnLoginContainerButton(){
        await (await this.signInButton).click();
    }

    async tapOnSignUpButton(){
        await (await this.signUpButton).click();
    }

    async waitForLoadingCircleComplete(time = 1000){
        await driver.pause(time);
        for(let i = 0; i<5; i++) {
            if(await (await this.loadingCircleEle).isDisplayed()){
                await driver.pause(time);
            }else {
                break;
            }
        }
    }

    async tapOnSignUpWithEmailButton(){
        await (await this.signUpWithEmailButton).click();
    }

    async tapOnSignInWithEmailButton(){
        await (await this.signInWithEmailButton).click();
    }

    async tapOnSignInButton(){
        await (await this.signInButton).click();
        await driver.pause(500)
    }

    async inputEmail(email: string){
        await (await this.emailInput).setValue(email);
    }

    async inputPassword(password: string){
        await (await this.passwordInput).setValue(password);
    }

    async checkTnc(){
        await (await this.tnCCheckbox).click();
    }

    async verifyInvalidEmailMessageVisible(){
        expect(await (await this.invalidEmailPanel).isDisplayed()).toBeTruthy();
    }

    async verifyInvalidEmailMessageDisappear(){
        expect(await (await this.invalidEmailPanel).isDisplayed()).toBeFalsy();
    }

    async verifyBlankPasswordMessageVisible(){
        await (await this.blankPasswordPanel).waitForDisplayed({ timeout: defaultTimeOut });
        expect(await (await this.blankPasswordPanel).isDisplayed()).toBeTruthy();
    }

    async verifyBlankPasswordMessageDisappear(){
         expect(await (await this.blankPasswordPanel).isDisplayed()).toBeFalsy();
    }
   
    async tapOnOkButton(){
        await (await this.okButton).click();
    } 

    async waitForNextButton(){
        await (await this.nextButton).waitForDisplayed({ timeout: defaultTimeOut});
    }

    async verifyGoalScreenIsDisplayed(){
        await (await this.goalScreen).waitForDisplayed({ timeout: defaultTimeOut});
    }

    async verifyHelpMeDevelopHabitsChkVisible(){
        await (await this.helpMeDevelopCheckbox).waitForDisplayed({ timeout: defaultTimeOut});
    }

    async verifyHelpMeStayFocusedChkVisible(){
        await (await this.helpMeStayFocusedCheckbox).waitForDisplayed({ timeout: defaultTimeOut});
    }

    async verifySelectAHabitPackTitleVisible(){
        console.log('"Select a habit pack" should visible')
        await (await this.selectAHabitPackTitle).waitForDisplayed({ timeout: defaultTimeOut});
        expect(await (await this.selectAHabitPackTitle).isDisplayed()).toBeTruthy();
    }

    async verifySetStartupTimeTitleTitleVisible(){
        console.log('"StartupTime" should visible')
        await (await this.setStartupTimeTitle).waitForDisplayed({ timeout: defaultTimeOut});
        expect(await (await this.setStartupTimeTitle).isDisplayed()).toBeTruthy();
    }

    async verifySetShutdownTimeTitleTitleVisible(){
        console.log('"Shutdown Time" should visible')
        expect(await (await this.setShutdownTitle).isDisplayed()).toBeTruthy();
    }

    async tapOnNextButton(){
        await (await this.nextButton).click();
    }

    async tapOnRightArrowInHabit(){
        await (await this.rightArrowInHabitButton).click();
    }

    async tapOnCancelPermission(){
        await (await this.cancelPermissionButton).click();
        await driver.pause(500)
    }

    async selectAHabitByIndex(num: Number) {
        for (const [index, item] of this.habitOptions.entries()) {
            const optHabit = item;
            console.log(`"${item}" should visible`)
            await (await $(`//${androidViewClass}[contains(@text, "${optHabit}")]`)).waitForDisplayed({ timeout: defaultTimeOut});
            expect(await(await $(`//${androidViewClass}[contains(@text, "${optHabit}")]`)).isDisplayed()).toBeTruthy();
            if(item !== this.habitOptions[this.habitOptions.length - 1]) {
                await (await this.rightArrowInHabitButton).click();
                await driver.pause(500)
            }
            if(num = Number(index) - 1) {
                break;
            }
        }
    }

    async verifyAllHabitContainTexts() {
        for (const item of this.habitOptions) {
            const optHabit = item;
            console.log(`"${item}" should visible`)
            await (await $(`//${androidViewClass}[contains(@text, "${optHabit}")]`)).waitForDisplayed({ timeout: defaultTimeOut});
            expect(await(await $(`//${androidViewClass}[contains(@text, "${optHabit}")]`)).isDisplayed()).toBeTruthy();
            if(item !== this.habitOptions[this.habitOptions.length - 1]) {
                await (await this.rightArrowInHabitButton).click();
                await driver.pause(500)
            }
        }
    }

    async verifyAllHabitContainTextsWhenRevert() {
        const reversedArray = this.habitOptions.reverse();
        for (const item of reversedArray) {
            const optHabit = item;
            console.log(`"${item}" should visible`)
            await (await $(`//${androidViewClass}[contains(@text, "${optHabit}")]`)).waitForDisplayed({ timeout: defaultTimeOut});
            expect(await(await $(`//${androidViewClass}[contains(@text, "${optHabit}")]`)).isDisplayed()).toBeTruthy();
            if(item !== reversedArray[reversedArray.length - 1]) {
                await (await this.leftArrowInHabitButton).click();
                await driver.pause(500)
            }
        }
    }

    async verifyTheUserAlreadyExist() {
        await (await this.alreadyExistUserPopup).waitForDisplayed({ timeout: defaultTimeOut});
    } 

    async verifyReminderToTakeBreakPage() {
        await (await this.reminderToTakeBreaksTxt).waitForDisplayed({ timeout: defaultTimeOut});
    } 

    async verifyTakeBreaksPage() {
        await (await this.howOftenTakeBreaksTxt).waitForDisplayed({ timeout: defaultTimeOut});
        expect(await (await this.howOftenTakeBreaksTxt).isDisplayed()).toBeTruthy();
        expect(await (await this.subTakeBreaksTxt).isDisplayed()).toBeTruthy();
        expect(await (await this.defaultTimeTxt).isDisplayed()).toBeTruthy();
        expect(await (await this.takeBreaksSliderTrack).isDisplayed()).toBeTruthy();
    } 

    async tapOnNoInTakeBreaksPage() {
        await (await this.noButton).click();
    }

    async tapOnYesInTakeBreaksPage() {
        await (await this.yesButton).click();
    }

    async tapOnGrantAccessButton() {
        await (await this.grantAccessButton).click();
    }

    async tapOnGrantAccessButtonIfExist(times = 6) {
        for (let i = 0; i < times; i++){
            if(await (await this.grantAccessButton).isDisplayed()){   
                await (await this.grantAccessButton).click();
                await this.permitUsageAccess();
                await this.tapOnGrantAccessButton();
                await this.permitDisplayOtherOverApps();
                await HomeScreen.verifyBlockDistractionsNotVisible();
                break;
            }
            await driver.pause(1000);
        }
    }

    async verifyUsageAccessScreen() {
        await (await this.usageAccessTitle).isDisplayed();
    }

    async tapOnFocusBearTxt() {
        await (await this.appBearTxt).click();
    }

    async tapOnPermitUsageAccess() {
        await (await this.permitUsageAccessTxt).click();
    }

    async permitUsageAccess() {
        await this.verifyUsageAccessScreen()
        await this.tapOnFocusBearTxt()
        await this.tapOnPermitUsageAccess()
        await driver.back();
        await driver.back();
    }

    async permitDisplayOtherOverApps() {
        await (await this.displayOverOtherApps).isDisplayed();
        await (await this.appBearTxt).click();
        await (await this.allowDisplayOverOtherApps).click();
        await driver.back();
        await driver.back();
    }

    async tapOnCancelIfHavingGrantAccess(times = 6) {
        for (let i = 0; i < times; i++){
            if(await (await this.grantAccessButton).isDisplayed()){
                await this.tapOnCancelPermission();
                break;
            }
            await driver.pause(1000);
        }
    }

    async tapOnAllowIfHavingGrantNoti(times = 6) {
        const allowButtonLocator =
        'new UiSelector().className("android.widget.Button").text("Allow")';
        for (let i = 0; i < times; i++){
            if(await (await $(`android=${allowButtonLocator}`)).isDisplayed()){   
                await (await $(`android=${allowButtonLocator}`)).click();
                break; 
            }
            await driver.pause(1000);
        }
    }

    async slideToMaximumTakeBreaks() {
        const slider = await driver.$('//android.view.ViewGroup[@resource-id = "RNE__Slider_Track_maximum"]')
        const { x, y } = await slider.getLocation();
        const size = await slider.getSize();
        await driver.touchAction([
          { action: 'press', x: x + 1, y },
          { action: 'moveTo', x: x + size.width - 1, y },
          'release',
        ]);        
    }

    async slideToMinimumTakeBreaks() {
        const slider = await driver.$('//android.view.ViewGroup[@resource-id = "RNE__Slider_Track_maximum"]')
        const { x, y } = await slider.getLocation();
        const size = await slider.getSize();
        await driver.touchAction([
            { action: 'press', x: x + size.width - 1, y },
            { action: 'moveTo', x: x + 1, y },
            'release',
        ]);      
    }

    async verifyTermsAndConditionsMessage() {
        await (await this.acceptTermsAndConditionsMsg).waitForDisplayed({ timeout: defaultTimeOut })
        expect(await (await this.acceptTermsAndConditionsMsg).isDisplayed()).toBeTruthy()
    }

    async verifyWeakPasswordMessage() {
        await (await this.weakPasswordMsg).waitForDisplayed({ timeout: defaultTimeOut })
        expect(await (await this.weakPasswordMsg).isDisplayed()).toBeTruthy()
    }
}

export default new LoginScreen();
