import AppScreen from './AppScreen';
import AndroidSettings from './AndroidSettings';

const androidViewClass = "android.widget.TextView"
class HomeScreen extends AppScreen {
    constructor () {
        super('android=new UiSelector().className("android.widget.TextView").text("Welcome aboard!")');
    }
    private get blockDistractionsButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Block distractions');}
    private get focusButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Focus');}    
    private get habitsButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Habits');}    
    private get focusButton2 () {return $("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.view.ViewGroup[2]/android.view.View/android.view.View[2]/android.view.ViewGroup/android.widget.ImageView");}    
    private get settingButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Settings');}    
    private get welcomeTitle () {return AndroidSettings.findAndroidElementByText( 'HI ');}    
    private get chromeApp () {return $(`//android.widget.TextView[@content-desc="Chrome"]`);}

    async tapOnHabitsButton(){
        await (await this.habitsButton).waitForDisplayed({ timeout: 10000 });
        await (await this.habitsButton).click();
    }

    async tapOnFocusButton(){
        await (await this.focusButton).waitForDisplayed({ timeout: 10000 });
        await (await this.focusButton).click();
    }

    async tapOnSettingsButton(){
        await (await this.settingButton).waitForDisplayed({ timeout: 10000 });
        await (await this.settingButton).click();
    }

    async tapOnChromeApp(){
        await (await this.chromeApp).click();
    }

    async verifyBlockDistractionsVisible(){
        expect(await (await this.blockDistractionsButton).isDisplayed()).toBeTruthy();
    }

    async verifyBlockDistractionsNotVisible(){
        expect(await (await this.blockDistractionsButton).isDisplayed()).toBeFalsy();
    }

    async verifyUserNameInWelcomeScreen(name: string){
        const userName = name.toUpperCase()
        console.log(userName)
        await (await this.welcomeTitle).waitForDisplayed({ timeout: 10000 });
        expect(await (await this.welcomeTitle).getAttribute('text')).toContain(`${name}`);
    }
}

export default new HomeScreen();
