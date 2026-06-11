import Foundation

struct Phrase: Identifiable, Equatable {
    let id: String
    let label: String

    static let all: [Phrase] = [
        Phrase(id: "hai", label: "はい"),
        Phrase(id: "haai", label: "はーい"),
        Phrase(id: "arigatou", label: "ありがとうございます"),
        Phrase(id: "okidoki", label: "玄関の前に置いといてください"),
        Phrase(id: "shoushou", label: "少し待ってください")
    ]

    static func find(_ id: String) -> Phrase {
        all.first { $0.id == id } ?? all[0]
    }
}

enum VoiceType: String, CaseIterable, Identifiable {
    case youngPolite = "young_polite"
    case youngBlunt = "young_blunt"
    case random = "random"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .youngPolite: return "若めの声（丁寧）"
        case .youngBlunt: return "若めの声（素っ気ない）"
        case .random: return "おまかせ"
        }
    }

    var shortLabel: String {
        switch self {
        case .youngPolite: return "丁寧"
        case .youngBlunt: return "素っ気ない"
        case .random: return "おまかせ"
        }
    }

    static let concreteVoices: [VoiceType] = [.youngPolite, .youngBlunt]

    static func find(_ id: String) -> VoiceType {
        VoiceType(rawValue: id) ?? .youngPolite
    }
}
