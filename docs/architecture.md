# アーキテクチャ

## 技術スタック

| 分類 | 採用技術 | 備考 |
|------|---------|------|
| UI | React 18 + TypeScript | 関数コンポーネント + hooks |
| ビルド | Vite 5 | dev server / 本番ビルド |
| PDF 描画 | react-pdf 9（PDF.js） | worker を Web Worker で実行 |
| lint / format | Biome | ESLint / Prettier は不使用 |
| テスト | Vitest + Testing Library（jsdom） | hooks のユニットテスト |
| CI/CD | GitHub Actions | lint+test / Pages デプロイ / バージョン自動化 |
| ホスティング | GitHub Pages | 静的配信、クライアント完結 |

> バージョンは常に `package.json` を正とする。バージョン固有の注意点は本ファイルに追記する。

## ディレクトリ構成

```
pdf-viewer/
├─ index.html
├─ vite.config.ts          # base=/pdf-viewer/, outDir=out, vitest 設定
├─ biome.json              # lint/format 設定（slow-query-viewer 準拠）
├─ package.json
├─ src/
│  ├─ main.tsx             # エントリ
│  ├─ App.tsx              # レイアウト・状態の親・キーボード/自動送りの副作用
│  ├─ pdfWorker.ts         # PDF.js worker と react-pdf CSS の初期化
│  ├─ styles.css
│  ├─ components/
│  │  ├─ DropZone.tsx      # D&D 受け口・ファイル選択
│  │  ├─ Toolbar.tsx       # ページ送り/ズーム/自動送り/閉じる
│  │  └─ PdfViewer.tsx     # react-pdf で描画
│  ├─ hooks/
│  │  └─ usePdfFile.ts     # 状態と操作を集約（テスト対象）
│  └─ test/
│     └─ setup.ts          # jest-dom マッチャ登録
├─ docs/                   # 本ドキュメント群
└─ .github/                # workflows / dependabot
```

## 状態管理

状態とその操作は `usePdfFile` フックに集約する（`file` / `numPages` / `pageNumber` / `scale` / `error` / `isPlaying` / `intervalSec`）。
コンポーネントは表示と入力の受け渡しに徹し、ロジックを持たない。副作用（キーボード操作・自動ページ送りのタイマー）は `App.tsx` の `useEffect` に置く。

## PDF.js worker

Vite 環境では `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)` で worker をバンドルし、`pdfjs.GlobalWorkerOptions.workerSrc` に設定する（`src/pdfWorker.ts`）。`base` を設定していても worker パスは自動解決される。

## ビルド / デプロイ方式

- **base**: GitHub Pages のプロジェクトページ配下（`/pdf-viewer/`）で配信するため `vite.config.ts` に `base: "/pdf-viewer/"` を設定
- **出力先**: デプロイワークフローの公開対象に合わせ `build.outDir: "out"`
- **スクリプト**: `build:static` は `build` に委譲（定義の単一化）
- **デプロイ**: `develop` への push で `deploy-github-pages.yml` が `out/` を GitHub Pages へ公開

詳細な手順は [development.md](development.md) を参照。

## 環境変数

現時点で必要な環境変数はない（すべてクライアント完結・外部サービス連携なし）。

## ブランチ / バージョン運用

- `develop`（作業）→ `master`（リリース）の 2 ブランチ。マージは必ず PR
- `bump:minor` / `bump:patch` ラベルでバージョン自動バンプ、master push で Release 自動生成
- 依存更新は Dependabot（npm / devcontainers / github-actions、いずれも develop 宛て）

## バージョン固有の注意点

- **react-pdf 9**: `AnnotationLayer.css` / `TextLayer.css` の import が必要（`src/pdfWorker.ts` で読み込み）
- **Biome 2.x**: linter ルールは `preset: "recommended"`（`recommended: true` は非推奨）
