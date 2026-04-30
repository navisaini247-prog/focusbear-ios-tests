import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Meeting Reminders', () => {
  it('should open meeting reminders screen', async () => {
    await loginToDashboard()
    await openSettings()

    const meetingReminders = await $('~ Meeting Reminders ')
    await meetingReminders.waitForDisplayed({ timeout: 15000 })
    await meetingReminders.click()

    await $('~test:id/late-no-more-calendar-permission').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/late-no-more-calendar-permission')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})