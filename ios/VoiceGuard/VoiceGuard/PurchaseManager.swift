import StoreKit

@MainActor
final class PurchaseManager: ObservableObject {
    static let removeAdsProductID = "com.voiceguard.hitoribouhan.removeads"

    @Published private(set) var product: Product?
    @Published private(set) var hasRemovedAds = false
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private var transactionUpdatesTask: Task<Void, Never>?

    init() {
        transactionUpdatesTask = observeTransactionUpdates()
    }

    deinit {
        transactionUpdatesTask?.cancel()
    }

    var displayPrice: String {
        product?.displayPrice ?? "\u{00a5}300"
    }

    func prepare() async {
        await refreshEntitlement()
        await loadProduct()
    }

    func purchase() async {
        guard let product else {
            errorMessage = "購入情報を取得できませんでした。通信環境を確認して、もう一度お試しください。"
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            switch try await product.purchase() {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                await transaction.finish()
                await refreshEntitlement()
            case .pending:
                errorMessage = "購入は承認待ちです。承認されると自動で広告が非表示になります。"
            case .userCancelled:
                break
            @unknown default:
                errorMessage = "購入を完了できませんでした。時間をおいてもう一度お試しください。"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func restorePurchases() async {
        isLoading = true
        defer { isLoading = false }

        do {
            try await AppStore.sync()
            await refreshEntitlement()
            if !hasRemovedAds {
                errorMessage = "復元できる購入が見つかりませんでした。購入時と同じApple Accountかご確認ください。"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadProduct() async {
        do {
            product = try await Product.products(for: [Self.removeAdsProductID]).first
        } catch {
            errorMessage = "購入情報を読み込めませんでした。広告の表示や音声再生には影響ありません。"
        }
    }

    private func refreshEntitlement() async {
        var isEntitled = false

        for await result in Transaction.currentEntitlements {
            guard let transaction = try? checkVerified(result) else { continue }
            if transaction.productID == Self.removeAdsProductID,
               transaction.revocationDate == nil {
                isEntitled = true
                break
            }
        }

        hasRemovedAds = isEntitled
    }

    private func observeTransactionUpdates() -> Task<Void, Never> {
        Task { [weak self] in
            for await result in Transaction.updates {
                guard let self else { return }
                guard let transaction = try? self.checkVerified(result) else { continue }
                await transaction.finish()
                await self.refreshEntitlement()
            }
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let value):
            return value
        case .unverified:
            throw PurchaseError.failedVerification
        }
    }
}

private enum PurchaseError: LocalizedError {
    case failedVerification

    var errorDescription: String? {
        "購入情報を確認できませんでした。時間をおいてもう一度お試しください。"
    }
}
