# PDF ビュワー

![CI](https://github.com/ot-nemoto/pdf-viewer/actions/workflows/ci.yml/badge.svg)
![Version](https://img.shields.io/github/package-json/v/ot-nemoto/pdf-viewer)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

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
| [docs/requirements.md](docs/requirements.md) | 機能要件・非機能要件 |
| [docs/architecture.md](docs/architecture.md) | 技術スタック・ディレクトリ構成・ビルドモード |
| [docs/ui.md](docs/ui.md) | 画面一覧・コンポーネント・UI 規約 |
| [docs/development.md](docs/development.md) | 開発・デプロイ手順 |
| [docs/testing.md](docs/testing.md) | テスト方針・カバレッジ規約 |
| [docs/e2e-scenarios.md](docs/e2e-scenarios.md) | E2E テストシナリオ |
| [docs/tasks.md](docs/tasks.md) | タスク管理・フェーズ構成 |

## クイックスタート

```bash
npm install
npm run dev
```

詳細は [docs/development.md](docs/development.md) を参照。
