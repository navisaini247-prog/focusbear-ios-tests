import { loginToDashboard } from '../../../utils/auth.js'

describe('Start Morning Routine Activity', () => {

  async function clearOptionalTooltip() {
    const morningRoutine = await $('~test:id/routine-morning')

    // If already visible → no need to tap
    if (await morningRoutine.isDisplayed().catch(() => false)) {
      return
    }

    const screen = await driver.getWindowRect()

    // Single safe tap (avoid double taps!)
    await driver.execute('mobile: tap', {
      x: Math.floor(screen.width * 0.5),
      y: Math.floor(screen.height * 0.42),
    })

    await driver.pause(1000)
  }

  const topMorningActivities = [
    '~test:id/activity-1',
    '~test:id/activity-2',
    '~test:id/activity-3',
  ]

  async function findVisibleMorningActivity() {
    for (const selector of topMorningActivities) {
      const activity = await $(selector)
      if (await activity.isDisplayed().catch(() => false)) {
        console.log(`Selected activity: ${selector}`)
        return activity
      }
    }
    return null
  }

  it('should start one of the top three morning routine activities', async () => {
    await loginToDashboard()

    // Tap Habits (top tab)
    const habitsTab = await $('~test:id/home-tab-habit')
    await habitsTab.waitForDisplayed({ timeout: 20000 })
    await habitsTab.click()

    await driver.pause(1000)

    // Clear overlay if present
    await clearOptionalTooltip()

    // FIRST: check if activities already visible (morning already expanded)
    let selectedActivity = await findVisibleMorningActivity()

    // ONLY expand Morning if activities are not visible
    if (!selectedActivity) {
      const morningRoutine = await $('~test:id/routine-morning')
      await morningRoutine.waitForExist({ timeout: 15000 })
      await morningRoutine.click()

      await driver.pause(1000)

      selectedActivity = await findVisibleMorningActivity()
    }

    if (!selectedActivity) {
      throw new Error('None of the top three morning activities were visible')
    }

    await selectedActivity.click()

    // Start activity
    const startBtn = await $('~test:id/start-activity')
    await startBtn.waitForDisplayed({ timeout: 15000 })
    await startBtn.click()

    // Verify activity screen
    const pausePlay = await $('~test:id/pause-play-habit')
    await pausePlay.waitForDisplayed({ timeout: 15000 })

    await expect(pausePlay).toBeDisplayed()
    await expect($('~test:id/focus-music-button')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})