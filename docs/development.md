# 開発・運用手順

## 前提

- Node.js 24 系（CI・devcontainer と統一）
- npm

devcontainer（`.devcontainer/devcontainer.json`）を使う場合は VS Code の Dev Containers 拡張で「Reopen in Container」する。イメージは `mcr.microsoft.com/devcontainers/typescript-node:24-bookworm`、`node` ユーザーで動作し、ポート 5173 を転送する。

## ローカルセットアップ

```bash
npm install
npm run dev
```

→ http://localhost:5173/

> devcontainer 内から起動する場合、`vite.config.ts` の `server.host: true`（= `vite --host`）によりホストのブラウザからアクセスできる。

## スクリプト

| コマンド | 内容 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック（`tsc --noEmit`）＋本番ビルド（`out/` 出力） |
| `npm run build:static` | `build` に委譲（デプロイワークフローが使用） |
| `npm run preview` | ビルド成果物のプレビュー |
| `npm run lint` | Biome チェック（lint + format 検査） |
| `npm run format` | Biome による自動整形 |
| `npm run test` | ユニットテスト（Vitest） |

## 環境変数

現時点で必要な環境変数はない。

## ブランチ運用

- 作業は `develop` から `feature/t<番号>-<概要>` を切って行う
- `develop` / `master` へのマージは必ず PR を作成し、承認後にマージする（直接コミット禁止）
- Issue 着手・PR・レビュー対応の詳細は [`../CLAUDE.md`](../CLAUDE.md) を参照

## デプロイ手順

- `develop` への push を契機に `deploy-github-pages.yml` が実行され、`out/` を GitHub Pages へ公開する
- 公開 URL: https://ot-nemoto.github.io/pdf-viewer/
- 手動実行する場合は Actions から `Deploy to GitHub Pages` を `workflow_dispatch` で起動する

### 前提設定（初回のみ）

- リポジトリを public にする
- Settings → Pages → Source を「GitHub Actions」に設定する

## リリース手順

1. `develop` に変更を蓄積する
2. `auto-pr-to-master.yml`（日次 / 手動）が `develop → master` の PR を作成し、含まれる Issue のラベルから `bump:minor/patch` を付与する
3. その PR に付いた bump ラベルで `bump-version.yml` が `package.json` の version を自動更新する
4. PR をマージすると `release.yml` が tag（`vX.Y.Z`）と GitHub Release を自動生成する

## 依存更新

Dependabot が週次で更新 PR を `develop` 宛てに作成する（`npm` / `devcontainers` / `github-actions`）。
