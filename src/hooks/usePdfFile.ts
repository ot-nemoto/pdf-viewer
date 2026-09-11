import { useCallback, useState } from "react";
import { fileNameFromUrl } from "../lib/pdfUrl";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.2;

// ズーム結果を 10% 刻みに丸める（フィットの実効倍率は半端な値になり得るため）
const stepScale = (s: number, delta: number) => Math.round((s + delta) * 10) / 10;

export type FitMode = "width" | "height" | "none";

/** ローカルファイル（File）か、取得元 URL（string）のいずれかを表示対象とする */
export type PdfSource = File | string;

const URL_LOAD_ERROR =
  "PDF を読み込めませんでした。配信元が外部サイトからの読み込みを許可していない（CORS）か、PDF として読み取れない可能性があります。";

export function usePdfFile() {
  const [file, setFile] = useState<PdfSource | null>(null);
  const [fileName, setFileName] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  // 読み込みに失敗した URL。別タブで開く導線の提示に使う
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  // 0〜1。総バイト数が不明な間は null
  const [progress, setProgress] = useState<number | null>(null);

  // 自動ページ送り（スライドショー）
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalSec, setIntervalSec] = useState(3);

  // フィット表示（デフォルトは幅に合わせる）
  const [fitMode, setFitMode] = useState<FitMode>("width");

  const resetViewState = useCallback(() => {
    setNumPages(0);
    setPageNumber(1);
    setScale(1.0);
    setIsPlaying(false);
    setFitMode("width");
    setProgress(null);
  }, []);

  const openFile = useCallback(
    (next: File) => {
      if (next.type !== "application/pdf" && !next.name.endsWith(".pdf")) {
        setError("PDF ファイルを選択してください");
        setErrorUrl(null);
        return;
      }
      setFile(next);
      setFileName(next.name);
      setError(null);
      setErrorUrl(null);
      resetViewState();
    },
    [resetViewState],
  );

  /**
   * URL を表示対象にする。
   * 拡張子なしで PDF を配信するホストがあるため URL 側では形式を判定せず、
   * PDF として読めるかは読み込み結果（onLoadError）に委ねる。
   */
  const openUrl = useCallback(
    (url: string) => {
      setFile(url);
      setFileName(fileNameFromUrl(url));
      setError(null);
      setErrorUrl(null);
      resetViewState();
    },
    [resetViewState],
  );

  const closeFile = useCallback(() => {
    setFile(null);
    setFileName("");
    setError(null);
    setErrorUrl(null);
    resetViewState();
  }, [resetViewState]);

  /** 読み込み開始前のエラー（URL パラメータの検証失敗など）を表示する */
  const reportError = useCallback((message: string) => {
    setError(message);
    setErrorUrl(null);
  }, []);

  const onDocumentLoad = useCallback((total: number) => {
    setNumPages(total);
    setProgress(null);
  }, []);

  const onLoadProgress = useCallback((loaded: number, total: number) => {
    setProgress(total > 0 ? Math.min(1, loaded / total) : null);
  }, []);

  const onLoadError = useCallback(
    (e: Error) => {
      // URL 読み込みの失敗は原因が配信側にあることが多く、別タブで開く導線を出す。
      // あわせて Empty 状態へ戻し、ドロップでの読み込みを続けられるようにする
      if (typeof file === "string") {
        setError(URL_LOAD_ERROR);
        setErrorUrl(file);
        setFile(null);
        setFileName("");
        setProgress(null);
        return;
      }
      setError(`読み込みに失敗しました: ${e.message}`);
      setErrorUrl(null);
    },
    [file],
  );

  const goPrev = useCallback(() => setPageNumber((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(
    () => setPageNumber((p) => Math.min(numPages || 1, p + 1)),
    [numPages],
  );

  // 手動ズームはフィットを解除する
  const zoomIn = useCallback(() => {
    setFitMode("none");
    setScale((s) => Math.min(MAX_SCALE, stepScale(s, SCALE_STEP)));
  }, []);
  const zoomOut = useCallback(() => {
    setFitMode("none");
    setScale((s) => Math.max(MIN_SCALE, stepScale(s, -SCALE_STEP)));
  }, []);
  const resetZoom = useCallback(() => {
    setFitMode("none");
    setScale(1.0);
  }, []);

  // 同じモードを再押下で解除（トグル）、別モードなら切り替え
  const toggleFit = useCallback(
    (mode: "width" | "height") => setFitMode((current) => (current === mode ? "none" : mode)),
    [],
  );

  // フィット中の実効倍率を scale に反映（フィット解除後の ±ズーム基準を揃える）
  const reportFitScale = useCallback((s: number) => setScale(s), []);

  const stopPlay = useCallback(() => setIsPlaying(false), []);

  const togglePlay = useCallback(() => {
    setIsPlaying((playing) => {
      if (playing) return false;
      // 最終ページで再生を押したら先頭に戻してから開始
      setPageNumber((p) => (numPages && p >= numPages ? 1 : p));
      return true;
    });
  }, [numPages]);

  return {
    file,
    fileName,
    numPages,
    pageNumber,
    scale,
    error,
    errorUrl,
    progress,
    isPlaying,
    intervalSec,
    fitMode,
    openFile,
    openUrl,
    closeFile,
    reportError,
    onDocumentLoad,
    onLoadProgress,
    onLoadError,
    goPrev,
    goNext,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFit,
    reportFitScale,
    togglePlay,
    stopPlay,
    setIntervalSec,
  };
}
