# テスト方針

## テスト種別

| 種別 | ツール | 対象 |
|------|--------|------|
| ユニットテスト | Vitest + Testing Library（jsdom） | ロジックを集約する hooks・ユーティリティ関数 |
| 手動動作確認 | 実機（ブラウザ） | UI 表示・操作・エラー表示（[e2e-scenarios.md](e2e-scenarios.md)） |

## 完了条件

- `src/hooks/` 配下のフックは **ユニットテストの作成をもって完了**とする
- 純粋なユーティリティ関数も同様にユニットテストを作成する
- UI コンポーネントのユニットテストは必須としない（表示・操作は手動確認でカバー）

## カバレッジ方針

- ロジックの分岐（境界値・クランプ・状態遷移）を優先的にカバーする
- 例: `usePdfFile` ではページ送りのクランプ、ズームの上下限、自動送りトグル、最終ページでの再生開始、closeFile によるリセットを検証する
- カバレッジ率の数値目標は設けず、「ロジックの分岐が検証されていること」を基準とする

## 実行手順

```bash
npm run test        # 一括実行（vitest run）
```

- 設定は `vite.config.ts` の `test`（`environment: "jsdom"`、`setupFiles: ["./src/test/setup.ts"]`）
- `src/test/setup.ts` で `@testing-library/jest-dom/vitest` を読み込み、DOM マッチャを有効化する

## CI

`.github/workflows/ci.yml` が `develop` / `master` への PR で以下を実行する（Node 24）。

1. `npm ci`
2. `npm run lint`（Biome）
3. `npm run test`（Vitest）
