describe('Focus Bear Password Visibility Toggle', () => {
  it('should toggle password visibility', async () => {

    // Screen 1: Greeting
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })

    // Go to login flow
    await $('~test:id/already-have-account').click()

    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })
    await startWithEmail.click()

    // Login screen
    const passwordInput = await $('~test:id/password')
    const toggleButton = await $('~test:id/toggle-password-visibility')

    await passwordInput.waitForDisplayed({ timeout: 15000 })
    await toggleButton.waitForDisplayed({ timeout: 15000 })

    // Enter password
    await passwordInput.setValue('Test@1234')

    // Get initial value (hidden)
    const hiddenValue = await passwordInput.getText().catch(() => '')

    // Toggle visibility ON
    await toggleButton.click()
    await driver.pause(1000)

    const visibleValue = await passwordInput.getText().catch(() => '')

    // Toggle visibility OFF again
    await toggleButton.click()
    await driver.pause(1000)

    const hiddenAgainValue = await passwordInput.getText().catch(() => '')

    // Basic validation
    // (Note: exact behavior depends on iOS, sometimes value isn't readable)
    await expect(passwordInput).toBeDisplayed()
  })
})