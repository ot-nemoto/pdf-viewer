# PDF Viewer

ブラウザだけで完結する、ドラッグ＆ドロップ対応の PDF ビュワー。

🔗 **デモ: https://ot-nemoto.github.io/pdf-viewer/**

## 機能

- PDF をドラッグ＆ドロップ（またはクリック選択）で表示
- ページ送り（ツールバー / `←` `→` / `PageUp` `PageDown`）
- ズーム（0.5〜3.0 倍）
- 自動ページ送り（1〜10 秒間隔のスライドショー）
- すべてクライアントサイド完結（ファイルはサーバーへアップロードされません）

## 技術スタック

- React + TypeScript + Vite
- react-pdf（PDF.js）
- Biome（lint / format）・Vitest（test）

## クイックスタート

```bash
npm install
npm run dev
```

→ http://localhost:5173/

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド（`out/` に出力） |
| `npm run lint` | Biome によるチェック |
| `npm run format` | Biome による自動整形 |
| `npm run test` | ユニットテスト（Vitest） |

## デプロイ

`develop` への push を契機に、GitHub Actions が GitHub Pages へ自動デプロイします。
