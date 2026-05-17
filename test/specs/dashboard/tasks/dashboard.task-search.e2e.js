import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Task Options', () => {
  it('should open task options modal and select sorting option', async () => {
    await loginToDashboard()

    const tasksTab = await $('~test:id/home-tab-task')
    await tasksTab.waitForDisplayed({ timeout: 15000 })
    await tasksTab.click()

    await $('~test:id/input-task').waitForDisplayed({ timeout: 20000 })

    const optionsButton = await $('~test:id/todos-options-button')
    await optionsButton.waitForExist({ timeout: 15000 })
    await optionsButton.click()

    const lowToHigh = await $('~Low to high TOP score')
    await lowToHigh.waitForDisplayed({ timeout: 15000 })
    await lowToHigh.click()

    await driver.pause(1000)

    await driver.touchAction([{ action: 'tap', x: 200, y: 100 }])

    await driver.pause(1500)

    await expect($('~test:id/input-task')).toBeDisplayed()
  })
})