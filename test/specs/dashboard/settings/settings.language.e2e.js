import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Language', () => {
  it('should open language screen and show language options', async () => {
    await loginToDashboard()
    await openSettings()

    await $('~ Language English ').click()

    await $('~ Language').waitForDisplayed({ timeout: 15000 })

    await expect($('~Use system language (English)')).toBeDisplayed()
    await expect($('~Deutsch')).toBeDisplayed()
    await expect($('~English ')).toBeDisplayed()
    await expect($('~Español')).toBeDisplayed()
    await expect($('~日本語')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})