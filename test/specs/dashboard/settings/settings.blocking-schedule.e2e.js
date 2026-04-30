import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Blocking Schedule', () => {
  it('should open blocking schedule screen', async () => {
    await loginToDashboard()
    await openSettings()

    const blockingSchedule = await $('~test:id/settings-blocking-schedule')
    await blockingSchedule.waitForDisplayed({ timeout: 20000 })
    await blockingSchedule.click()

    await $('~ Blocking Schedule').waitForDisplayed({ timeout: 15000 })

    await expect($('~ Blocking Schedule')).toBeDisplayed()
    await expect($('~ Screen Time Permission Not granted ')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})