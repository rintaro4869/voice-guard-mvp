import SwiftUI

struct ContentView: View {
    @StateObject private var player = SoundPlayer()
    @AppStorage("vg_phrase") private var phraseId = "hai"
    @AppStorage("vg_voice") private var voiceId = VoiceType.youngPolite.rawValue
    @State private var showGuide = false

    private let brandColor = Color(red: 0.06, green: 0.45, blue: 0.42)
    private let brandSurface = Color(red: 0.91, green: 0.97, blue: 0.96)

    private var phrase: Phrase { Phrase.find(phraseId) }
    private var voice: VoiceType { VoiceType.find(voiceId) }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                playSection
                Divider()
                ScrollView {
                    VStack(spacing: 16) {
                        phraseSection
                        voiceSection
                        reassuranceSection
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 18)
                    .padding(.bottom, 24)
                }
                .background(Color(.systemGroupedBackground))
            }
            .background(Color(.systemBackground))
            .navigationTitle("ひとり防犯ボイス")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Image(systemName: "shield.fill")
                        .foregroundStyle(brandColor)
                        .accessibilityHidden(true)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showGuide = true
                    } label: {
                        Label("使い方", systemImage: "questionmark.circle")
                    }
                }
            }
            .sheet(isPresented: $showGuide) {
                GuideView()
            }
            .onAppear(perform: configureForLaunchArguments)
            .overlay { countdownOverlay }
        }
        .tint(brandColor)
    }

    // MARK: - すぐ押せる主操作

    private var playSection: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                Label("準備OK", systemImage: "checkmark.shield.fill")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(brandColor)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(brandSurface))
                Spacer()
                Label("オフライン", systemImage: "wifi.slash")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 3) {
                Text("インターホンが鳴ったら")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text("「\(phrase.label)」")
                    .font(.title3.bold())
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
                Text(currentVoiceCaption)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Button {
                player.play(phrase: phrase, voice: voice)
            } label: {
                HStack(spacing: 14) {
                    Image(systemName: player.isPlaying ? "speaker.wave.3.fill" : "play.fill")
                        .font(.system(size: 30, weight: .bold))
                        .frame(width: 40)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(player.isPlaying ? "再生中" : "男性の声で応答")
                            .font(.system(size: 25, weight: .bold))
                        Text(player.isPlaying ? phrase.label : "タップですぐ再生")
                            .font(.caption)
                            .opacity(0.9)
                    }
                    Spacer()
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 22)
                .frame(maxWidth: .infinity, minHeight: 104)
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(brandColor)
                )
                .shadow(color: brandColor.opacity(0.22), radius: 10, y: 5)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(phrase.label)を\(currentVoiceCaption)で再生")
            .accessibilityHint("ダブルタップするとすぐに男性の声が流れます")

            HStack(spacing: 10) {
                Button {
                    player.playAfterCountdown(seconds: 3, phrase: phrase, voice: voice)
                } label: {
                    Label("3秒後に再生", systemImage: "timer")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.bordered)

                Button {
                    player.stop()
                } label: {
                    Label("停止", systemImage: "stop.fill")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(.bordered)
                .tint(.secondary)
                .disabled(!player.isPlaying && player.countdown == nil)
            }

            statusView
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 14)
    }

    private var statusView: some View {
        VStack(spacing: 4) {
            Text(player.statusText)
                .font(.caption)
                .foregroundStyle(.secondary)
            if let error = player.errorText {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(.red)
            }
            if player.isLowVolume {
                Label("音量が小さめです。側面ボタンで上げてください", systemImage: "speaker.wave.1")
                    .font(.caption)
                    .foregroundStyle(.orange)
            }
        }
        .multilineTextAlignment(.center)
        .frame(minHeight: 18)
        .accessibilityElement(children: .combine)
    }

    private var currentVoiceCaption: String {
        if voice == .random, let picked = player.lastRandomVoice {
            return "おまかせ（今回：\(picked.label)）"
        }
        return voice.label
    }

    // MARK: - セリフ選択

    private var phraseSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionHeader(
                title: "セリフを選ぶ",
                caption: "よく使う言葉を事前に選んでおけます",
                icon: "text.bubble.fill"
            )
            VStack(spacing: 0) {
                ForEach(Phrase.all) { item in
                    HStack(spacing: 8) {
                        Button {
                            phraseId = item.id
                            UISelectionFeedbackGenerator().selectionChanged()
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: item.id == phraseId ? "checkmark.circle.fill" : "circle")
                                    .font(.title3)
                                    .foregroundStyle(item.id == phraseId ? brandColor : Color(.systemGray3))
                                Text(item.label)
                                    .font(.body.weight(item.id == phraseId ? .semibold : .regular))
                                    .foregroundStyle(.primary)
                                    .multilineTextAlignment(.leading)
                                Spacer(minLength: 4)
                            }
                            .contentShape(Rectangle())
                            .frame(maxWidth: .infinity, minHeight: 52)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(item.label)
                        .accessibilityValue(item.id == phraseId ? "選択中" : "")
                        .accessibilityHint("ダブルタップするとこのセリフを選択します")

                        Button {
                            phraseId = item.id
                            player.play(phrase: item, voice: voice)
                        } label: {
                            Image(systemName: "speaker.wave.2.circle.fill")
                                .font(.title2)
                                .foregroundStyle(brandColor)
                                .frame(width: 48, height: 48)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(item.label)を試しに再生")
                    }
                    .padding(.leading, 14)
                    .padding(.trailing, 8)
                    if item.id != Phrase.all.last?.id {
                        Divider().padding(.leading, 50)
                    }
                }
            }
            .background(cardBackground)

        }
    }

    // MARK: - 声タイプ選択

    private var voiceSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(
                title: "声のタイプ",
                caption: "相手や場面に合わせて切り替えられます",
                icon: "waveform"
            )
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 8) { voiceButtons }
                VStack(spacing: 8) { voiceButtons }
            }
            if voice == .random {
                Label("再生するたびに声が変わり、毎回同じ印象になるのを防ぎます", systemImage: "shuffle")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 4)
            }
        }
    }

    @ViewBuilder
    private var voiceButtons: some View {
        ForEach(VoiceType.allCases) { item in
            Button {
                voiceId = item.rawValue
                if item == .random {
                    player.lastRandomVoice = nil
                }
                UISelectionFeedbackGenerator().selectionChanged()
            } label: {
                VStack(spacing: 5) {
                    Image(systemName: voiceIcon(item))
                        .font(.headline)
                    Text(item.shortLabel)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
                .frame(maxWidth: .infinity, minHeight: 64)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(item.rawValue == voiceId ? brandColor : Color(.systemBackground))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(item.rawValue == voiceId ? brandColor : Color(.systemGray5), lineWidth: 1)
                )
                .foregroundStyle(item.rawValue == voiceId ? .white : .primary)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(item.label)
            .accessibilityValue(item.rawValue == voiceId ? "選択中" : "")
        }
    }

    private func voiceIcon(_ item: VoiceType) -> String {
        switch item {
        case .youngPolite: return "person.wave.2.fill"
        case .youngBlunt: return "person.fill"
        case .random: return "shuffle"
        }
    }

    // MARK: - 安心材料

    private var reassuranceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("いざという時のために", systemImage: "checkmark.shield")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(brandColor)
            reassuranceRow(icon: "bell.slash.fill", text: "マナーモード中でも音が鳴ります")
            reassuranceRow(icon: "airplane", text: "通信は不要。機内モードでも使えます")
            reassuranceRow(icon: "person.crop.circle.badge.xmark", text: "登録不要。アカウントはいりません")
            reassuranceRow(icon: "lock.shield.fill", text: "データ収集なし。選択は端末内だけに保存されます")
            Button {
                showGuide = true
            } label: {
                Label("事前に使い方を確認する", systemImage: "book.closed.fill")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity, minHeight: 46)
            }
            .buttonStyle(.bordered)

            Text("防犯の補助を目的としたアプリです。安全を完全に保証するものではありません。")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(cardBackground)
    }

    private func reassuranceRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(brandColor)
                .frame(width: 22)
                .accessibilityHidden(true)
            Text(text)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private func sectionHeader(title: String, caption: String, icon: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(brandColor)
                .frame(width: 24, height: 24)
                .background(Circle().fill(brandSurface))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                Text(caption)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - カウントダウン

    private var countdownOverlay: some View {
        Group {
            if let count = player.countdown {
                ZStack {
                    brandColor.ignoresSafeArea()
                    VStack(spacing: 22) {
                        Label("まもなく再生します", systemImage: "timer")
                            .font(.title3.bold())
                            .foregroundStyle(.white.opacity(0.92))

                        ZStack {
                            Circle()
                                .stroke(.white.opacity(0.22), lineWidth: 10)
                                .frame(width: 180, height: 180)
                            VStack(spacing: 0) {
                                Text("\(count)")
                                    .font(.system(size: 96, weight: .bold, design: .rounded))
                                    .contentTransition(.numericText())
                                Text("秒後")
                                    .font(.subheadline.weight(.semibold))
                            }
                            .foregroundStyle(.white)
                        }

                        VStack(spacing: 8) {
                            Text("「\(phrase.label)」")
                                .font(.title3.bold())
                                .multilineTextAlignment(.center)
                            Label("スピーカーをインターホンに近づけてください", systemImage: "iphone.radiowaves.left.and.right")
                                .font(.subheadline)
                                .foregroundStyle(.white.opacity(0.85))
                                .multilineTextAlignment(.center)
                        }
                        .foregroundStyle(.white)

                        Button {
                            player.cancelCountdown()
                        } label: {
                            Label("中止する", systemImage: "xmark.circle.fill")
                                .font(.headline)
                                .frame(maxWidth: .infinity, minHeight: 54)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.white)
                        .foregroundStyle(brandColor)

                        Text("画面のどこを触っても再生は止まりません")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.7))
                    }
                    .padding(28)
                }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: player.countdown)
    }

    private var cardBackground: some View {
        RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(Color(.systemBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color(.systemGray5), lineWidth: 1)
            )
    }

    // MARK: - スクリーンショット撮影用

    private func configureForLaunchArguments() {
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("-vgShowGuide") {
            showGuide = true
        }
        if let phraseIndex = arguments.firstIndex(of: "-vgPhrase"),
           arguments.indices.contains(phraseIndex + 1) {
            phraseId = Phrase.find(arguments[phraseIndex + 1]).id
        }
        if let voiceIndex = arguments.firstIndex(of: "-vgVoice"),
           arguments.indices.contains(voiceIndex + 1) {
            voiceId = VoiceType.find(arguments[voiceIndex + 1]).rawValue
        }
    }
}

#Preview {
    ContentView()
}
