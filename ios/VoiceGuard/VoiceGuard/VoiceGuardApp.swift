import SwiftUI

@main
struct VoiceGuardApp: App {
    @StateObject private var purchaseManager = PurchaseManager()
    @StateObject private var adMobManager = AdMobManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(purchaseManager)
                .environmentObject(adMobManager)
                .preferredColorScheme(.light)
                .task {
                    async let purchases: Void = purchaseManager.prepare()
                    async let ads: Void = adMobManager.prepare()
                    _ = await (purchases, ads)
                }
        }
    }
}
