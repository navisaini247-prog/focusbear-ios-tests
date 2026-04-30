describe('Focus Bear Onboarding Back Button Navigation', () => {
  it('should go back to previous onboarding screens', async () => {
    // Screen 1: Greeting
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })

    // Go to ADHD Story
    await $('~test:id/bear-onboarding-primary').click()
    await $('~test:id/junior-bear-top-content-adhd_story').waitForDisplayed({ timeout: 15000 })

    // Go back to Greeting
    await $('~test:id/junior-bear-back').click()
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })

    // Go forward again to ADHD Story
    await $('~test:id/bear-onboarding-primary').click()
    await $('~test:id/junior-bear-top-content-adhd_story').waitForDisplayed({ timeout: 15000 })

    // Go to Team Up Invite
    await $('~test:id/junior-bear-secondary-adhd_story').click()
    await $('~test:id/junior-bear-top-content-team_up_invite').waitForDisplayed({ timeout: 15000 })

    // Back to ADHD Story
    await $('~test:id/junior-bear-back').click()
    await $('~test:id/junior-bear-top-content-adhd_story').waitForDisplayed({ timeout: 15000 })

    // Forward to Team Up Invite again
    await $('~test:id/junior-bear-secondary-adhd_story').click()
    await $('~test:id/junior-bear-top-content-team_up_invite').waitForDisplayed({ timeout: 15000 })

    // Forward to Signup Decision
    await $('~test:id/bear-onboarding-primary').click()
    await $('~test:id/junior-bear-top-content-signup_decision').waitForDisplayed({ timeout: 15000 })

    // Back to Team Up Invite
    await $('~test:id/junior-bear-back').click()
    await $('~test:id/junior-bear-top-content-team_up_invite').waitForDisplayed({ timeout: 15000 })
  })
})