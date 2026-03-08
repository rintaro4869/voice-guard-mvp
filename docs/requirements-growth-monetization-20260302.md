# 要件定義（SEO修正 + サイト拡張 + マネタイズ導線）

作成日: 2026-03-02

## 1. 背景と課題
- Search Console で `guide.html` が「リダイレクトエラー」扱いになり、インデックス登録が進まない。
- 実際の配信挙動は Cloudflare Pages の Pretty URL により `.html -> 拡張子なし` へ `308` リダイレクト。
- 一方でサイト内部は `canonical / og:url / sitemap / 内部リンク` が `.html` で統一されており、正規URL定義が不一致。
- 検索流入が増加傾向にあるため、情報拡充と収益導線の強化が必要。

## 2. 目的
- インデックス障害の解消（正規URLを 200 レスポンスのURLに統一）。
- 検索流入ユーザーの回遊率を上げる。
- 「無料利用 -> 比較検討 -> 外部購入」のマネタイズ導線を設計・実装する。

## 3. 成果指標（KPI）
- 技術SEO:
  - `Submitted URL seems to be a Soft 404 / Redirect error` の解消。
  - サイトマップ送信URLの `200` 応答率 100%。
- 回遊:
  - `safety-plan` への遷移率（トップ・記事からのクリック率）を計測。
- 収益導線:
  - 外部購入リンク（Amazon/楽天）クリック率。
  - 比較記事 (`blog-koemamo-comparison`, `blog-outoukun-review`) からの導線クリック率。

## 4. 機能要件
1. URL正規化
- canonical / og:url / JSON-LD `mainEntityOfPage` を拡張子なしURLに統一。
- 内部リンクを拡張子なしURLへ統一。
- `sitemap.xml` の `loc` も拡張子なしURLに統一。

2. 収益導線ページ
- 新規ページ `safety-plan` を追加。
- 診断なしで目的別に選べる導線を返す（無料開始 / ドアホン比較 / ブザー比較）。
- 外部購入先への CTA を設置。
- プロモーションリンク注意書きを表示。

3. 既存ページの導線強化
- トップ、ガイド、比較記事、おすすめ記事に `safety-plan` への内部導線を追加。
- 比較記事に「実践導線」セクションを追加し、次アクションを明示。

## 5. 非機能要件
- 既存デザインシステム（`styles.css`）との視覚的一貫性を維持。
- モバイル表示で崩れないこと。
- 外部リンクは `rel=\"sponsored nofollow noopener noreferrer\"` を付与。

## 6. 実装内容（今回）
- URL正規化:
  - 全HTMLの canonical / og:url / mainEntityOfPage を拡張子なしへ変更。
  - 全内部リンクを拡張子なしへ変更（トップは `./`）。
  - `sitemap.xml` を更新し、`safety-plan` を追加。
- 新規ページ:
  - `safety-plan.html` を追加（比較導線 + CTA + 開示文）。
- 既存ページ改修:
  - `index.html`, `guide.html`, `blog-koemamo-comparison.html`, `blog-outoukun-review.html`, `recommend-intercom.html`, `recommend-buzzer.html` に導線追加。
- スタイル追加:
  - 導線カード用スタイルを `styles.css` に追加。

## 7. 運用要件（反映後に実施）
1. Search Console で `https://voiceguardhitoribouhan.pages.dev/sitemap.xml` を再送信。
2. URL検査で `https://voiceguardhitoribouhan.pages.dev/guide` を「インデックス登録をリクエスト」。
3. 旧URL `.../guide.html` は再送信しない。
4. 1週間はカバレッジとクリック推移を日次確認。

## 8. 次フェーズ候補
1. 実アフィリエイトID差し替え（現在は導線基盤を先行実装）。
2. 記事ごとのクリック計測（GA4イベント or 軽量計測タグ）。
3. 比較記事の Product / FAQ 構造化データ強化。
