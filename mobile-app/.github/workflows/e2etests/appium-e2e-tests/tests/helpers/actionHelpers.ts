class ActionHelper {
  static async launchBrowserUrl(urlToLaunch: string): Promise<void> {
    await browser.url(urlToLaunch);
  }

  static getTitle(): Promise<string> {
    return browser.getTitle();
  }

  static async launchApp(): Promise<void> {
    await driver.launchApp();
  }

  static async closeApp(): Promise<void> {
    await driver.closeApp();
  }

  static backgroundApp(): void {
    driver.pressKeyCode(3);
  }

  static async switchToNativeContext(): Promise<void> {
    await browser.switchContext("NATIVE_APP");
  }

  static async pause(seconds: number): Promise<void> {
    await browser.pause(seconds * 1000);
  }

  static async isVisible(locator: string): Promise<boolean> {
    return (await (await browser.$(locator)).isDisplayed()) ? true : false;
  }

  static async pressKeyCode(value: number): Promise<void> {
    await driver.pressKeyCode(value);
  }

  static async click(locator: string): Promise<void> {
    await browser.$(locator).click();
    await this.pause(0.5);
  }

  static randomNumber(length: number) {
    return Math.random().toString().slice(2, 12).repeat(1000).slice(0, length);
  }
}

export default ActionHelper;
