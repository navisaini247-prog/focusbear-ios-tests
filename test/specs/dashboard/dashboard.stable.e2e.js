import { loginToDashboard } from '../../utils/auth.js'

describe('Focus Bear Dashboard Stable Test', () => {
  it('should login and verify main dashboard tabs are visible', async () => {
    await loginToDashboard()

    const homeTab = await $('~test:id/home-tab')
    await homeTab.waitForDisplayed({ timeout: 20000 })

    await expect(homeTab).toBeDisplayed()
    await expect($('~test:id/focus-tab')).toBeDisplayed()
    await expect($('~test:id/settings-tab')).toBeDisplayed()
  })
})