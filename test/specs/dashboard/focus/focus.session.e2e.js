import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Focus Session Flow', () => {
  async function tapIfVisible(selector, timeout = 3000) {
    const element = await $(selector)

    if (await element.waitForDisplayed({ timeout }).catch(() => false)) {
      await element.click()
      await driver.pause(700)
      return true
    }

    return false
  }

  async function tapSafeArea() {
    const screen = await driver.getWindowRect()

    await driver.execute('mobile: tap', {
      x: Math.floor(screen.width * 0.5),
      y: Math.floor(screen.height * 0.35),
    })

    await driver.pause(1000)
  }

  async function dismissEndOverlayIfPresent() {
    await tapSafeArea()

    await tapIfVisible('~OK', 2000)
    await tapIfVisible('~Close', 2000)
    await tapIfVisible('~Done', 2000)
  }

  it('should start focus session without intention and end it', async () => {
    await loginToDashboard()

    await tapSafeArea()

    const focusTab = await $('~test:id/focus-tab')
    await focusTab.waitForDisplayed({ timeout: 20000 })
    await focusTab.click()

    const startFocusing = await $('~test:id/start-focusing')
    await startFocusing.waitForDisplayed({ timeout: 20000 })
    await startFocusing.click()

    await tapIfVisible('~test:id/modal-cancel', 5000)

    const focusMusicButton = await $('~test:id/focus-music-button')
    await focusMusicButton.waitForDisplayed({ timeout: 20000 })

    await expect(focusMusicButton).toBeDisplayed()
    await expect($('~test:id/focus-notes-button')).toBeDisplayed()

    const endSession = await $('~End Session')
    await endSession.waitForDisplayed({ timeout: 15000 })
    await endSession.click()

    const confirmEnd = await $('~test:id/confirm-end-focus-mode')
    await confirmEnd.waitForDisplayed({ timeout: 15000 })

    const needBreakReason = await $('~test:id/end-reason-NEED_BREAK')
    await needBreakReason.waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/end-reason-FOCUS_MODE_BUG')).toBeDisplayed()
    await expect(needBreakReason).toBeDisplayed()
    await expect($('~test:id/end-reason-EMERGENCY')).toBeDisplayed()

    await needBreakReason.click()
    await driver.pause(500)

    await confirmEnd.click()
    await driver.pause(2000)

    // Final overlay sometimes appears after ending session.
    // Tap once to dismiss it, then pass if we are no longer on the active session screen.
    await dismissEndOverlayIfPresent()

    const pausePlay = await $('~test:id/pause-play-habit')
    const stillInSession = await pausePlay.isDisplayed().catch(() => false)

    expect(stillInSession).toBe(false)
  })
})