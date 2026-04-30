describe('Focus Bear Empty Login Validation', () => {
  it('should show error when email is empty', async () => {

    // Screen 1: Greeting
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })

    // Go to login flow
    await $('~test:id/already-have-account').click()

    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })
    await startWithEmail.click()

    // Login screen
    const emailInput = await $('~test:id/email')
    const passwordInput = await $('~test:id/password')

    await emailInput.waitForDisplayed({ timeout: 15000 })
    await passwordInput.waitForDisplayed({ timeout: 15000 })

    // Leave email EMPTY, only enter password
    await passwordInput.setValue('Test@1234')

    // Tap login
    await $('~test:id/log-in').click()

    // Validate error popup
    const errorPopup = await $('~Please enter email')
    await errorPopup.waitForDisplayed({ timeout: 10000 })

    await expect(errorPopup).toBeDisplayed()
  })
})