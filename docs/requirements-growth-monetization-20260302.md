# 要件定義（SEO修正 + サイト拡張 + マネタイズ導線）

作成日: 2026-03-02
更新日: 2026-03-09（マネタイズ明確化フェーズ追加）

---

## 1. 背景と課題

### 前フェーズ（実装済み）
- Search Console で `guide.html` が「リダイレクトエラー」扱いになり、インデックス登録が進まなかった。
- canonical / og:url / sitemap / 内部リンクを拡張子なしURLに統一した。
- `safety-plan.html` を新規追加し、目的別導線を整備した。

### 現フェーズの課題（2026-03-09現在）
1. **アフィリエイトリンクが分散・ハードコードされている**
   - 3ページ（index, safety-plan, recommend-intercom, recommend-buzzer）に同一URLが複数記述。URLを変更する場合に全ページ修正が必要。
2. **クリック計測が存在しない**
   - GA4未実装。外部リンクのCTRが不明。
3. **CTAコピーが統一されていない**
   - 「楽天でEufyドアホンを見る」「Amazonで比較する」「楽天で防犯ブザーを見る」など表現が混在。
4. **開示ページ（disclosure）が存在しない**
   - 薬機法・景品表示法上のアフィリエイト開示が不十分。各ページの開示文はインラインのみ。
5. **「診断」という文言が一部に残存している可能性**（safety-plan.htmlの本文に「診断なし」あり → 本文の文脈では適切だが、CTAボタン文言の確認が必要）。

---

## 2. ファネル構造

```
[エントリー]
  index.html（アプリトップ）
  blog-*.html（記事：コエマモ比較、応答くん口コミ、他）
  guide.html（使い方ガイド）

        ↓ 内部リンク「比較ページを見る」

[比較・選定]
  safety-plan.html（防犯アイテム比較・目的別導線）
  recommend-intercom.html（スマートドアホン詳細比較）
  recommend-buzzer.html（防犯ブザー詳細比較）

        ↓ 外部CTA「楽天で見る」「Amazonで見る」

[外部購入]
  https://a.r10.to/hkx0UH（楽天 Eufy ドアホン）
  https://a.r10.to/hFtdXV（楽天 防犯ブザー）
  https://a.r10.to/h5AGFu（楽天 サンリオ防犯ブザー）
  https://www.amazon.co.jp/s?k=... （Amazon検索）
```

---

## 3. 目標KPI

| KPI | 計測方法 | 目標値（3ヶ月後） |
|-----|---------|----------------|
| 外部リンククリック率（CTR） | `aff_click` イベント | ページビューの3%以上 |
| safety-plan遷移率 | GA4 page_view推移 | index→safety-planで5%以上 |
| 比較ページCTR | `aff_click` の page別集計 | recommend-* ページで最高 |
| disclosure閲覧率 | GA4 page_view | 外部リンク1クリックにつき1%以上 |

---

## 4. 実装ポリシー

- **デザイン・SEO構造を壊さない**: styles.css の変更は原則なし。canonical/og:url の拡張子なし設定を維持。
- **段階的実装**: affiliate.js によるランタイム注入でURLの一元管理を実現。
- **グレースフルデグラデーション**: affiliate.js 読み込み失敗時もフォールバック href が有効。
- **計測オプション**: gtag/dataLayer どちらも不在の場合はサイレント（エラーなし）。

---

## 5. 実装スコープ（2026-03-09フェーズ）

### In-scope
1. `assets/affiliate-links.json` 作成（アフィリエイトURLの一元管理）
2. `assets/affiliate.js` 作成（ランタイムURL注入 + aff_click イベント送出）
3. 対象HTMLファイルへの `data-aff-key` / `data-slot` / `data-item` / `data-network` 属性付与
4. CTAコピー統一: 「楽天で見る」「Amazonで見る」「比較ページを見る」
5. `disclosure.html` 新規作成
6. 全対象ページのフッターに `/disclosure` リンク追加
7. `docs/requirements-growth-monetization-20260302.md` 更新（このファイル）

### Out-of-scope
- GA4タグの実装（affiliate.js はgtag存在時に連携するが、タグ自体は別途設定）
- フルリデザイン
- バックエンド・CMS導入
- 新コンテンツページの追加
- Amazon アソシエイトID取得・差し替え（現在はAmazon検索URLのまま）

---

## 6. イベント仕様

### イベント名: `aff_click`

| パラメータ | 型 | 説明 | 例 |
|----------|---|-----|---|
| `page` | string | `window.location.pathname` | `/safety-plan` |
| `slot` | string | ページ内の位置 | `hero`, `main`, `bottom` |
| `item` | string | 商品カテゴリ | `doorphone`, `buzzer`, `buzzer_design` |
| `network` | string | アフィリエイトネットワーク | `rakuten`, `amazon` |
| `destination` | string | 遷移先URL | `https://a.r10.to/hkx0UH` |

### 送出ロジック
```javascript
if (window.gtag) {
  gtag('event', 'aff_click', params);
} else if (window.dataLayer) {
  window.dataLayer.push({ event: 'aff_click', ...params });
}
// どちらもない場合: no-op
```

---

## 7. ファイル変更一覧（2026-03-09フェーズ）

| ファイル | 変更種別 | 主な変更内容 |
|--------|---------|------------|
| `assets/affiliate-links.json` | 新規作成 | アフィリエイトURL一覧 |
| `assets/affiliate.js` | 新規作成 | URL注入・クリックイベント |
| `docs/requirements-growth-monetization-20260302.md` | 更新 | このファイル |
| `index.html` | 更新 | data-aff-key付与、フッターdisclosureリンク追加 |
| `safety-plan.html` | 更新 | data-aff-key付与、CTAコピー統一、フッターdisclosureリンク追加 |
| `recommend-intercom.html` | 更新 | data-aff-key付与、CTAコピー統一、フッターdisclosureリンク追加 |
| `recommend-buzzer.html` | 更新 | data-aff-key付与、CTAコピー統一、フッターdisclosureリンク追加 |
| `guide.html` | 更新 | affiliate.js追加、フッターdisclosureリンク追加 |
| `blog-koemamo-comparison.html` | 更新 | affiliate.js追加、フッターdisclosureリンク追加 |
| `blog-outoukun-review.html` | 更新 | affiliate.js追加、フッターdisclosureリンク追加 |
| `disclosure.html` | 新規作成 | アフィリエイト開示ページ |

---

## 8. 非スコープ（次フェーズ候補）

1. **GA4タグ導入**: gtag.js をheadに追加してリアル計測を有効化
2. **Amazonアソシエイト**: 検索URLをアソシエイトIDつきに変更
3. **比較テーブルの構造化データ強化**: Product / Review スキーマ追加
4. **A/Bテスト**: CTAコピーのバリエーションテスト
5. **メールキャプチャ**: 無料チェックリストのオファーでリスト構築
