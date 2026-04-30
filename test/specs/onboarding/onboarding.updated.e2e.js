describe('Updated Focus Bear Onboarding + Email Signup Flow', () => {
  it('should complete onboarding and open email signup screen', async () => {
    // Screen 1: Greeting Intro
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/bear-onboarding-primary').click()

    // Screen 2: ADHD Story
    await $('~test:id/junior-bear-top-content-adhd_story').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/junior-bear-secondary-adhd_story').click()

    // Screen 3: Team Up Invite
    await $('~test:id/junior-bear-top-content-team_up_invite').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/bear-onboarding-primary').click()

    // Screen 4: Signup Decision
    await $('~test:id/junior-bear-top-content-signup_decision').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/bear-onboarding-primary').click()

    // Screen 5: Terms and Privacy
    await $('~test:id/agree-terms').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/agree-terms').click()

    await $('~test:id/accept-privacy-notice').waitForDisplayed({ timeout: 10000 })
    await $('~test:id/accept-privacy-notice').click()

    // Screen 6: Signup Welcome
    await $('~test:id/sign-up-with-email').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/sign-up-with-email').click()

    // Screen 7: Email Signup
    await $('~test:id/email').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/email')).toBeDisplayed()
    await expect($('~test:id/password')).toBeDisplayed()
    await expect($('~test:id/back-to-signup')).toBeDisplayed()
    await expect($('~test:id/sign-up')).toBeDisplayed()
    await expect($('~test:id/toggle-password-visibility')).toBeDisplayed()

    await $('~test:id/email').setValue('testuser@focusbear.com')
    await $('~test:id/password').setValue('Test@1234')

    await $('~test:id/sign-up').click()
  })
})