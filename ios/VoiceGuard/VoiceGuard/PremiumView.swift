import SwiftUI

struct PremiumView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var purchaseManager: PurchaseManager

    private let brandColor = Color(red: 0.06, green: 0.45, blue: 0.42)

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: purchaseManager.hasRemovedAds ? "checkmark.shield.fill" : "rectangle.slash.fill")
                    .font(.system(size: 58))
                    .foregroundStyle(brandColor)
                    .accessibilityHidden(true)

                VStack(spacing: 8) {
                    Text(purchaseManager.hasRemovedAds ? "広告を削除済みです" : "広告を削除")
                        .font(.title2.bold())
                    Text("一度購入すれば、バナー広告をずっと非表示にできます。定期購入ではありません。")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                if purchaseManager.hasRemovedAds {
                    Label("ご購入ありがとうございます", systemImage: "heart.fill")
                        .font(.headline)
                        .foregroundStyle(brandColor)
                } else {
                    Button {
                        Task { await purchaseManager.purchase() }
                    } label: {
                        VStack(spacing: 2) {
                            Text("広告を削除して開発を応援")
                                .font(.headline)
                            Text("買い切り \(purchaseManager.displayPrice)")
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity, minHeight: 56)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(brandColor)
                    .disabled(purchaseManager.isLoading || purchaseManager.product == nil)

                    if purchaseManager.product == nil {
                        ProgressView("購入情報を確認しています")
                            .font(.caption)
                    }
                }

                Button("購入を復元") {
                    Task { await purchaseManager.restorePurchases() }
                }
                .disabled(purchaseManager.isLoading)

                Text("音声・セリフなどの基本機能は、購入しなくてもすべて利用できます。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                Spacer()
            }
            .padding(24)
            .navigationTitle("広告を削除")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("閉じる") { dismiss() }
                }
            }
            .alert("購入について", isPresented: Binding(
                get: { purchaseManager.errorMessage != nil },
                set: { if !$0 { purchaseManager.errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) { purchaseManager.errorMessage = nil }
            } message: {
                Text(purchaseManager.errorMessage ?? "")
            }
        }
    }
}

#Preview {
    PremiumView()
        .environmentObject(PurchaseManager())
}
