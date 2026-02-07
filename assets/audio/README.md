# 音声ファイルの配置ルール

以下のフォルダ構成で音声ファイルを配置してください。
`app.js` ではこのパスを参照して再生します。

```
assets/audio/
  young_polite/
    hai.wav
    haai.wav
    arigatou.wav
    okidoki.wav
    shoushou.wav
  young_blunt/
    hai.wav
    haai.wav
    arigatou.wav
    okidoki.wav
    shoushou.wav
```

## ファイル形式
- 推奨: `wav`
- 例外: `mp3` や `m4a` にしたい場合は `app.js` の拡張子を合わせて変更してください。

## セリフ一覧
- `hai`: 「はい」
- `haai`: 「はーい」
- `arigatou`: 「ありがとうございます」
- `okidoki`: 「玄関の前に置いといてください」
- `shoushou`: 「少し待ってください」

必要に応じて `app.js` 内の `phrases` と `voices` を編集すると、セリフ数・声タイプ数の増減ができます。
