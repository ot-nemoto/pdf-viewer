# PDF ビュワー

![CI](https://github.com/ot-nemoto/pdf-viewer/actions/workflows/ci.yml/badge.svg)
![Version](https://img.shields.io/github/package-json/v/ot-nemoto/pdf-viewer)

PDF ファイルをブラウザ上でドラッグ＆ドロップして表示するビュワーです。ファイルはサーバーへアップロードされず、すべてクライアントサイドで完結します。

🔗 **デモ: https://ot-nemoto.github.io/pdf-viewer/**

## 主な機能

- PDF のドラッグ＆ドロップ表示（クリックでのファイル選択にも対応）
- ページ送り（ツールバー / `←` `→` / `PageUp` `PageDown`）
- ズーム（0.5〜3.0 倍）
- 自動ページ送り（1〜10 秒間隔のスライドショー）
- クライアントサイド完結（ファイルはサーバーへアップロードしない）

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/product.md](docs/product.md) | プロダクト定義（目的・対象ユーザー・成功指標） |
| [docs/architecture.md](docs/architecture.md) | 技術スタック・実装方針・非機能要件 |
| [docs/ui.md](docs/ui.md) | 画面遷移・機能挙動の契約・UI 規約 |
| [docs/development.md](docs/development.md) | 開発・デプロイ手順 |

## クイックスタート

```bash
npm install
npm run dev
```

詳細は [docs/development.md](docs/development.md) を参照。
