# voice-guard-mvp プロジェクト

## デプロイ手順

このプロジェクトは **GitHub → Cloudflare Pages 自動デプロイ** で運用しています。
Wrangler は不要です。

### 手順

1. ファイルを編集する
2. 以下の3コマンドをTerminalで実行する：

```
git -C ~/Downloads/voice-guard-mvp add -A
git -C ~/Downloads/voice-guard-mvp commit -m "変更内容"
git -C ~/Downloads/voice-guard-mvp push
```

3. Cloudflare Pages が自動でデプロイする（1〜2分）

### 確認URL

https://voiceguardhitoribouhan.pages.dev

### リポジトリ

https://github.com/rintaro4869/voice-guard-mvp
