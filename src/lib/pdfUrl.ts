/** `?pdf=` の解析結果。未指定・不正・正常を呼び出し側で出し分けるための型 */
export type PdfUrlParam =
  | { status: "none" }
  | { status: "ok"; url: string }
  | { status: "invalid"; reason: string };

// file: / javascript: / data: などを弾き、ネットワーク越しの取得のみ許可する
const ALLOWED_PROTOCOLS = ["http:", "https:"];

const FALLBACK_FILE_NAME = "document.pdf";

/**
 * クエリ文字列から `pdf` パラメータを取り出し、http / https の絶対 URL のみ受け付ける。
 * `url` は Vite の dev サーバーが特殊 import として予約しており（?url / ?raw は 403）、
 * ローカル開発で動作確認できなくなるためパラメータ名に使わない。
 *
 * `pageProtocol` には呼び出し側のページの protocol（`location.protocol`）を渡す。
 */
export function parsePdfUrlParam(search: string, pageProtocol: string): PdfUrlParam {
  const raw = new URLSearchParams(search).get("pdf")?.trim();
  if (!raw) return { status: "none" };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { status: "invalid", reason: "URL の形式が正しくありません" };
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { status: "invalid", reason: "http / https の URL のみ開けます" };
  }

  // https で配信されたページからは http の URL を取得できない（混在コンテンツとして
  // ブラウザがブロックする）。読み込ませてから CORS エラーとして見せると原因を
  // 誤らせるため、ダイアログを出す前に弾く
  if (parsed.protocol === "http:" && pageProtocol === "https:") {
    return {
      status: "invalid",
      reason: "https のページからは http の URL を開けません（混在コンテンツ）",
    };
  }

  return { status: "ok", url: parsed.href };
}

/**
 * URL のパス末尾をファイル名として使う。
 * Content-Disposition は CORS 越しに読めないため、名前は URL からしか得られない。
 * 拡張子がなくても意味のある名前（例: arXiv の ID）になるためそのまま採用する。
 */
export function fileNameFromUrl(url: string): string {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return FALLBACK_FILE_NAME;
  }

  const segments = pathname.split("/");
  const last = segments[segments.length - 1];
  if (!last) return FALLBACK_FILE_NAME;

  try {
    return decodeURIComponent(last);
  } catch {
    // 不正なパーセントエンコードはデコードせずそのまま見せる
    return last;
  }
}

const UNITS = ["KB", "MB", "GB", "TB"];

/** ダイアログでダウンロード量を伝えるためのサイズ表記 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;

  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${UNITS[unit]}`;
}
