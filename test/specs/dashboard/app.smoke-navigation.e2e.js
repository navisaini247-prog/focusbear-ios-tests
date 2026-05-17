import { loginToDashboard } from '../../utils/auth.js'

describe('Focus Bear App Stability Smoke Test', function () {

  this.timeout(180000)

  it('should navigate through main app screens without crashing', async function () {

    await loginToDashboard()

    // Home screen
    const homeTab = await $('~test:id/home-tab')
    await homeTab.waitForDisplayed({ timeout: 20000 })

    await expect(homeTab).toBeDisplayed()

    // Tasks tab
    const tasksTab = await $('~test:id/home-tab-task')
    await tasksTab.waitForDisplayed({ timeout: 20000 })

    await tasksTab.click()

    await $('~test:id/input-task').waitForDisplayed({ timeout: 30000 })

    await expect($('~test:id/input-task')).toBeDisplayed()

    // Focus tab
    const focusTab = await $('~test:id/focus-tab')
    await focusTab.waitForDisplayed({ timeout: 20000 })

    await focusTab.click()

    await $('~test:id/start-focusing').waitForDisplayed({ timeout: 30000 })

    await expect($('~test:id/start-focusing')).toBeDisplayed()

    // Settings tab
    const settingsTab = await $('~test:id/settings-tab')
    await settingsTab.waitForDisplayed({ timeout: 20000 })

    await settingsTab.click()

    await $('~test:id/settings-permissions').waitForDisplayed({ timeout: 30000 })

    await expect($('~test:id/settings-permissions')).toBeDisplayed()

    // Back to Home
    await homeTab.click()

    await expect(homeTab).toBeDisplayed()
  })
})