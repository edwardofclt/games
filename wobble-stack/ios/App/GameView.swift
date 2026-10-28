import SwiftUI
import WebKit

struct GameView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var loadFailed = false
    @State private var sessionID = UUID()

    var body: some View {
        ZStack {
            Color(red: 0.78, green: 0.72, blue: 0.95).ignoresSafeArea()
            GameWebView(isActive: scenePhase == .active, loadFailed: $loadFailed)
                .id(sessionID)
                .ignoresSafeArea()
            if loadFailed {
                VStack(spacing: 20) {
                    Text("The jelly machine needs a restart.")
                        .font(.title2.bold())
                        .multilineTextAlignment(.center)
                    Button("Try again") {
                        loadFailed = false
                        sessionID = UUID()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(red: 0.31, green: 0.80, blue: 0.64))
                }
                .padding(32)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 24))
                .padding(24)
            }
        }
        .statusBarHidden()
        .persistentSystemOverlays(.hidden)
    }
}

struct GameWebView: UIViewRepresentable {
    var isActive: Bool
    @Binding var loadFailed: Bool

    func makeCoordinator() -> Coordinator { Coordinator(loadFailed: $loadFailed) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        let best = max(0, UserDefaults.standard.integer(forKey: Coordinator.bestKey))
        // Only a small, validated score can cross from the bundled game to native storage.
        let bridge = """
        window.wobbleNative = Object.freeze({
            bestScore: \(best),
            saveBestScore(value) {
                window.webkit.messageHandlers.bestScore.postMessage(value);
            }
        });
        """
        configuration.userContentController.addUserScript(WKUserScript(
            source: bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true
        ))
        configuration.userContentController.add(context.coordinator, name: "bestScore")
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        context.coordinator.webView = webView
        guard let directory = Bundle.main.resourceURL?.appendingPathComponent("Web"),
              FileManager.default.fileExists(atPath: directory.appendingPathComponent("index.html").path) else {
            DispatchQueue.main.async { loadFailed = true }
            return webView
        }
        context.coordinator.webDirectory = directory.standardizedFileURL
        webView.loadFileURL(directory.appendingPathComponent("index.html"), allowingReadAccessTo: directory)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.isActive = isActive
        if !isActive { context.coordinator.pauseGame() }
    }

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "bestScore")
        webView.navigationDelegate = nil
        webView.stopLoading()
    }

    @MainActor final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        static let bestKey = "wobble-stack-best-v1"
        @Binding var loadFailed: Bool
        weak var webView: WKWebView?
        var webDirectory: URL?
        var isActive = true

        init(loadFailed: Binding<Bool>) { _loadFailed = loadFailed }

        func pauseGame() {
            webView?.evaluateJavaScript("window.dispatchEvent(new Event('wobble-native-pause'))", completionHandler: nil)
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "bestScore", message.frameInfo.isMainFrame,
                  let value = message.body as? NSNumber,
                  CFGetTypeID(value) != CFBooleanGetTypeID(),
                  value.doubleValue.isFinite,
                  value.doubleValue.rounded(.down) == value.doubleValue,
                  value.doubleValue >= 0, value.doubleValue <= 1_000_000 else { return }
            let old = UserDefaults.standard.integer(forKey: Self.bestKey)
            if value.intValue > old { UserDefaults.standard.set(value.intValue, forKey: Self.bestKey) }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url?.standardizedFileURL,
                  url.isFileURL, let directory = webDirectory,
                  url.path.hasPrefix(directory.path + "/") else {
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            loadFailed = false
            if !isActive { pauseGame() }
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { loadFailed = true }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { loadFailed = true }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            // Do not silently discard an in-progress run; offer an explicit restart.
            loadFailed = true
        }
    }
}
