# アーキテクチャ

## 技術スタック

| 分類 | 採用技術 | 役割・意図 |
|------|---------|-----------|
| UI | React + TypeScript | 関数コンポーネント + hooks |
| ビルド | Vite | dev server / 本番ビルド |
| PDF 描画 | react-pdf（PDF.js） | worker を Web Worker で実行し UI をブロックしない |
| lint / format | Biome | ESLint / Prettier は不使用 |
| テスト | Vitest + Testing Library（jsdom） | ロジックを集約する hooks のユニットテスト |
| CI/CD | GitHub Actions | lint+test / Pages デプロイ / バージョン自動化 |
| ホスティング | GitHub Pages | 静的配信、クライアント完結 |

> バージョンは常に `package.json` を正とする（ここに数値は書かない）。バージョン固有の注意点のみ本ファイル末尾に追記する。

## 状態管理

状態とその操作は `usePdfFile` フックに集約する（開いているファイル・総ページ数・現在ページ・倍率・エラー・自動送りの再生状態と間隔）。
コンポーネントは表示と入力の受け渡しに徹し、ロジックを持たない。副作用（キーボード操作・自動ページ送りのタイマー）は親コンポーネントの `useEffect` に置く。

## PDF.js worker

Vite 環境では `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)` で worker をバンドルし、`pdfjs.GlobalWorkerOptions.workerSrc` に設定する（`?url` ではなく `new URL(...)` 形式が安定）。`base` を設定していても worker パスは自動解決される。

## ビルド / デプロイ方式

- **base**: GitHub Pages のプロジェクトページ配下（`/pdf-viewer/`）で配信するため `vite.config.ts` に `base` を設定
- **出力先**: デプロイワークフローの公開対象に合わせ `build.outDir` を設定
- **スクリプト**: `build:static` は `build` に委譲（定義の単一化）
- **デプロイ**: `develop` への push で `deploy-github-pages.yml` がビルド成果物を GitHub Pages へ公開

詳細な手順は [development.md](development.md) を参照。

## 非機能要件

| 項目 | 要件・意図 |
|------|-----------|
| プライバシー | ファイルはクライアント内で処理し、サーバーへ送信しない |
| パフォーマンス | PDF 描画は Web Worker で行い UI をブロックしない |
| 対応環境 | モダンブラウザ（ES Modules 対応） |
| デプロイ | 静的ホスティング（GitHub Pages）で動作する |
| 保守性 | lint/format を Biome に統一、ロジックは hooks に集約しユニットテストで担保 |

## 契約（URL パラメータ）

`?pdf=<PDF の URL>` で起動時に開く PDF を指定できる。受け付けるのは `http:` / `https:` の絶対 URL のみで、必ず確認ダイアログでの承認を経て読み込む（無検証の自動読み込みを行わない）。詳細な挙動は [ui.md](ui.md) を正とする。

ローカルファイルのパス（`file:`）は指定できない。ブラウザは https で配信されたページから `file:` を読み取れず、パス文字列からファイル実体を得る手段も持たないため（ローカルファイルはドロップ／ファイル選択で開く）。

## 環境変数

現時点で必要な環境変数はない（すべてクライアント完結・外部サービス連携なし）。

## ブランチ / バージョン運用

- `develop`（作業）→ `master`（リリース）の 2 ブランチ。マージは必ず PR
- `bump:minor` / `bump:patch` ラベルでバージョン自動バンプ、master push で Release 自動生成
- 依存更新は Dependabot（npm / devcontainers / github-actions、いずれも develop 宛て）

## バージョン固有の注意点

- **react-pdf**: `AnnotationLayer.css` / `TextLayer.css` の import が必要（`src/pdfWorker.ts` で読み込み。省くと警告が出る）
- **Biome**: linter ルールは preset 形式で指定する（`recommended: true` の直接指定は非推奨）
- **PDF.js の範囲リクエスト（`?pdf=` での表示）**: PDF.js はレスポンスの `Accept-Ranges: bytes` を読めた場合のみ部分取得（Range リクエスト）に切り替える。`Accept-Ranges` は CORS 安全リストの応答ヘッダーではないため、クロスオリジン配信では配信側に `Access-Control-Expose-Headers: Accept-Ranges, Content-Range, Content-Length` が必要。未設定だと全体をダウンロードし終えるまで 1 ページ目が表示されない（大きな PDF で顕著）
- **CORS 越しに読めるヘッダー**: `Content-Length` は CORS 安全リストのため expose 設定なしでも読める（確認ダイアログのサイズ表示に利用）。`Content-Disposition` は読めないため、ファイル名は URL のパス末尾から導出する
