/** 自動ページ送りの間隔（秒）の選択肢。ツールバーと `?interval=` の検証で共有する */
export const INTERVAL_OPTIONS = [1, 2, 3, 5, 10];

export const DEFAULT_INTERVAL_SEC = 3;

/** 開いた直後の自動ページ送りの状態 */
export type SlideshowOptions = { autoplay: boolean; intervalSec: number };

/** `?pdf=` の解析結果。未指定・不正・正常を呼び出し側で出し分けるための型 */
export type PdfUrlParam =
  | { status: "none" }
  | ({ status: "ok"; url: string } & SlideshowOptions)
  | { status: "invalid"; reason: string };

// `?pdf=` と併用できるパラメータ。これ以外のキーは未エンコード URL の断片とみなす
const KNOWN_PARAMS = ["pdf", "autoplay", "interval"];

// file: / javascript: / data: などを弾き、ネットワーク越しの取得のみ許可する
const ALLOWED_PROTOCOLS = ["http:", "https:"];

const FALLBACK_FILE_NAME = "document.pdf";

const ENCODE_HINT = "URL は encodeURIComponent でエンコードして指定してください";

/**
 * クエリ文字列から `pdf` パラメータを取り出し、http / https の絶対 URL のみ受け付ける。
 * `url` は Vite の dev サーバーが特殊 import として予約しており（?url / ?raw は 403）、
 * ローカル開発で動作確認できなくなるためパラメータ名に使わない。
 *
 * `pageProtocol` には呼び出し側のページの protocol（`location.protocol`）を渡す。
 */
export function parsePdfUrlParam(search: string, pageProtocol: string): PdfUrlParam {
  const params = new URLSearchParams(search);
  const raw = params.get("pdf")?.trim();
  if (!raw) return { status: "none" };

  // 生の URL をそのまま連結したリンクは、URL 側のクエリが `&` で切られ、`+` が
  // 空白に変換されて別の URL になる（署名付き URL で顕在化する）。
  // 黙って壊れた URL を開きにいかず、エンコードが必要であることを伝える。
  // 既知のパラメータと同名のキーが URL 側にある場合は検出できない
  const keys = [...params.keys()];
  if (keys.some((key) => !KNOWN_PARAMS.includes(key)) || new Set(keys).size < keys.length) {
    return { status: "invalid", reason: `URL のクエリ文字列が失われています。${ENCODE_HINT}` };
  }
  if (raw.includes(" ")) {
    return { status: "invalid", reason: `URL に空白（または +）が含まれます。${ENCODE_HINT}` };
  }

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

  const autoplay = params.get("autoplay");
  if (autoplay !== null && autoplay !== "1" && autoplay !== "0") {
    return {
      status: "invalid",
      reason: "autoplay には 1（オン）または 0（オフ）を指定してください",
    };
  }

  // Number("") は 0、Number(" 5") は 5 になるため、数値化前に文字列で照合する
  const interval = params.get("interval");
  if (interval !== null && !INTERVAL_OPTIONS.map(String).includes(interval)) {
    return {
      status: "invalid",
      reason: `interval には ${INTERVAL_OPTIONS.join(" / ")} のいずれか（秒）を指定してください`,
    };
  }

  return {
    status: "ok",
    url: parsed.href,
    autoplay: autoplay === "1",
    intervalSec: interval === null ? DEFAULT_INTERVAL_SEC : Number(interval),
  };
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
