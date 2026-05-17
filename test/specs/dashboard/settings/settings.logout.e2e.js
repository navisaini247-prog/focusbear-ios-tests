import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Logout Flow', () => {
  async function isVisible(selector) {
    return await $(selector).isDisplayed().catch(() => false)
  }

  async function returnToDashboardIfNeeded() {
    const homeTab = '~test:id/home-tab'
    const backButton = '~test:id/header-back-button'

    if (await isVisible(homeTab)) {
      return
    }

    if (await isVisible(backButton)) {
      await $(backButton).click()
      await driver.pause(1000)
    }

    await $(homeTab).waitForDisplayed({ timeout: 20000 })
  }

  it('should logout successfully from account settings', async () => {
    await loginToDashboard()

    // If login accidentally opens Permissions or another screen, go back to dashboard first
    await returnToDashboardIfNeeded()

    // Open Settings
    await openSettings()

    // Open Account
    const accountButton = await $('~test:id/settings-quick-action-Account')
    await accountButton.waitForDisplayed({ timeout: 20000 })
    await accountButton.click()

    // Logout option
    const logoutOption = await $('~ Logout ')
    await logoutOption.waitForDisplayed({ timeout: 15000 })
    await logoutOption.click()

    // Logout confirmation popup
    const confirmLogout = await $('~Logout')
    await confirmLogout.waitForDisplayed({ timeout: 10000 })
    await confirmLogout.click()

    // Verify welcome screen appears
    const welcomeScreen = await $('~test:id/junior-bear-top-content-greeting_intro')
    await welcomeScreen.waitForDisplayed({ timeout: 25000 })

    await expect(welcomeScreen).toBeDisplayed()
  })
})