import { loginToDashboard } from '../../utils/auth.js'

describe('Focus Bear Login Success Test', () => {
  it('should login successfully and reach dashboard', async () => {
    await loginToDashboard()

    const homeTab = await $('~test:id/home-tab')
    await homeTab.waitForDisplayed({ timeout: 20000 })

    await expect(homeTab).toBeDisplayed()
  })
})