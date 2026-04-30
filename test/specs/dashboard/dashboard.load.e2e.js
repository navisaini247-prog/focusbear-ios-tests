describe('Focus Bear Dashboard Load', () => {
  it('should load dashboard after guest mode flow', async () => {

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

    // Stay anonymous
    await $('~test:id/junior-bear-secondary-signup_decision').click()

    // Captain Bear intro
    await $('~test:id/captain-bear-intro-okay').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/captain-bear-intro-okay').click()

    // Setup habits → skip
    await $('~test:id/captain-bear-intro-skip').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/captain-bear-intro-skip').click()

    // Blocking permissions → skip
    await $('~test:id/blocking-permission-intro-skip').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/blocking-permission-intro-skip').click()

    // 🔥 Dashboard validation starts here

    const homeHeader = await $('~test:id/home-header-bearsona')
    await homeHeader.waitForDisplayed({ timeout: 20000 })

    await expect(homeHeader).toBeDisplayed()
    await expect($('~test:id/streak-button')).toBeDisplayed()
    await expect($('~test:id/home-header-help')).toBeDisplayed()

    await expect($('~test:id/home-tab-overview')).toBeDisplayed()
    await expect($('~test:id/home-tab-habit')).toBeDisplayed()
    await expect($('~test:id/home-tab-task')).toBeDisplayed()

    await expect($('~test:id/routine-card-view-all')).toBeDisplayed()
    await expect($('~test:id/focus-mode-card-new-session')).toBeDisplayed()

    await expect($('~test:id/home-tab')).toBeDisplayed()
    await expect($('~test:id/focus-tab')).toBeDisplayed()
    await expect($('~test:id/stats-tab')).toBeDisplayed()
    await expect($('~test:id/settings-tab')).toBeDisplayed()

  })
})