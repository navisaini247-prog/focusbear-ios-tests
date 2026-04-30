describe('Focus Bear Invalid Login Flow', () => {
  it('should show validation error for invalid email login', async () => {
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })

    await $('~test:id/already-have-account').click()

    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })
    await startWithEmail.click()

    const emailInput = await $('~test:id/email')
    const passwordInput = await $('~test:id/password')

    await emailInput.waitForDisplayed({ timeout: 15000 })
    await passwordInput.waitForDisplayed({ timeout: 15000 })

    await emailInput.setValue('wronguser')
    await passwordInput.setValue('Wrong@1234')

    await $('~test:id/log-in').click()

    const errorPopup = await $('~Please enter valid email')
    await errorPopup.waitForDisplayed({ timeout: 10000 })

    await expect(errorPopup).toBeDisplayed()
  })
})