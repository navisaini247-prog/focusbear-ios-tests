import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Privacy Policy', () => {
  it('should open privacy policy screen', async () => {
    await loginToDashboard()
    await openSettings()

    await driver.execute('mobile: scroll', { direction: 'down' })

    await $('~ Privacy Policy ').waitForDisplayed({ timeout: 15000 })
    await $('~ Privacy Policy ').click()

    await $('~Privacy Policy | Focus Bear').waitForDisplayed({ timeout: 20000 })

    await expect($('~Privacy Policy | Focus Bear')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})