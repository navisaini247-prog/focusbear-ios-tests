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

async function tapUpperScreen() {
  const screen = await driver.getWindowRect()

  await driver.execute('mobile: tap', {
    x: Math.floor(screen.width * 0.5),
    y: Math.floor(screen.height * 0.25),
  })

  await driver.pause(800)
}

async function dismissDashboardPopup() {
  await tapUpperScreen()
  await tapUpperScreen()
}

export async function loginToDashboard() {
  const homeTab = await $('~test:id/home-tab')

  // If already logged in / dashboard visible, skip login
  if (await homeTab.isExisting().catch(() => false)) {
    await dismissDashboardPopup()
    return
  }

  // Onboarding flow
  const introButton = await $('~test:id/bear-onboarding-primary')
  await introButton.waitForDisplayed({ timeout: 15000 })
  await introButton.click()

  const adhdOption = await $('~test:id/junior-bear-secondary-adhd_story')
  await adhdOption.waitForDisplayed({ timeout: 15000 })
  await adhdOption.click()

  const nextButton = await $('~test:id/bear-onboarding-primary')
  await nextButton.waitForDisplayed({ timeout: 15000 })
  await nextButton.click()

  const signupButton = await $('~test:id/bear-onboarding-primary')
  await signupButton.waitForDisplayed({ timeout: 15000 })
  await signupButton.click()

  const agreeTerms = await $('~test:id/agree-terms')
  await agreeTerms.waitForDisplayed({ timeout: 15000 })
  await agreeTerms.click()

  const acceptButton = await $('~test:id/accept-privacy-notice')
  await acceptButton.waitForDisplayed({ timeout: 15000 })
  await acceptButton.click()

  const alreadyHaveAccount = await $('~test:id/already-have-account')
  await alreadyHaveAccount.waitForDisplayed({ timeout: 15000 })
  await alreadyHaveAccount.click()

  const startWithEmail = await $('~test:id/start-with-email')
  await startWithEmail.waitForDisplayed({ timeout: 15000 })
  await startWithEmail.click()

  await clearAndType('~test:id/email', 'testuser@focusbear.com')
  await clearAndType('~test:id/password', 'Test@1234')

  const loginButton = await $('~test:id/log-in')
  await loginButton.waitForDisplayed({ timeout: 15000 })

  await driver.pause(500)
  await loginButton.click()

  // Wait for dashboard, then dismiss any popup/overlay
  try {
    await homeTab.waitForDisplayed({ timeout: 25000 })
  } catch (e) {
    await dismissDashboardPopup()
    await homeTab.waitForDisplayed({ timeout: 20000 })
  }

  await dismissDashboardPopup()
}