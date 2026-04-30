import { loginToDashboard } from '../../../utils/auth.js'
import { openSettings } from '../../../utils/settings.js'

describe('Settings - Block Websites', () => {
  it('should open block websites screen', async () => {
    await loginToDashboard()
    await openSettings()

    const blockWebsites = await $('~󰕑 Block Websites ')
    await blockWebsites.waitForDisplayed({ timeout: 15000 })
    await blockWebsites.click()

    await $('~Add URLs to blocklist ').waitForDisplayed({ timeout: 15000 })

    await expect($('~Add URLs to blocklist ')).toBeDisplayed()
    await expect($('~Clear blocked URLs ')).toBeDisplayed()
    await expect($('~test:id/header-back-button')).toBeDisplayed()
  })
})