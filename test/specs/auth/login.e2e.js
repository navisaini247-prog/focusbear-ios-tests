describe('Focus Bear Login Flow', () => {
  it('should login using email and password', async () => {

    // Screen 1: Greeting
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })

    // Go to login method screen
    await $('~test:id/already-have-account').click()

    // Login welcome screen
    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/apple-signin')).toBeDisplayed()
    await expect($('~test:id/start-with-email')).toBeDisplayed()

    // Go to email login
    await startWithEmail.click()

    // Email login screen
    const emailInput = await $('~test:id/email')
    const passwordInput = await $('~test:id/password')

    await emailInput.waitForDisplayed({ timeout: 15000 })
    await passwordInput.waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/log-in')).toBeDisplayed()

    // Enter credentials (with small pause to avoid flakiness)
    await emailInput.click()
    await emailInput.setValue('testuser@focusbear.com')

    await passwordInput.click()
    await passwordInput.setValue('Test@1234')

    // Tap login
    await $('~test:id/log-in').click()

    // Optional: wait for next screen (adjust later if needed)
    await driver.pause(3000)
  })
})