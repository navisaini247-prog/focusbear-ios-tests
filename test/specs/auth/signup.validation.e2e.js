describe('Focus Bear Signup Validation Flow', () => {
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

  async function tapIfVisible(selector) {
    const element = await $(selector)

    if (await element.isDisplayed().catch(() => false)) {
      await element.click()
      await driver.pause(500)
      return true
    }

    return false
  }

  it('should show validation when signup password is weak', async () => {
    const homeTab = await $('~test:id/home-tab')
    if (await homeTab.isExisting().catch(() => false)) {
      await driver.reset()
    }

    // Greeting screen
    const greeting = await $('~test:id/junior-bear-top-content-greeting_intro')
    await greeting.waitForDisplayed({ timeout: 15000 })

    const primaryButton = await $('~test:id/bear-onboarding-primary')
    await primaryButton.waitForDisplayed({ timeout: 15000 })
    await primaryButton.click()

    // ADHD story
    const adhdStory = await $('~test:id/junior-bear-top-content-adhd_story')
    await adhdStory.waitForDisplayed({ timeout: 15000 })

    const adhdOption = await $('~test:id/junior-bear-secondary-adhd_story')
    await adhdOption.waitForDisplayed({ timeout: 15000 })
    await adhdOption.click()

    // Team up invite
    const teamInvite = await $('~test:id/junior-bear-top-content-team_up_invite')
    await teamInvite.waitForDisplayed({ timeout: 15000 })

    const nextButton = await $('~test:id/bear-onboarding-primary')
    await nextButton.waitForDisplayed({ timeout: 15000 })
    await nextButton.click()

    // Signup decision
    const signupDecision = await $('~test:id/junior-bear-top-content-signup_decision')
    await signupDecision.waitForDisplayed({ timeout: 15000 })

    const signupPrimary = await $('~test:id/bear-onboarding-primary')
    await signupPrimary.waitForDisplayed({ timeout: 15000 })
    await signupPrimary.click()

    // Terms screen
    const agreeTerms = await $('~test:id/agree-terms')
    await agreeTerms.waitForDisplayed({ timeout: 15000 })
    await agreeTerms.click()

    const acceptPrivacy = await $('~test:id/accept-privacy-notice')
    await acceptPrivacy.waitForDisplayed({ timeout: 10000 })
    await acceptPrivacy.click()

    // Signup welcome
    const signupEmail = await $('~test:id/sign-up-with-email')
    await signupEmail.waitForDisplayed({ timeout: 15000 })
    await signupEmail.click()

    // Email signup screen
    const emailInput = await $('~test:id/email')
    const passwordInput = await $('~test:id/password')

    await emailInput.waitForDisplayed({ timeout: 15000 })
    await passwordInput.waitForDisplayed({ timeout: 15000 })

    await clearAndType('~test:id/email', `newuser${Date.now()}@focusbear.com`)
    await clearAndType('~test:id/password', 'test')

    const signUpButton = await $('~test:id/sign-up')
    await signUpButton.waitForDisplayed({ timeout: 15000 })
    await signUpButton.click()

    await tapIfVisible('~OK')
    await tapIfVisible('~Close')

    // Weak password rules should remain visible
    await expect($('~Min. 8 characters')).toBeDisplayed()
    await expect($('~Include numbers')).toBeDisplayed()
    await expect($('~Include uppercase')).toBeDisplayed()
    await expect($('~Include special chars')).toBeDisplayed()
  })
})