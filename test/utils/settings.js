export async function openSettings() {
  await $('~test:id/settings-tab').waitForDisplayed({ timeout: 15000 })
  await $('~test:id/settings-tab').click()

  await $('~test:id/bearsona-settings-button').waitForDisplayed({ timeout: 20000 })
}