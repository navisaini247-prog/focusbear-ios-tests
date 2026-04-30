import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Start Activity Functional Test', () => {
  it('should start the Plan To-Do list habit from evening routine', async () => {
    await loginToDashboard()

    // Go to Home
    await $('~test:id/home-tab').click()

    // Go to Habits
    await $('~test:id/home-tab-habit').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/home-tab-habit').click()

    // Contract Morning
    const morningRoutine = await $('~test:id/routine-morning')
    await morningRoutine.waitForDisplayed({ timeout: 15000 })
    await morningRoutine.click()

    // Expand Evening
    const eveningRoutine = await $('~test:id/routine-evening')
await eveningRoutine.waitForExist({ timeout: 15000 })
await eveningRoutine.click()

    // Tap Plan To-Do activity
    const activity = await $('~test:id/activity-2')
    await activity.waitForDisplayed({ timeout: 15000 })
    await activity.click()

    // Tap Start
    const startActivity = await $('~test:id/start-activity')
    await startActivity.waitForDisplayed({ timeout: 15000 })
    await startActivity.click()

   // Verify habit activity screen
await $('~test:id/pause-play-habit').waitForDisplayed({ timeout: 15000 })

await expect($('~test:id/focus-music-button')).toBeDisplayed()
await expect($('~test:id/pause-play-habit')).toBeDisplayed()
await expect($('~test:id/header-back-button')).toBeDisplayed()
})
})