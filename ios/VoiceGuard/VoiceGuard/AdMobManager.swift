import GoogleMobileAds
import UserMessagingPlatform

@MainActor
final class AdMobManager: ObservableObject {
    @Published private(set) var canRequestAds = false
    @Published private(set) var privacyOptionsRequired = false
    @Published var errorMessage: String?

    private var hasStartedSDK = false

    func prepare() async {
        configurePrivacyFirstDefaults()

        let parameters = RequestParameters()
        do {
            try await requestConsentInfoUpdate(parameters)
            try await ConsentForm.loadAndPresentIfRequired(from: nil)
        } catch {
            // A previous valid consent state can still permit ads. Never bypass UMP's decision.
            errorMessage = "広告のプライバシー設定を更新できませんでした。音声機能はそのまま利用できます。"
        }

        refreshConsentState()
        startSDKIfAllowed()
    }

    func presentPrivacyOptions() async {
        do {
            try await ConsentForm.presentPrivacyOptionsForm(from: nil)
            refreshConsentState()
            startSDKIfAllowed()
        } catch {
            errorMessage = "広告のプライバシー設定を開けませんでした。時間をおいてもう一度お試しください。"
        }
    }

    private func configurePrivacyFirstDefaults() {
        let configuration = MobileAds.shared.requestConfiguration
        configuration.setPublisherFirstPartyIDEnabled(false)
        configuration.publisherPrivacyPersonalizationState = .disabled
        configuration.maxAdContentRating = GADMaxAdContentRating.general
    }

    private func requestConsentInfoUpdate(_ parameters: RequestParameters) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            ConsentInformation.shared.requestConsentInfoUpdate(with: parameters) { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: ())
                }
            }
        }
    }

    private func refreshConsentState() {
        canRequestAds = ConsentInformation.shared.canRequestAds
        privacyOptionsRequired = ConsentInformation.shared.privacyOptionsRequirementStatus == .required
    }

    private func startSDKIfAllowed() {
        guard canRequestAds, !hasStartedSDK else { return }
        hasStartedSDK = true
        MobileAds.shared.start()
    }
}
