describe('Focus Bear Password Visibility Toggle', () => {
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

  it('should toggle password visibility', async () => {
    const homeTab = await $('~test:id/home-tab')
    if (await homeTab.isExisting().catch(() => false)) {
      await driver.reset()
    }

    const greeting = await $('~test:id/junior-bear-top-content-greeting_intro')
    await greeting.waitForDisplayed({ timeout: 15000 })

    const alreadyHaveAccount = await $('~test:id/already-have-account')
    await alreadyHaveAccount.waitForDisplayed({ timeout: 15000 })
    await alreadyHaveAccount.click()

    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })
    await startWithEmail.click()

    const passwordInput = await $('~test:id/password')
    const toggleButton = await $('~test:id/toggle-password-visibility')

    await passwordInput.waitForDisplayed({ timeout: 15000 })
    await toggleButton.waitForDisplayed({ timeout: 15000 })

    await clearAndType('~test:id/password', 'Test@1234')

    await toggleButton.click()
    await driver.pause(700)

    await expect(passwordInput).toBeDisplayed()
    await expect(toggleButton).toBeDisplayed()

    await toggleButton.click()
    await driver.pause(700)

    await expect(passwordInput).toBeDisplayed()
    await expect(toggleButton).toBeDisplayed()
  })
})