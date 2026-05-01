describe('Focus Bear Empty Login Validation', () => {

  async function clearField(selector) {
    const field = await $(selector)

    await field.waitForDisplayed({ timeout: 15000 })
    await field.click()
    await driver.pause(300)

    await field.clearValue().catch(() => {})
    await field.setValue('')
    await driver.pause(300)
  }

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

  async function tapSafeArea() {
    const screen = await driver.getWindowRect()

    await driver.execute('mobile: tap', {
      x: Math.floor(screen.width * 0.5),
      y: Math.floor(screen.height * 0.4),
    })

    await driver.pause(800)
  }

  it('should show error when email is empty', async () => {

    // If already logged in → reset app
    const homeTab = await $('~test:id/home-tab')
    if (await homeTab.isExisting().catch(() => false)) {
      await driver.reset()
    }

    // Start flow
    const greeting = await $('~test:id/junior-bear-top-content-greeting_intro')
    await greeting.waitForDisplayed({ timeout: 15000 })

    await $('~test:id/already-have-account').click()

    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })
    await startWithEmail.click()

    // Wait for login screen
    const emailInput = await $('~test:id/email')
    const passwordInput = await $('~test:id/password')

    await emailInput.waitForDisplayed({ timeout: 15000 })
    await passwordInput.waitForDisplayed({ timeout: 15000 })

    // Ensure email is completely empty
    await clearField('~test:id/email')

    // Enter password safely
    await clearAndType('~test:id/password', 'Test@1234')

    // Tap login
    const loginBtn = await $('~test:id/log-in')
    await loginBtn.waitForDisplayed({ timeout: 15000 })
    await loginBtn.click()

    // Handle overlay if it blocks popup
    await tapSafeArea()

    // Validate error popup
    const errorPopup = await $('~Please enter email')
    await errorPopup.waitForDisplayed({ timeout: 10000 })

    await expect(errorPopup).toBeDisplayed()
  })
})