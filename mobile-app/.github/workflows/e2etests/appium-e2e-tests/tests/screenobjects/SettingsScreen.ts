import AppScreen from './AppScreen';
import AndroidSettings from './AndroidSettings';
import { ANDROID_CLASS_VIEW_CLASS, ANDOID_EDIT_TEXT_CLASS } from '../helpers/Constants'
class SettingsScreen extends AppScreen {
    constructor () {
        super('android=new UiSelector().className("android.widget.TextView").text("Welcome aboard!")');
    }
    private get manageBlocklistsBtn () {return AndroidSettings.findAndroidElementByClassAndText(ANDROID_CLASS_VIEW_CLASS, 'Manage Blocklists');}

    async tapOnManageBlocklistsBtn(){
        await (await this.manageBlocklistsBtn).waitForDisplayed({ timeout: 10000 });
        await (await this.manageBlocklistsBtn).click();
    }
}
export default new SettingsScreen();
