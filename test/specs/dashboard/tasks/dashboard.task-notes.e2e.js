import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Task Notes', () => {
  it('should open task notes screen', async () => {
    await loginToDashboard()

    // Open Tasks tab
    const tasksTab = await $('~test:id/home-tab-task')
    await tasksTab.waitForDisplayed({ timeout: 20000 })
    await tasksTab.click()

    // Wait for Tasks screen
    const taskInput = await $('~test:id/input-task')
    await taskInput.waitForDisplayed({ timeout: 30000 })

    await driver.pause(3000)

    // Open Notes
    const notesButton = await $('~test:id/todos-notes-button')
    await notesButton.waitForExist({ timeout: 20000 })

    await notesButton.click()

    // Wait for Notes screen
    const toggleSearch = await $('~Toggle search')
    await toggleSearch.waitForDisplayed({ timeout: 20000 })

    // Verify Notes screen opened
    await expect(toggleSearch).toBeDisplayed()
  })
})