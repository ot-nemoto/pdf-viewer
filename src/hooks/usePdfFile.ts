import { useCallback, useState } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.2;

// ズーム結果を 10% 刻みに丸める（フィットの実効倍率は半端な値になり得るため）
const stepScale = (s: number, delta: number) => Math.round((s + delta) * 10) / 10;

export function usePdfFile() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  // 自動ページ送り（スライドショー）
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalSec, setIntervalSec] = useState(3);

  // 幅に合わせるフィット表示（デフォルト ON）
  const [fitWidth, setFitWidth] = useState(true);

  const openFile = useCallback((next: File) => {
    if (next.type !== "application/pdf" && !next.name.endsWith(".pdf")) {
      setError("PDF ファイルを選択してください");
      return;
    }
    setFile(next);
    setNumPages(0);
    setPageNumber(1);
    setScale(1.0);
    setError(null);
    setIsPlaying(false);
    setFitWidth(true);
  }, []);

  const closeFile = useCallback(() => {
    setFile(null);
    setNumPages(0);
    setPageNumber(1);
    setScale(1.0);
    setError(null);
    setIsPlaying(false);
    setFitWidth(true);
  }, []);

  const onDocumentLoad = useCallback((total: number) => {
    setNumPages(total);
  }, []);

  const onLoadError = useCallback((e: Error) => {
    setError(`読み込みに失敗しました: ${e.message}`);
  }, []);

  const goPrev = useCallback(() => setPageNumber((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(
    () => setPageNumber((p) => Math.min(numPages || 1, p + 1)),
    [numPages],
  );

  // 手動ズームはフィットを解除する
  const zoomIn = useCallback(() => {
    setFitWidth(false);
    setScale((s) => Math.min(MAX_SCALE, stepScale(s, SCALE_STEP)));
  }, []);
  const zoomOut = useCallback(() => {
    setFitWidth(false);
    setScale((s) => Math.max(MIN_SCALE, stepScale(s, -SCALE_STEP)));
  }, []);
  const resetZoom = useCallback(() => {
    setFitWidth(false);
    setScale(1.0);
  }, []);

  const toggleFitWidth = useCallback(() => setFitWidth((v) => !v), []);

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
    numPages,
    pageNumber,
    scale,
    error,
    isPlaying,
    intervalSec,
    fitWidth,
    openFile,
    closeFile,
    onDocumentLoad,
    onLoadError,
    goPrev,
    goNext,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFitWidth,
    reportFitScale,
    togglePlay,
    stopPlay,
    setIntervalSec,
  };
}
