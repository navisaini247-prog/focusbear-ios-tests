import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Settings Screen', () => {
  it('should open settings screen and show key settings options', async () => {
    await loginToDashboard()

    await $('~test:id/settings-tab').click()

    await $('~test:id/bearsona-settings-button').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/bearsona-settings-button')).toBeDisplayed()
    await expect($('~Verify email ')).toBeDisplayed()
    await expect($('~test:id/settings-quick-action-Help')).toBeDisplayed()
    await expect($('~test:id/settings-quick-action-Account')).toBeDisplayed()
    await expect($('~test:id/settings-blocking-schedule')).toBeDisplayed()
    await expect($('~test:id/settings-edit-friction')).toBeDisplayed()
    await expect($('~test:id/settings-permissions')).toBeDisplayed()

    await driver.execute('mobile: scroll', { direction: 'down' })

    await expect($('~test:id/settings-dark-mode-toggle')).toBeDisplayed()
    await expect($('~test:id/open-focus-game')).toBeDisplayed()
    await expect($('~ Privacy Policy ')).toBeDisplayed()
    await expect($('~ Terms and Conditions ')).toBeDisplayed()
  })
})