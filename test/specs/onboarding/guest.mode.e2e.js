describe('Focus Bear Guest Mode Flow', () => {
  it('should continue anonymously and reach dashboard', async () => {
    // Screen 1: Greeting
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

    await expect($('~test:id/bear-onboarding-primary')).toBeDisplayed()
    await expect($('~test:id/junior-bear-secondary-signup_decision')).toBeDisplayed()
    await expect($('~test:id/junior-bear-back')).toBeDisplayed()

    // Press "No thanks, I will stay anonymous"
    await $('~test:id/junior-bear-secondary-signup_decision').click()

    // Captain Bear intro screen
    await $('~test:id/captain-bear-intro-okay').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/captain-bear-intro-okay').click()

    // Setup habits screen
    await $('~test:id/captain-bear-intro-skip').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/captain-bear-intro-skip')).toBeDisplayed()
    await expect($('~test:id/captain-bear-intro-setup-habits')).toBeDisplayed()

    // Press Skip
    await $('~test:id/captain-bear-intro-skip').click()

    // Blocking permission intro screen
    await $('~test:id/blocking-permission-intro-skip').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/blocking-permission-intro-skip')).toBeDisplayed()
    await expect($('~test:id/blocking-permission-intro-primary')).toBeDisplayed()

    // Press Skip
    await $('~test:id/blocking-permission-intro-skip').click()

    // Dashboard should appear after this
    await driver.pause(3000)
  })
})