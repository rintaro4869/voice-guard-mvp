import StoreKit
import UIKit

@MainActor
final class ReviewRequestManager: ObservableObject {
    private enum Key {
        static let installDate = "review.installDate"
        static let sessionCount = "review.sessionCount"
        static let successfulUseCount = "review.successfulUseCount"
        static let lastRequestDate = "review.lastRequestDate"
        static let requestHistory = "review.requestHistory"
    }

    private let defaults = UserDefaults.standard
    private let minimumSessions = 3
    private let minimumSuccessfulUses = 3
    private let minimumDaysSinceInstall = 3
    private let minimumDaysBetweenRequests = 30
    private let maximumRequestsPerYear = 3
    private var isSessionActive = false
    private var requestedInCurrentSession = false

    init() {
        if defaults.object(forKey: Key.installDate) == nil {
            defaults.set(Date().timeIntervalSince1970, forKey: Key.installDate)
        }
    }

    func beginSession() {
        guard !isSessionActive else { return }
        isSessionActive = true
        requestedInCurrentSession = false
        defaults.set(defaults.integer(forKey: Key.sessionCount) + 1, forKey: Key.sessionCount)
    }

    func endSession() {
        isSessionActive = false
    }

    func recordSuccessfulUse() {
        defaults.set(
            defaults.integer(forKey: Key.successfulUseCount) + 1,
            forKey: Key.successfulUseCount
        )
        requestIfEligible()
    }

    private func requestIfEligible() {
        guard isSessionActive,
              !requestedInCurrentSession,
              defaults.integer(forKey: Key.sessionCount) >= minimumSessions,
              defaults.integer(forKey: Key.successfulUseCount) >= minimumSuccessfulUses,
              daysSinceInstall >= minimumDaysSinceInstall,
              daysSinceLastRequest >= minimumDaysBetweenRequests,
              requestsInLastYear < maximumRequestsPerYear,
              let scene = activeWindowScene()
        else { return }

        requestedInCurrentSession = true
        let now = Date().timeIntervalSince1970
        defaults.set(now, forKey: Key.lastRequestDate)
        defaults.set(requestHistory + [now], forKey: Key.requestHistory)

        // 再生完了のUI更新と重ならないよう、次のRunLoopで依頼する。
        DispatchQueue.main.async {
            SKStoreReviewController.requestReview(in: scene)
        }
    }

    private var daysSinceInstall: Int {
        let timestamp = defaults.double(forKey: Key.installDate)
        guard timestamp > 0 else { return 0 }
        return Calendar.current.dateComponents(
            [.day],
            from: Date(timeIntervalSince1970: timestamp),
            to: Date()
        ).day ?? 0
    }

    private var daysSinceLastRequest: Int {
        let timestamp = defaults.double(forKey: Key.lastRequestDate)
        guard timestamp > 0 else {
            return .max
        }
        return Calendar.current.dateComponents(
            [.day],
            from: Date(timeIntervalSince1970: timestamp),
            to: Date()
        ).day ?? 0
    }

    private var requestHistory: [Double] {
        defaults.array(forKey: Key.requestHistory) as? [Double] ?? []
    }

    private var requestsInLastYear: Int {
        let yearAgo = Date().addingTimeInterval(-365 * 24 * 60 * 60).timeIntervalSince1970
        return requestHistory.filter { $0 >= yearAgo }.count
    }

    private func activeWindowScene() -> UIWindowScene? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
    }
}
