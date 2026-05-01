describe('Focus Bear Forgot Password Flow', () => {
  async function clearAndType(selector, value) {
    const field = await $(selector)

    await field.waitForDisplayed({ timeout: 15000 })
    await field.click()
    await driver.pause(300)

    await field.clearValue().catch(() => {})
    await field.setValue('')
    await driver.pause(300)

    for (const char of value) {
      await driver.keys(char)
      await driver.pause(80)
    }
  }

  async function tapIfVisible(selector) {
    const element = await $(selector)

    if (await element.isDisplayed().catch(() => false)) {
      await element.click()
      await driver.pause(500)
      return true
    }

    return false
  }

  it('should open forgot password screen and request password reset', async () => {
    // Start from welcome screen
    const greeting = await $('~test:id/junior-bear-top-content-greeting_intro')
    await greeting.waitForDisplayed({ timeout: 15000 })

    // Go to login options
    const alreadyHaveAccount = await $('~test:id/already-have-account')
    await alreadyHaveAccount.waitForDisplayed({ timeout: 15000 })
    await alreadyHaveAccount.click()

    // Go to email login screen
    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })
    await startWithEmail.click()

    // Wait for email login screen
    const emailInput = await $('~test:id/email')
    await emailInput.waitForDisplayed({ timeout: 15000 })

    // Open forgot password screen
    const forgotPassword = await $('~Forgot Password?')
    await forgotPassword.waitForDisplayed({ timeout: 15000 })
    await forgotPassword.click()

    // Verify forgot password screen
    const resetPassword = await $('~test:id/reset-password')
    await resetPassword.waitForDisplayed({ timeout: 15000 })

    const forgotEmailInput = await $('~test:id/email')
    await expect(forgotEmailInput).toBeDisplayed()
    await expect(resetPassword).toBeDisplayed()
    await expect($('~Back To Sign In')).toBeDisplayed()

    // Enter reset email safely
    await clearAndType('~test:id/email', 'testuser@focusbear.com')

    // Submit reset request
    await resetPassword.click()

    // Optional confirmation handling if app shows one
    await tapIfVisible('~OK')
    await tapIfVisible('~Close')
  })
})