import { loginToDashboard } from '../../utils/auth.js'

describe('Focus Bear Dashboard Permission Banner', () => {
  it('should show blocking permission warning banner and open permissions screen', async () => {
    await loginToDashboard()

    const permissionBanner = await $('~ Blocking disabled: Permissions not granted (tap here to fix)')
    await permissionBanner.waitForDisplayed({ timeout: 15000 })

    await expect(permissionBanner).toBeDisplayed()

    await permissionBanner.click()

    await $('~ Permissions').waitForDisplayed({ timeout: 15000 })

    await expect($('~ Permissions')).toBeDisplayed()
    await expect($('~ Screen Time Permission Not granted ')).toBeDisplayed()
    await expect($('~ Notification Permission Allowed ')).toBeDisplayed()
  })
})