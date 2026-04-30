import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Terms and Conditions', () => {
  it('should open terms and conditions screen', async () => {
    await loginToDashboard()
    await openSettings()

    await driver.execute('mobile: scroll', { direction: 'down' })

    await $('~ Terms and Conditions ').waitForDisplayed({ timeout: 15000 })
    await $('~ Terms and Conditions ').click()

    await $('~Terms of Service | Focus Bear').waitForDisplayed({ timeout: 20000 })

    await expect($('~Terms of Service | Focus Bear')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})