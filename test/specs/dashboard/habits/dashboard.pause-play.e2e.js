import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Pause/Play Habit Test', () => {
  it('should pause and resume a running habit', async () => {
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
    const pausePlayButton = await $('~test:id/pause-play-habit')
    await pausePlayButton.waitForDisplayed({ timeout: 15000 })

    // Pause
    await pausePlayButton.click()
    await driver.pause(1000)

    // Play again
    await pausePlayButton.click()
    await driver.pause(1000)

    await expect(pausePlayButton).toBeDisplayed()
  })
})