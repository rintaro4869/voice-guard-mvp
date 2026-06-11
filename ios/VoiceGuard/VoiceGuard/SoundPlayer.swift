import AVFoundation
import Combine
import UIKit

@MainActor
final class SoundPlayer: NSObject, ObservableObject {
    @Published var isPlaying = false
    @Published var countdown: Int? = nil
    @Published var statusText = "再生ボタンを押すとすぐ流れます"
    @Published var errorText: String? = nil
    @Published var lastRandomVoice: VoiceType? = nil

    private var player: AVAudioPlayer?
    private var countdownTask: Task<Void, Never>? = nil

    override init() {
        super.init()
        // マナーモード（サイレントスイッチON）でも必ず鳴らす
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
    }

    var isLowVolume: Bool {
        AVAudioSession.sharedInstance().outputVolume < 0.25
    }

    func resolveVoice(_ voice: VoiceType) -> VoiceType {
        guard voice == .random else { return voice }
        let picked = VoiceType.concreteVoices.randomElement() ?? .youngPolite
        lastRandomVoice = picked
        return picked
    }

    func play(phrase: Phrase, voice: VoiceType) {
        cancelCountdown()
        stop(silently: true)
        errorText = nil

        let resolved = resolveVoice(voice)
        guard let url = Bundle.main.url(
            forResource: "\(resolved.rawValue)_\(phrase.id)",
            withExtension: "wav"
        ) else {
            errorText = "音声ファイルが見つかりませんでした。"
            return
        }

        do {
            try AVAudioSession.sharedInstance().setActive(true)
            let player = try AVAudioPlayer(contentsOf: url)
            player.delegate = self
            self.player = player
            player.play()
            isPlaying = true
            statusText = "再生中：\(phrase.label)（\(resolved.label)）"
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        } catch {
            errorText = "再生に失敗しました。もう一度タップしてください。"
            isPlaying = false
        }
    }

    func playAfterCountdown(seconds: Int, phrase: Phrase, voice: VoiceType) {
        cancelCountdown()
        stop(silently: true)
        errorText = nil
        statusText = "まもなく再生します…"

        countdownTask = Task { [weak self] in
            for remaining in stride(from: seconds, through: 1, by: -1) {
                guard let self, !Task.isCancelled else { return }
                self.countdown = remaining
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            guard let self, !Task.isCancelled else { return }
            self.countdown = nil
            self.play(phrase: phrase, voice: voice)
        }
    }

    func cancelCountdown() {
        countdownTask?.cancel()
        countdownTask = nil
        countdown = nil
    }

    func stop(silently: Bool = false) {
        cancelCountdown()
        player?.stop()
        player = nil
        if isPlaying || !silently {
            isPlaying = false
            if !silently {
                statusText = "停止しました"
            }
        }
    }
}

extension SoundPlayer: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            self.isPlaying = false
            self.statusText = "再生しました。もう一度押すと再生できます"
        }
    }
}
