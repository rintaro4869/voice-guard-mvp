import SwiftUI

struct ContentView: View {
    @StateObject private var player = SoundPlayer()
    @AppStorage("vg_phrase") private var phraseId = "hai"
    @AppStorage("vg_voice") private var voiceId = VoiceType.youngPolite.rawValue
    @State private var showGuide = false

    private var phrase: Phrase { Phrase.find(phraseId) }
    private var voice: VoiceType { VoiceType.find(voiceId) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    playSection
                    phraseSection
                    voiceSection
                    silentModeNote
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("ひとり防犯ボイス")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
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
            .onAppear {
                // スクリーンショット撮影用の起動オプション
                if ProcessInfo.processInfo.arguments.contains("-vgShowGuide") {
                    showGuide = true
                }
            }
            .overlay { countdownOverlay }
        }
    }

    // MARK: - 再生（主役）

    private var playSection: some View {
        VStack(spacing: 16) {
            VStack(spacing: 4) {
                Text(phrase.label)
                    .font(.title2.bold())
                    .foregroundStyle(.primary)
                Text(currentVoiceCaption)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 16)

            Button {
                player.play(phrase: phrase, voice: voice)
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: player.isPlaying ? "speaker.wave.2.fill" : "play.fill")
                        .font(.system(size: 44, weight: .bold))
                    Text(player.isPlaying ? "再生中" : "再生")
                        .font(.headline)
                }
                .foregroundStyle(.white)
                .frame(width: 150, height: 150)
                .background(Circle().fill(Color.accentColor))
            }
            .accessibilityLabel("選択中のセリフを再生")

            HStack(spacing: 12) {
                Button {
                    player.playAfterCountdown(seconds: 3, phrase: phrase, voice: voice)
                } label: {
                    Label("3秒後に再生", systemImage: "timer")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .buttonStyle(.bordered)

                Button {
                    player.stop()
                } label: {
                    Label("停止", systemImage: "stop.fill")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .buttonStyle(.bordered)
                .tint(.secondary)
            }

            VStack(spacing: 4) {
                Text(player.statusText)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                if let error = player.errorText {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
                if player.isLowVolume {
                    Label("音量が小さめです。側面ボタンで上げてください", systemImage: "speaker.wave.1")
                        .font(.footnote)
                        .foregroundStyle(.orange)
                }
            }
            .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .background(card)
    }

    private var currentVoiceCaption: String {
        if voice == .random, let picked = player.lastRandomVoice {
            return "おまかせ（今回：\(picked.label)）"
        }
        return voice.label
    }

    // MARK: - セリフ選択

    private var phraseSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("セリフを選ぶ")
                .font(.headline)

            VStack(spacing: 0) {
                ForEach(Phrase.all) { item in
                    Button {
                        phraseId = item.id
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: item.id == phraseId ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(item.id == phraseId ? Color.accentColor : Color(.systemGray3))
                            Text(item.label)
                                .foregroundStyle(.primary)
                            Spacer()
                            Button {
                                phraseId = item.id
                                player.play(phrase: item, voice: voice)
                            } label: {
                                Image(systemName: "play.circle")
                                    .font(.title3)
                                    .foregroundStyle(Color.accentColor)
                                    .frame(width: 44, height: 44)
                            }
                            .accessibilityLabel("\(item.label)を再生")
                        }
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)

                    if item.id != Phrase.all.last?.id {
                        Divider()
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(card)
    }

    // MARK: - 声タイプ選択

    private var voiceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("声のタイプ")
                .font(.headline)

            HStack(spacing: 8) {
                ForEach(VoiceType.allCases) { item in
                    Button {
                        voiceId = item.rawValue
                        if item == .random {
                            player.lastRandomVoice = nil
                        }
                    } label: {
                        Text(item.shortLabel)
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(item.rawValue == voiceId ? Color.accentColor : Color(.systemGray6))
                            )
                            .foregroundStyle(item.rawValue == voiceId ? .white : .primary)
                    }
                }
            }

            if voice == .random {
                Text("再生するたびに声がランダムに変わります。毎回同じ声だと不自然になるのを防ぎます。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(card)
    }

    private var silentModeNote: some View {
        Label("マナーモード中でも音が鳴ります。とっさの場面でも安心です。", systemImage: "bell.slash")
            .font(.footnote)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(card)
    }

    private var countdownOverlay: some View {
        Group {
            if let count = player.countdown {
                ZStack {
                    Color.black.opacity(0.55).ignoresSafeArea()
                    VStack(spacing: 16) {
                        Text("\(count)")
                            .font(.system(size: 96, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .contentTransition(.numericText())
                        Text("秒後に「\(phrase.label)」を再生")
                            .font(.headline)
                            .foregroundStyle(.white)
                        Button("キャンセル") {
                            player.cancelCountdown()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.white.opacity(0.25))
                    }
                }
                .onTapGesture {
                    player.cancelCountdown()
                }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: player.countdown)
    }

    private var card: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color(.systemBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color(.systemGray5), lineWidth: 1)
            )
    }
}

#Preview {
    ContentView()
}
