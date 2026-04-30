import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Activity Back Navigation', () => {
  it('should return to dashboard from activity screen', async () => {
    await loginToDashboard()

    // Go to Habits
    await $('~test:id/home-tab').click()
    await $('~test:id/home-tab-habit').click()

    // Expand Evening
    await $('~test:id/routine-morning').click()
    await driver.execute('mobile: scroll', { direction: 'down' })

    const eveningRoutine = await $('~test:id/routine-evening')
    await eveningRoutine.waitForExist({ timeout: 15000 })
    await eveningRoutine.click()

    // Start activity
    const activity = await $('~test:id/activity-2')
    await activity.waitForDisplayed({ timeout: 15000 })
    await activity.click()

    const startActivity = await $('~test:id/start-activity')
    await startActivity.waitForDisplayed({ timeout: 15000 })
    await startActivity.click()

    // Wait for activity screen
    const backButton = await $('~test:id/header-back-button')
    await backButton.waitForDisplayed({ timeout: 15000 })

    // Go back
    await backButton.click()

    // Verify dashboard / habits screen
    await $('~test:id/home-tab-habit').waitForDisplayed({ timeout: 15000 })
    await expect($('~test:id/home-tab-habit')).toBeDisplayed()
  })
})