import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Task Quick Actions', () => {
  it('should show mic and OCR quick action buttons', async () => {
    await loginToDashboard()

    await $('~test:id/home-tab-task').click()

    await $('~test:id/quickaction-mic').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/quickaction-mic')).toBeDisplayed()
    await expect($('~test:id/quickaction-ocr')).toBeDisplayed()
  })
})