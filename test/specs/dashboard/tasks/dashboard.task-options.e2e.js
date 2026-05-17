import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Task Options', () => {
  it('should open task options modal and select sorting option', async () => {
    await loginToDashboard()

    // Open Tasks tab
    const tasksTab = await $('~test:id/home-tab-task')
    await tasksTab.waitForDisplayed({ timeout: 15000 })
    await tasksTab.click()

    // Verify Tasks screen first
    await $('~test:id/input-task').waitForDisplayed({ timeout: 20000 })

    await expect($('~ Filter')).toBeDisplayed()
    await expect($('~test:id/input-task')).toBeDisplayed()

    // Open options modal
    const optionsButton = await $('~test:id/todos-options-button')
    await optionsButton.waitForExist({ timeout: 15000 })
    await optionsButton.click()

    // Modal visible
    const lowToHigh = await $('~Low to high TOP score')
    await lowToHigh.waitForDisplayed({ timeout: 15000 })

    // Select sorting option
    await lowToHigh.click()

    await driver.pause(1000)

    // Tap outside modal using pointer action
    await browser.action('pointer')
      .move({ x: 200, y: 100 })
      .down()
      .up()
      .perform()

    await driver.pause(1500)

    // Verify Tasks screen visible again
    await expect($('~test:id/input-task')).toBeDisplayed()
    await expect($('~ Filter')).toBeDisplayed()
  })
})