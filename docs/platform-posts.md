# 各プラットフォーム用 投稿テンプレート

---

## 1. はてなブックマーク

### セルフブクマ対象URL（3つの新記事を優先）
1. https://voiceguardhitoribouhan.pages.dev/blog-interphone-irusu.html
2. https://voiceguardhitoribouhan.pages.dev/blog-hitorigurashi-bouhan.html
3. https://voiceguardhitoribouhan.pages.dev/blog-okihai-security.html
4. https://voiceguardhitoribouhan.pages.dev/

### コメント例（ブクマ時に入力）
- 記事1：「居留守のリスク、知らなかった。男性音声で応答するという発想は新しい」
- 記事2：「7つの習慣のうち洗濯物の工夫は目から鱗。すぐできるのが良い」
- 記事3：「置き配の盗難率0.01%未満は意外と低い。対策まとめが実用的」
- トップ：「ワンタップで男性の声を再生できる防犯ツール。ブラウザだけで動く」

※3ブクマ以上で新着エントリーに載る可能性あり。知人にもブクマをお願いすると効果的。

### タグ例
一人暮らし, 防犯, セキュリティ, 生活, Webサービス

---

## 2. Zenn 技術記事

### タイトル案
「一人暮らし女性向けの防犯Webアプリを個人開発した話【PWA / Cloudflare Pages】」

### 構成案
```
# 作ったもの
- ひとり防犯ボイス：男性音声をワンタップで再生するPWA
- URL: https://voiceguardhitoribouhan.pages.dev/

# なぜ作ったか
- 知人が「ゴールデンボンバーの音声素材」をYouTubeで再生して防犯対策していた
- インターホンが鳴ってからYouTubeを開くのは手間がかかる
- 「ワンタップで再生」に特化したツールが欲しかった

# 技術スタック
- フロントエンド: Vanilla JS（フレームワークなし）
- ホスティング: Cloudflare Pages
- 音声: WAVファイルをWeb Audio APIで再生
- PWA: manifest.json + Service Worker
- SEO: JSON-LD構造化データ（SoftwareApplication, FAQPage, BlogPosting）

# 市場調査
- 日本の女性単独世帯: 推計630〜950万世帯
- 競合: コエマモ（複合型）、男性応答アプリ（TTS）、声素材集アプリ
- 差別化: 配達対応に完全特化、ブラウザで完結、声タイプ切り替え

# 工夫したポイント
- セリフ×声タイプの組み合わせで「バレにくい」設計
- 「おまかせ」機能でセッション中は固定、次回起動時に再抽選
- 前回の選択をlocalStorageで復元
- 配達対応の5フレーズに絞ることで「迷わない」UX

# SEOの取り組み
- JSON-LD構造化データ（SoftwareApplication + FAQPage）
- 読み物コンテンツの充実（FAQ 8問、利用シーン解説、開発背景）
- ブログ記事6本で検索流入チャネルを拡大
- note記事からの被リンク構築

# 学び
- Cloudflare Pages（pages.dev）はフィッシング悪用でドメイン評価が低い
- Googleのサイトマップ取得がBot Fight Modeでブロックされる問題
- 独自ドメインの重要性を痛感

# まとめ
URL: https://voiceguardhitoribouhan.pages.dev/
```

### Zennのタグ
個人開発, PWA, JavaScript, SEO, CloudflarePages

---

## 3. Qiita 技術記事

### タイトル案
「Cloudflare Pagesで作った防犯PWAがGoogleにインデックスされない問題と対策」

### 構成案（SEO寄りの技術ネタ）
```
# はじめに
個人開発で防犯Webアプリを作りCloudflare Pagesにデプロイしたが、
Googleにインデックスされない問題にハマったので共有。

# 症状
- Search Consoleで「クロール済み - インデックス未登録」
- サイトマップが「読み込めませんでした」エラー
- URL検査の1日の割り当て上限にすぐ達する

# 原因調査
- pages.devドメインがフィッシング悪用で評価低下（Fortra: 198%増加）
- CloudflareのBot Fight ModeがGooglebotをブロック
- pages.devのセキュリティ設定はユーザー側で変更不可

# 対策
1. コンテンツを大幅強化（UIだけ→読み物2000字以上追加）
2. 構造化データ充実（SoftwareApplication + FAQPage + BlogPosting）
3. 外部被リンク構築（note, はてブ）
4. URL検査を分散送信（1日4-5件ずつ）
5. 独自ドメイン取得を検討

# 教訓
- pages.devはプロトタイピングには便利だが本番運用にはリスクあり
- 初回クロール時のコンテンツ品質が重要
- SEOは後からでは遅い、公開前に準備すべき
```

### Qiitaのタグ
CloudflarePages, SEO, GoogleSearchConsole, PWA, 個人開発

---

## 4. Reddit

### r/japanlife（英語）
```
Title: I made a free web app for women living alone in Japan - plays male voice responses through your intercom

Body:
A friend told me she plays Goldenbon's male voice clips from YouTube
as a security measure when delivery people ring her intercom.
But fumbling with YouTube when the doorbell rings isn't ideal.

So I built a simple PWA that plays male voice responses with one tap:
- "Hai" / "Haai"
- "Arigatou gozaimasu"
- "Genkan no mae ni oitoite kudasai" (please leave it at the door)

Free, no signup, works in any browser.
https://voiceguardhitoribouhan.pages.dev/

Currently Japanese only but if there's interest I can add English.
```

### r/japan or r/Tokyo
同様の内容を投稿

---

## 5. 個人開発コミュニティ（X のハッシュタグ #個人開発）

### 投稿文
```
【個人開発】一人暮らし女性向けの防犯Webアプリを作りました

「ひとり防犯ボイス」
男性の声でインターホンに応答できるPWA

技術: Vanilla JS + Cloudflare Pages
開発期間: 1週間
費用: 0円（音声録音以外）

想定市場: 女性単独世帯 630〜950万世帯
競合: コエマモ、男性応答アプリ
差別化: 配達対応特化、ブラウザ完結

https://voiceguardhitoribouhan.pages.dev/

フィードバックお待ちしてます！

#個人開発 #Webアプリ #PWA #防犯
```

---

## 6. 投稿スケジュール（今日〜3日間）

### 今日（2/11）
- [ ] X：パターン3（開発ストーリー型）を20:00に投稿
- [ ] はてブ：トップページ + 記事3本をブクマ
- [ ] note：3本の記事を投稿（30分間隔で）

### 明日（2/12）
- [ ] X：パターン1（共感型）を12:00に投稿
- [ ] X：パターン5（ノウハウ型）を20:00に投稿
- [ ] Zenn：技術記事を投稿
- [ ] Search Console：URL検査 朝3件・昼3件・夜3件

### 明後日（2/13）
- [ ] X：パターン4（問いかけ型）を20:00に投稿
- [ ] Qiita：SEO問題の技術記事を投稿
- [ ] Reddit：r/japanlifeに投稿
