import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Task Input', () => {
  it('should type a task into the task input field', async () => {
    await loginToDashboard()

    await $('~test:id/home-tab-task').click()

    const taskInput = await $('~test:id/input-task')
    await taskInput.waitForDisplayed({ timeout: 15000 })

    await taskInput.click()
    await taskInput.setValue('Complete Focus Bear testing')

    await expect(taskInput).toBeDisplayed()
  })
})