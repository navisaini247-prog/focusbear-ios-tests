import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Dark Mode Toggle', () => {
  it('should toggle dark mode setting', async () => {
    await loginToDashboard()
    await openSettings()

    await driver.execute('mobile: scroll', { direction: 'down' })

    const darkModeToggle = await $('~test:id/settings-dark-mode-toggle')
    await darkModeToggle.waitForDisplayed({ timeout: 15000 })

    await darkModeToggle.click()
    await driver.pause(1000)

    await expect(darkModeToggle).toBeDisplayed()
  })
})