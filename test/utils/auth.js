export async function loginToDashboard() {
  // If already on dashboard, skip login
  const homeTab = await $('~test:id/home-tab')

  if (await homeTab.isExisting().catch(() => false)) {
    return
  }

  // Otherwise continue onboarding/login flow
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
  await acceptButton.click()

  const alreadyHaveAccount = await $('~test:id/already-have-account')
  await alreadyHaveAccount.waitForDisplayed({ timeout: 15000 })
  await alreadyHaveAccount.click()

  const startWithEmail = await $('~test:id/start-with-email')
  await startWithEmail.waitForDisplayed({ timeout: 15000 })
  await startWithEmail.click()

  await $('~test:id/email').setValue('testuser@focusbear.com')
  await $('~test:id/password').setValue('Test@1234')

  await $('~test:id/log-in').click()

  // Wait for dashboard
  await homeTab.waitForDisplayed({ timeout: 20000 })
}