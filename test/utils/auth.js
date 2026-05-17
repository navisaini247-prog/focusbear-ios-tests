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

  await driver.pause(1000)
}

async function dismissDashboardPopupIfPresent() {
  const homeTab = await $('~test:id/home-tab')
  const permissionHeader = await $('~ Permissions')
  const backButton = await $('~test:id/header-back-button')

  // Dashboard already visible
  if (await homeTab.isDisplayed().catch(() => false)) {
    return
  }

  // Tap once only
  await tapUpperScreen()

  // If permission screen opened accidentally
  if (await permissionHeader.isDisplayed().catch(() => false)) {
    if (await backButton.isDisplayed().catch(() => false)) {
      await backButton.click()
      await driver.pause(1000)
    }
  }
}

export async function loginToDashboard() {
  const homeTab = await $('~test:id/home-tab')

  // Already logged in
  if (await homeTab.isExisting().catch(() => false)) {
    await dismissDashboardPopupIfPresent()
    return
  }

  // Greeting screen
  const introButton = await $('~test:id/bear-onboarding-primary')
  await introButton.waitForDisplayed({ timeout: 15000 })
  await introButton.click()

  // ADHD Story
  const adhdOption = await $('~test:id/junior-bear-secondary-adhd_story')
  await adhdOption.waitForDisplayed({ timeout: 15000 })
  await adhdOption.click()

  // Team Invite
  const nextButton = await $('~test:id/bear-onboarding-primary')
  await nextButton.waitForDisplayed({ timeout: 15000 })
  await nextButton.click()

  // Signup decision
  const signupButton = await $('~test:id/bear-onboarding-primary')
  await signupButton.waitForDisplayed({ timeout: 15000 })
  await signupButton.click()

  // Terms
  const agreeTerms = await $('~test:id/agree-terms')
  await agreeTerms.waitForDisplayed({ timeout: 15000 })
  await agreeTerms.click()

  // Privacy
  const acceptButton = await $('~test:id/accept-privacy-notice')
  await acceptButton.waitForDisplayed({ timeout: 15000 })
  await acceptButton.click()

  // Already have account
  const alreadyHaveAccount = await $('~test:id/already-have-account')
  await alreadyHaveAccount.waitForDisplayed({ timeout: 15000 })
  await alreadyHaveAccount.click()

  // Start with email
  const startWithEmail = await $('~test:id/start-with-email')
  await startWithEmail.waitForDisplayed({ timeout: 15000 })
  await startWithEmail.click()

  // Enter credentials safely
  await clearAndType('~test:id/email', 'testuser@focusbear.com')
  await clearAndType('~test:id/password', 'Test@1234')

  // Login
  const loginButton = await $('~test:id/log-in')
  await loginButton.waitForDisplayed({ timeout: 15000 })

  await driver.pause(500)
  await loginButton.click()

  // Wait for dashboard
  try {
    await homeTab.waitForDisplayed({ timeout: 25000 })
  } catch (e) {
    await dismissDashboardPopupIfPresent()
    await homeTab.waitForDisplayed({ timeout: 20000 })
  }

  // Final safe popup handling
  await dismissDashboardPopupIfPresent()
}