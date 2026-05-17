import { loginToDashboard } from '../../../utils/auth.js'

describe('Focus Bear Focus Session With Notes And Music', function () {

  this.timeout(240000)

  it('should start focus session, play music, and create focus notes', async function () {

    await loginToDashboard()

    // Open Focus tab
    const focusTab = await $('~test:id/focus-tab')
    await focusTab.waitForDisplayed({ timeout: 20000 })
    await focusTab.click()

    // Focus screen
    const intentionInput = await $('~test:id/enter-an-intention')
    await intentionInput.waitForDisplayed({ timeout: 30000 })

    // Enter intention
    await intentionInput.click()
    await intentionInput.setValue(
      'Complete Focus Bear automation testing'
    )

    // Tap outside keyboard
    await browser.action('pointer')
      .move({ x: 200, y: 120 })
      .down()
      .up()
      .perform()

    await driver.pause(1000)

    // Start focus session
    const startFocusing = await $('~test:id/start-focusing')
    await startFocusing.waitForDisplayed({ timeout: 20000 })
    await startFocusing.click()

    // Continue without blocking
    const continueWithoutBlocking = await $('~test:id/modal-cancel')

    if (
      await continueWithoutBlocking
        .waitForDisplayed({ timeout: 8000 })
        .catch(() => false)
    ) {
      await continueWithoutBlocking.click()
    }

    // Focus session screen
    const musicButton = await $('~test:id/focus-music-button')
    await musicButton.waitForDisplayed({ timeout: 30000 })

    // Open music modal
    await musicButton.click()

    // Select music track
    const musicTrack = await $('~focus-music-modal-track-8866fbf1-6c83-4e08-9c10-6a43c6c74fe2')

    await musicTrack.waitForDisplayed({ timeout: 20000 })

    // Play music
    await musicTrack.click()

    await driver.pause(3000)

    // Tap outside modal
    await browser.action('pointer')
      .move({ x: 200, y: 120 })
      .down()
      .up()
      .perform()

    await driver.pause(3000)

    // Open Notes
    const notesButton = await $('~test:id/focus-notes-button')
    await notesButton.waitForDisplayed({ timeout: 20000 })

    await notesButton.click()

    // Notes screen takes time to load
    await driver.pause(8000)

    // Notes screen
    const toggleSearch = await $('~Toggle search')
    await toggleSearch.waitForDisplayed({ timeout: 60000 })

    // Allow Add button to fully render
    await driver.pause(3000)

    // Tap Add button
    const addButton = await $(
      '-ios class chain:**/XCUIElementTypeOther[`name == "main"`]/XCUIElementTypeButton[2]'
    )

    await addButton.waitForDisplayed({ timeout: 30000 })

    await addButton.click()

    // Title field
    const titleField = await $(
      '-ios class chain:**/XCUIElementTypeTextField[`name == "Title"`]'
    )

    await titleField.waitForDisplayed({ timeout: 30000 })

    await titleField.click()

    await titleField.setValue('Focus Session Notes')

    // Rich text editor
    const richTextEditor = await $(
      '~Rich Text Editor. Editing area: main. Press ⌥0 for help.'
    )

    await richTextEditor.waitForDisplayed({ timeout: 30000 })

    await richTextEditor.click()

    await richTextEditor.setValue(
  'Focus session testing with music and notes'
)

    // Save notes
    const saveButton = await $('~Save')

    await saveButton.waitForDisplayed({ timeout: 30000 })

    await saveButton.click()

    // Verify notes screen still visible
    await expect(toggleSearch).toBeDisplayed()
  })
})