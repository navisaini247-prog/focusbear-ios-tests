describe('Focus Bear Invalid Login Flow', () => {

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

  it('should show validation error for invalid email login', async () => {

    // If already logged in → reset app (important for negative test)
    const homeTab = await $('~test:id/home-tab')
    if (await homeTab.isExisting().catch(() => false)) {
      await driver.reset()
    }

    // Start flow
    await $('~test:id/junior-bear-top-content-greeting_intro')
      .waitForDisplayed({ timeout: 15000 })

    await $('~test:id/already-have-account').click()

    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })
    await startWithEmail.click()

    // Enter invalid credentials (stable typing)
    await clearAndType('~test:id/email', 'wronguser')
    await clearAndType('~test:id/password', 'Wrong@1234')

    await $('~test:id/log-in').click()

    // Sometimes popup/overlay appears → handle safely
    await tapSafeArea()

    // Validate error message
    const errorPopup = await $('~Please enter valid email')
    await errorPopup.waitForDisplayed({ timeout: 10000 })

    await expect(errorPopup).toBeDisplayed()
  })
})