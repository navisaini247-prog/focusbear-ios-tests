import AndroidSettings from "./AndroidSettings";

export default class AppScreen {
    private selector: string;

    constructor (selector: string) {
        this.selector = selector;
    }

    /**
     * Wait for the login screen to be visible
     *
     * @param {boolean} isShown
     */
    async waitForIsShown (isShown = true): Promise<boolean | void> {
        return $(this.selector).waitForDisplayed({
            reverse: !isShown,
        });
    }

    async allowNotificationRequested() {
        const allowButtonLocator =
        'new UiSelector().className("android.widget.Button").text("Allow")';
        await (await $(`android=${allowButtonLocator}`)).click();    
    }

    async dontAllowNotificationRequested() {
        const allowButtonLocator =
        'new UiSelector().className("android.widget.Button").text("Don\'t allow")';
        await (await $(`android=${allowButtonLocator}`)).click();    
    }
}
