import { loginToDashboard } from '../../utils/auth.js'

describe('Focus Bear Dashboard Tabs Navigation', () => {
  it('should navigate between dashboard tabs after login', async () => {
    await loginToDashboard()

    await $('~test:id/home-tab').click()
    await expect($('~test:id/home-header-bearsona')).toBeDisplayed()

    await $('~test:id/focus-tab').click()
    await driver.pause(1500)
    await expect($('~test:id/focus-tab')).toBeDisplayed()

    await $('~test:id/stats-tab').click()
    await driver.pause(1500)
    await expect($('~test:id/stats-tab')).toBeDisplayed()

    await $('~test:id/settings-tab').click()
    await driver.pause(1500)
    await expect($('~test:id/settings-tab')).toBeDisplayed()

    await $('~test:id/home-tab').click()
    await $('~test:id/home-header-bearsona').waitForDisplayed({ timeout: 10000 })
  })
})