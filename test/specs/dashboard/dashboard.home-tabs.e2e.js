import { loginToDashboard } from '../../utils/auth.js'

describe('Focus Bear Dashboard Home Tabs', () => {
  it('should switch between overview, habit, and task tabs on home dashboard', async () => {
    await loginToDashboard()

    // Overview tab
    await $('~test:id/home-tab-overview').waitForDisplayed({ timeout: 15000 })
    await $('~test:id/home-tab-overview').click()

    await expect($('~test:id/routine-card-view-all')).toBeDisplayed()
    await expect($('~test:id/focus-mode-card-new-session')).toBeDisplayed()

    // Habit tab
    await $('~test:id/home-tab-habit').click()

    const addRoutineButton = await $('~test:id/add-routine-item-button')
    await addRoutineButton.waitForDisplayed({ timeout: 15000 })

    await expect(addRoutineButton).toBeDisplayed()

    // Task tab
    await $('~test:id/home-tab-task').click()

    await $('~test:id/todos-notes-button').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/home-tab-task')).toBeDisplayed()
    await expect($('~test:id/todos-notes-button')).toBeDisplayed()
    await expect($('~test:id/todos-search-button')).toBeDisplayed()
    await expect($('~test:id/todos-options-button')).toBeDisplayed()
    await expect($('~test:id/quickaction-mic')).toBeDisplayed()
    await expect($('~test:id/quickaction-ocr')).toBeDisplayed()
  })
})