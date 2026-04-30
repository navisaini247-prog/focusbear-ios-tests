import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Skip Habit Functional Test', () => {
  it('should show skip reason popup for a running habit', async () => {
    await loginToDashboard()

    await $('~test:id/home-tab').click()
    await $('~test:id/home-tab-habit').click()

    const morningRoutine = await $('~test:id/routine-morning')
    await morningRoutine.waitForDisplayed({ timeout: 15000 })
    await morningRoutine.click()

    await driver.execute('mobile: scroll', { direction: 'down' })

    const eveningRoutine = await $('~test:id/routine-evening')
    await eveningRoutine.waitForExist({ timeout: 15000 })
    await eveningRoutine.click()

    const activity = await $('~test:id/activity-2')
    await activity.waitForDisplayed({ timeout: 15000 })
    await activity.click()

    const startActivity = await $('~test:id/start-activity')
    await startActivity.waitForDisplayed({ timeout: 15000 })
    await startActivity.click()

    const pausePlayButton = await $('~test:id/pause-play-habit')
    await pausePlayButton.waitForDisplayed({ timeout: 15000 })

    await pausePlayButton.click()
    await driver.pause(1000)

    const skipHabit = await $('~test:id/skip-habit')
    await skipHabit.waitForDisplayed({ timeout: 15000 })
    await skipHabit.click()

    await $('~test:id/already-did-activity').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/already-did-activity')).toBeDisplayed()
    await expect($('~test:id/cannot-do-activity')).toBeDisplayed()
    await expect($('~test:id/modal-cancel')).toBeDisplayed()
  })
})