describe('Focus Bear Signup Validation Flow', () => {
  it('should show validation when signup password is weak', async () => {
    // Greeting screen
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/bear-onboarding-primary').click()

    // ADHD story
    await $('~test:id/junior-bear-top-content-adhd_story').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/junior-bear-secondary-adhd_story').click()

    // Team up invite
    await $('~test:id/junior-bear-top-content-team_up_invite').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/bear-onboarding-primary').click()

    // Signup decision
    await $('~test:id/junior-bear-top-content-signup_decision').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/bear-onboarding-primary').click()

    // Terms screen
    await $('~test:id/agree-terms').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/agree-terms').click()

    await $('~test:id/accept-privacy-notice').waitForDisplayed({ timeout: 10000 })
    await $('~test:id/accept-privacy-notice').click()

    // Signup welcome
    await $('~test:id/sign-up-with-email').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/sign-up-with-email').click()

    // Email signup screen
    const emailInput = await $('~test:id/email')
    const passwordInput = await $('~test:id/password')

    await emailInput.waitForDisplayed({ timeout: 15000 })
    await passwordInput.waitForDisplayed({ timeout: 15000 })

    await emailInput.setValue('newuser@focusbear.com')
    await passwordInput.setValue('test')

    await $('~test:id/sign-up').click()

    // Weak password rules should remain visible
    await expect($('~Min. 8 characters')).toBeDisplayed()
    await expect($('~Include numbers')).toBeDisplayed()
    await expect($('~Include uppercase')).toBeDisplayed()
    await expect($('~Include special chars')).toBeDisplayed()
  })
})