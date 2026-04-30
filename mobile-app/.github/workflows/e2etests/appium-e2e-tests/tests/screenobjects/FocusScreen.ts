import AppScreen from './AppScreen';
import AndroidSettings from './AndroidSettings';

const androidViewClass = "android.widget.TextView"
const androidEditTextClass = "android.widget.EditText"
class FocusScreen extends AppScreen {
    constructor () {
        super('android=new UiSelector().className("android.widget.TextView").text("Welcome aboard!")');
    }

    private get intentionTextField () {return AndroidSettings.findAndroidElementByClassAndText(androidEditTextClass, 'Entering an intention...');}
    private get startFocusButton () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, 'Start Focusing');}
    private get focusSessionStartMessage () {return AndroidSettings.findAndroidElementByClassAndText(androidViewClass, "DON’T LET ANY DISTRACTION STOP YOU");}
    private get layoutFrame () {return $('/hierarchy/android.widget.FrameLayout');}
    private get blockedTitle () {return AndroidSettings.findAndroidElementByText('Focus on your work');}
 
    async inputIntention(txt: string){
        await (await this.intentionTextField).waitForDisplayed({ timeout: 10000 });
        await (await this.intentionTextField).setValue(txt);
    }  

    async tapOnStartFocus(){
        await (await this.startFocusButton).click();
    } 

    async waitForFocusSessionStart(){
        await (await this.focusSessionStartMessage).waitForDisplayed({ timeout: 10000 });
        await driver.pause(1000);
    } 

    async waitForLayoutFrame(){
        await (await this.layoutFrame).waitForDisplayed({ timeout: 10000 });
    }     

    async waitForBlockedPopup(){
        await (await this.blockedTitle).waitForDisplayed({ timeout: 10000 });
    }

    async verifyTheTextNotVisible(txt: string){
        expect(await (await AndroidSettings.findAndroidElementByText(txt)).isDisplayed()).toBeFalsy();
    } 

    async verifyTheTextVisible(txt: string){
        expect(await (await AndroidSettings.findAndroidElementByText(txt)).isDisplayed()).toBeTruthy();
    } 
}

export default new FocusScreen();
