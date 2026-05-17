import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Schedule Edit', () => {
  it('should open blocking schedule screen and verify schedule UI', async () => {
    await loginToDashboard()
    await openSettings()

    const blockingSchedule = await $('~test:id/settings-blocking-schedule')
    await blockingSchedule.waitForDisplayed({ timeout: 20000 })
    await blockingSchedule.click()

    const scheduleHeader = await $('~ Blocking Schedule')
    await scheduleHeader.waitForDisplayed({ timeout: 15000 })

    await expect(scheduleHeader).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()

    // Verify screen loaded correctly
    const permissionMessage = await $('~ Screen Time Permission Not granted ')
    await expect(permissionMessage).toBeDisplayed()
  })
})