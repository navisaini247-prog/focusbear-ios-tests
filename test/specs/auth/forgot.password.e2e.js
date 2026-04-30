describe('Focus Bear Forgot Password Flow', () => {
  it('should open forgot password screen and request password reset', async () => {
    await $('~test:id/junior-bear-top-content-greeting_intro').waitForDisplayed({ timeout: 15000 })

    await $('~test:id/already-have-account').click()

    const startWithEmail = await $('~test:id/start-with-email')
    await startWithEmail.waitForDisplayed({ timeout: 15000 })
    await startWithEmail.click()

    await $('~test:id/email').waitForDisplayed({ timeout: 15000 })

    await $('~Forgot Password?').click()

    await $('~test:id/reset-password').waitForDisplayed({ timeout: 15000 })

    await expect($('~test:id/email')).toBeDisplayed()
    await expect($('~test:id/reset-password')).toBeDisplayed()
    await expect($('~Back To Sign In')).toBeDisplayed()

    await $('~test:id/email').setValue('testuser@focusbear.com')

    await $('~test:id/reset-password').click()
  })
})