export async function reachSignupWelcome() {
  await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/bear-onboarding-primary').click()

  await $('~test:id/junior-bear-top-content-adhd_story').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/junior-bear-secondary-adhd_story').click()

  await $('~test:id/junior-bear-top-content-team_up_invite').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/bear-onboarding-primary').click()

  await $('~test:id/junior-bear-top-content-signup_decision').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/bear-onboarding-primary').click()

  await $('~test:id/agree-terms').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/agree-terms').click()

  await $('~test:id/accept-privacy-notice').waitForDisplayed({ timeout: 10000 })
  await $('~test:id/accept-privacy-notice').click()

  await $('~test:id/sign-up-with-email').waitForDisplayed({ timeout: 15000 })
}

export async function reachDashboardViaGuest() {
  await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/bear-onboarding-primary').click()

  await $('~test:id/junior-bear-top-content-adhd_story').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/junior-bear-secondary-adhd_story').click()

  await $('~test:id/junior-bear-top-content-team_up_invite').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/bear-onboarding-primary').click()

  await $('~test:id/junior-bear-top-content-signup_decision').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/junior-bear-secondary-signup_decision').click()

  await $('~test:id/captain-bear-intro-okay').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/captain-bear-intro-okay').click()

  await $('~test:id/captain-bear-intro-skip').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/captain-bear-intro-skip').click()

  await $('~test:id/blocking-permission-intro-skip').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/blocking-permission-intro-skip').click()

  await $('~test:id/home-header-bearsona').waitForDisplayed({ timeout: 20000 })
}