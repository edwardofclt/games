import XCTest

final class WobbleStackUITests: XCTestCase {
    private var app: XCUIApplication!

    @MainActor private func launchGame() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.webViews.buttons["Pause game"].waitForExistence(timeout: 20), app.debugDescription)
    }

    @MainActor func testPauseResumeAndBackground() {
        launchGame()
        app.webViews.buttons["Pause game"].tap()
        XCTAssertTrue(app.webViews.staticTexts["Hold that wobble."].waitForExistence(timeout: 5))
        app.webViews.buttons["Keep stacking ↗"].tap()
        XCTAssertTrue(app.webViews.buttons["Pause game"].exists)
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(app.webViews.staticTexts["Hold that wobble."].waitForExistence(timeout: 5))
    }

    @MainActor func testDropScoreFailureRetryAndPersistence() {
        launchGame()
        let web = app.webViews.firstMatch
        let pause = web.buttons["Pause game"]
        // Use genuine taps. The block keeps sliding while UI automation locates it.
        // Retry an edge miss rather than overriding the game state for the test.
        var landed = false
        for _ in 0..<4 {
            web.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
            let scored = web.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "Score 1.")).firstMatch
            if scored.waitForExistence(timeout: 2) { landed = true; break }
            let retry = web.buttons["Stack again ↗"]
            if retry.waitForExistence(timeout: 3) { retry.tap() }
        }
        XCTAssertTrue(landed, app.debugDescription)
        pause.tap()
        XCTAssertTrue(web.staticTexts["Hold that wobble."].waitForExistence(timeout: 5))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.webViews.buttons["Pause game"].waitForExistence(timeout: 15))
        let best = app.webViews.staticTexts.matching(NSPredicate(format: "label MATCHES %@", "BEST [1-9][0-9]*")).firstMatch
        XCTAssertTrue(best.exists, "Native best survives app restart: \(app.debugDescription)")
        // Repeated genuine drops should eventually produce an unsupported stack.
        for _ in 0..<12 {
            if app.webViews.buttons["Stack again ↗"].exists { break }
            app.webViews.firstMatch.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
            _ = app.webViews.buttons["Stack again ↗"].waitForExistence(timeout: 1.4)
        }
        let retry = app.webViews.buttons["Stack again ↗"]
        XCTAssertTrue(retry.waitForExistence(timeout: 5))
        retry.tap()
        XCTAssertTrue(app.webViews.staticTexts["Tap to drop."].waitForExistence(timeout: 5))
    }

    @MainActor func testRotationKeepsControlsVisible() {
        launchGame()
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.webViews.buttons["Pause game"].waitForExistence(timeout: 5))
        app.webViews.buttons["Pause game"].tap()
        XCTAssertTrue(app.webViews.buttons["Keep stacking ↗"].waitForExistence(timeout: 5))
        XCUIDevice.shared.orientation = .portrait
        XCTAssertTrue(app.webViews.buttons["Keep stacking ↗"].isHittable)
    }
}
