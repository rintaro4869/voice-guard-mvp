import SwiftUI

struct GuideView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var purchaseManager: PurchaseManager
    @EnvironmentObject private var adMobManager: AdMobManager
    @State private var isShowingPhraseRequest = false
    @State private var isShowingMailUnavailable = false
    @State private var isShowingPremium = false

    var body: some View {
        NavigationStack {
            List {
                Section("使い方") {
                    guideRow(number: "1", title: "事前にセリフと声を選ぶ", detail: "落ち着いているときに、よく使うセリフと声のタイプを選んでおきます。選択は次回起動時も保存されます。")
                    guideRow(number: "2", title: "インターホンが鳴ったら再生", detail: "アプリを開いて大きな再生ボタンを押すだけ。「3秒後に再生」を使うと、スマホをインターホンに近づけてから鳴らせます。")
                    guideRow(number: "3", title: "スピーカーをインターホンに近づける", detail: "iPhoneの下部スピーカーをインターホンのマイクに向けると、より自然に聞こえます。")
                }

                Section("うまく使うコツ") {
                    tipRow(icon: "speaker.wave.3", text: "音量は事前に大きめにしておくと安心です。マナーモード中でも音は鳴ります。")
                    tipRow(icon: "shuffle", text: "「おまかせ」にすると毎回声が変わり、より自然な印象になります。")
                    tipRow(icon: "shippingbox", text: "置き配なら「玄関の前に置いといてください」が便利です。対面せずに受け取れます。")
                }

                Section("ご注意") {
                    Text("このアプリは防犯の補助を目的としたものです。安全を完全に保証するものではありません。身の危険を感じた場合は、ためらわず警察（110番）に連絡してください。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("追加してほしいセリフ") {
                    Button {
                        if MailComposeView.canSendMail {
                            isShowingPhraseRequest = true
                        } else {
                            isShowingMailUnavailable = true
                        }
                    } label: {
                        Label("アプリ内からリクエスト", systemImage: "text.bubble")
                    }

                    Text("ご要望の集約専用です。本文に氏名などを書く必要はなく、個別の返信は行っていません。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("広告") {
                    if purchaseManager.hasRemovedAds {
                        Label("広告を削除済み", systemImage: "checkmark.shield.fill")
                            .foregroundStyle(Color.accentColor)
                    } else {
                        Button {
                            isShowingPremium = true
                        } label: {
                            Label("広告を削除", systemImage: "rectangle.slash")
                        }
                    }

                    Button("購入を復元") {
                        Task { await purchaseManager.restorePurchases() }
                    }
                    .disabled(purchaseManager.isLoading)

                    if adMobManager.privacyOptionsRequired {
                        Button {
                            Task { await adMobManager.presentPrivacyOptions() }
                        } label: {
                            Label("広告のプライバシー設定", systemImage: "hand.raised")
                        }
                    }

                    Text("広告は音声再生の操作から離れた位置にだけ表示します。買い切りで非表示にできます。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("リンク") {
                    Link(destination: URL(string: "https://voiceguardhitoribouhan.pages.dev/")!) {
                        Label("公式サイト・防犯コラム", systemImage: "globe")
                    }
                    Link(destination: URL(string: "https://voiceguardhitoribouhan.pages.dev/privacy.html")!) {
                        Label("プライバシーポリシー", systemImage: "hand.raised")
                    }
                }
            }
            .navigationTitle("使い方")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("閉じる") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $isShowingPhraseRequest) {
                MailComposeView(
                    recipients: ["yamadaxr.app@gmail.com"],
                    subject: "ひとり防犯ボイス：追加セリフのリクエスト",
                    body: """
                    追加してほしいセリフ：

                    使いたい場面：

                    ※ご要望の集約専用です。個別の返信は行っていません。
                    ※氏名・住所などの個人情報は記載しないでください。
                    """
                )
            }
            .sheet(isPresented: $isShowingPremium) {
                PremiumView()
            }
            .alert("メールを送信できません", isPresented: $isShowingMailUnavailable) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("iPhoneの「設定」でメールアカウントを追加してから、もう一度お試しください。")
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

    private func guideRow(number: String, title: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(number)
                .font(.headline)
                .foregroundStyle(.white)
                .frame(width: 28, height: 28)
                .background(Circle().fill(Color.accentColor))
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func tipRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(Color.accentColor)
                .frame(width: 28)
            Text(text)
                .font(.footnote)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    GuideView()
        .environmentObject(PurchaseManager())
        .environmentObject(AdMobManager())
}
