# Dev Container

React + Vite（TypeScript）用の開発コンテナ設定です。

## 使い方

1. VS Code に **Dev Containers** 拡張を入れる
2. コマンドパレット → **Dev Containers: Reopen in Container**
3. 初回はイメージ取得＋`npm install`（package.json がある場合）が走る

## 構成

| 項目 | 内容 |
|------|------|
| ベースイメージ | `mcr.microsoft.com/devcontainers/typescript-node:22-bookworm` |
| Node.js | 22 (LTS) |
| ユーザー | `node`（非root） |
| 転送ポート | `5173`（Vite dev server） |

## 注意: Vite をコンテナ外から見るには `--host` が必要

コンテナ内の `localhost` はホストとは別物のため、dev server を全インターフェースで
待ち受けさせないとホストのブラウザから開けません。以下のどちらかを設定してください。

```jsonc
// package.json
"scripts": {
  "dev": "vite --host"
}
```

または

```ts
// vite.config.ts
export default defineConfig({
  server: { host: true }
})
```
