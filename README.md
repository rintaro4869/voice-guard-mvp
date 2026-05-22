# ひとり防犯ボイス MVP

配達対応時に男性の声をワンタップで再生できる、スマホWeb向けMVPです。

## ローカル起動

```bash
cd /Users/yamadarintaro/Desktop/Claude\ Projects/VoiceGuard
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。

## アフィリエイト自動メンテ

アフィリエイトURLは `assets/affiliate-links.json` で一元管理しています。

```bash
node scripts/check-affiliates.mjs
```

- レポートは `reports/affiliate-health.md` と `reports/affiliate-health.json` に出ます。
- `--write` を付けると、売り切れや販売終了を検知したリンクを `fallbackUrl` に切り替えます。
- GitHub Actions の `Affiliate Maintenance` が毎日自動で実行され、必要なときだけ `assets/affiliate-links.json` を更新します。

## マネタイズ方針

- 現在のアプリ/市場前提: `app-marketing-context.md`
- 2026-05-22 時点の収益化見直し方針: `docs/monetization-strategy-reset-20260522.md`
- 国内外のリサーチ込みの戦略書: `docs/global-monetization-strategy-20260522.md`
- 実行タスクの優先順: `docs/execution-roadmap-20260523.md`

## 音声ファイルの配置

`assets/audio/README.md` を参照してください。
