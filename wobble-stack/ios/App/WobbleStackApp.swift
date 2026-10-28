import SwiftUI

@main
struct WobbleStackApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
                .preferredColorScheme(.light)
        }
    }
}
