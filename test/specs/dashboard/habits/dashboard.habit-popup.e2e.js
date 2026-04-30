import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Habit Popup Functional Test', () => {
  it('should expand evening routine and open activity popup', async () => {
    await loginToDashboard()

    // 👉 Step 1: Go to Habits tab FIRST
    await $('~test:id/home-tab-habit').click()

    // 👉 Step 2: Now wait for evening routine
    const eveningRoutine = await $('~test:id/routine-evening')
    await eveningRoutine.waitForDisplayed({ timeout: 15000 })

    await eveningRoutine.click()

    // 👉 Step 3: Open activity
    const activity = await $('~test:id/activity-2')
    await activity.waitForDisplayed({ timeout: 15000 })
    await activity.click()

    // 👉 Step 4: Verify popup
    await $('~test:id/start-activity').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/start-activity')).toBeDisplayed()
    await expect($('~test:id/skip-activity')).toBeDisplayed()
    await expect($('~test:id/edit-activity')).toBeDisplayed()
    await expect($('~test:id/delete-activity')).toBeDisplayed()
  })
})