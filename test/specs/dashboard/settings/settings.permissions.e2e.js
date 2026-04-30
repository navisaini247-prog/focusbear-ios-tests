import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Permissions', () => {
  it('should open permissions screen', async () => {
    await loginToDashboard()
    await openSettings()

    await $('~test:id/settings-permissions').click()

    await $('~ Permissions').waitForDisplayed({ timeout: 15000 })

    await expect($('~ Permissions')).toBeDisplayed()
    await expect($('~ Screen Time Permission Not granted ')).toBeDisplayed()
    await expect($('~ Notification Permission Allowed ')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})