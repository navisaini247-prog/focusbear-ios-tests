import { loginToDashboard } from '../../utils/auth.js'

describe('Focus Bear Dashboard Focus Session', () => {
  it('should open start focus session from dashboard', async () => {
    await loginToDashboard()

    const startFocusSession = await $('~test:id/focus-mode-card-new-session')
    await startFocusSession.waitForDisplayed({ timeout: 15000 })
    await startFocusSession.click()

    await driver.pause(3000)

    await expect($('~test:id/focus-tab')).toBeDisplayed()
  })
})