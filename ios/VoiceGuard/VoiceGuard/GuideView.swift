import SwiftUI

struct GuideView: View {
    @Environment(\.dismiss) private var dismiss

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
                    Text("このアプリは防犯の補助を目的としたものです。安全を完全に保証するものではありません。身の危険を感じた場合は、ためらわず警察（110番)に連絡してください。")
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
}
