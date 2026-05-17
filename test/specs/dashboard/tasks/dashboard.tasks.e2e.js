import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Tasks Screen', () => {
  it('should open tasks screen and show task controls', async () => {
    await loginToDashboard()

    // Open Tasks tab
    const tasksTab = await $('~test:id/home-tab-task')
    await tasksTab.waitForDisplayed({ timeout: 15000 })
    await tasksTab.click()

    // Verify tasks screen
    await $('~ Filter').waitForDisplayed({ timeout: 15000 })

    await expect($('~ Filter')).toBeDisplayed()
    await expect($('~test:id/todos-notes-button')).toBeDisplayed()
    await expect($('~test:id/todos-search-button')).toBeDisplayed()
    await expect($('~test:id/todos-options-button')).toBeDisplayed()

    await expect($('~test:id/input-task')).toBeDisplayed()

    await expect($('~test:id/quickaction-mic')).toBeDisplayed()
    await expect($('~test:id/quickaction-ocr')).toBeDisplayed()
  })
})