import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Focus Session Flow', () => {
  it('should start focus session without intention and end it', async () => {
    await loginToDashboard()

    const focusTab = await $('~test:id/focus-tab')
    await focusTab.waitForDisplayed({ timeout: 15000 })
    await focusTab.click()

    const startFocusing = await $('~test:id/start-focusing')
    await startFocusing.waitForDisplayed({ timeout: 20000 })
    await startFocusing.click()

    const continueWithoutBlocking = await $('~test:id/modal-cancel')

    if (await continueWithoutBlocking.waitForDisplayed({ timeout: 5000 }).catch(() => false)) {
      await continueWithoutBlocking.click()
    }

    await $('~test:id/focus-music-button').waitForDisplayed({ timeout: 20000 })

    await expect($('~test:id/focus-music-button')).toBeDisplayed()
    await expect($('~test:id/focus-notes-button')).toBeDisplayed()

    const endSession = await $('~End Session')
    await endSession.waitForDisplayed({ timeout: 15000 })
    await endSession.click()

    const confirmEnd = await $('~test:id/confirm-end-focus-mode')
    await confirmEnd.waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/end-reason-FOCUS_MODE_BUG')).toBeDisplayed()
    await expect($('~test:id/end-reason-NEED_BREAK')).toBeDisplayed()
    await expect($('~test:id/end-reason-EMERGENCY')).toBeDisplayed()

    await $('~test:id/end-reason-NEED_BREAK').click()
    await confirmEnd.click()
  })
})