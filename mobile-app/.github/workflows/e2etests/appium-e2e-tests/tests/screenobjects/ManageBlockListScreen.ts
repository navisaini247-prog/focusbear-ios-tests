import AppScreen from './AppScreen';
import AndroidSettings from './AndroidSettings';
import { ANDROID_CLASS_VIEW_CLASS, ANDOID_EDIT_TEXT_CLASS } from '../helpers/Constants'
class ManageBlockListScreen extends AppScreen {
    constructor () {
        super('android=new UiSelector().className("android.widget.TextView").text("Welcome aboard!")');
    }
    private get manageAllowAppBtn() {return AndroidSettings.findAndroidElementByClassAndText(ANDROID_CLASS_VIEW_CLASS, 'Manage Always Allowed Apps');}
    private get calendarAppTitle() {return AndroidSettings.findAndroidElementByClassAndText(ANDROID_CLASS_VIEW_CLASS, 'Calendar');}
    private get completeBtn() {return AndroidSettings.findAndroidElementByClassAndText(ANDROID_CLASS_VIEW_CLASS, 'Complete');}
    private get allowedAppTiltle() {return AndroidSettings.findAndroidElementByText('Allowed Apps (');}
    private get allowedAppSymbol() {{return $$("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.view.ViewGroup[1]/android.widget.FrameLayout/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup[3]/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[2]/android.view.ViewGroup/android.widget.ImageView[2]");}}

    async removeAllAllowedApp() {
        let num = (await this.allowedAppSymbol).length;
        for (let i = 0; i<num; i++) {
            await (await this.allowedAppSymbol)[0].click();
            await driver.pause(1000)
            if((await this.allowedAppSymbol).length >= 1) {
                i--;
            }
        } 
    }

    async tapOnCompleteBtn(){
        await (await this.completeBtn).waitForDisplayed({ timeout: 10000 });
        await (await this.completeBtn).click();
    }

    async waitForManageAllowedAppScreenVisible(time =  10000){
        await (await this.allowedAppTiltle).waitForDisplayed({ timeout: time });
        await driver.pause(2000);
    }

    async tapOnManageAllowedAppBtn(){
        await (await this.manageAllowAppBtn).waitForDisplayed({ timeout: 10000 });
        await (await this.manageAllowAppBtn).click();
    }

    async verifyNumAllowedApp(num = 0){
        await (await this.allowedAppTiltle).waitForDisplayed({ timeout: 10000 });    
        expect(await (await this.allowedAppTiltle).getAttribute('text')).toContain(`${num})`);
    }

    async tapOnCalendarAppTile(){
        await (await this.calendarAppTitle).waitForDisplayed({ timeout: 10000 });
        await (await this.calendarAppTitle).click();
    }
}
export default new ManageBlockListScreen();
