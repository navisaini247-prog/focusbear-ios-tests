import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Friction', () => {
  it('should open friction settings screen', async () => {
    await loginToDashboard()
    await openSettings()

    await $('~test:id/settings-edit-friction').click()

    await $('~ Friction').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/friction-radio-really-easy')).toBeDisplayed()
    await expect($('~test:id/friction-radio-hard-to-skip')).toBeDisplayed()
    await expect($('~test:id/save-friction-settings')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})