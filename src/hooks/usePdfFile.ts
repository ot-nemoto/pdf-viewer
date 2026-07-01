import { useCallback, useState } from "react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.2;

export function usePdfFile() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  // 自動ページ送り（スライドショー）
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalSec, setIntervalSec] = useState(3);

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
  }, []);

  const closeFile = useCallback(() => {
    setFile(null);
    setNumPages(0);
    setPageNumber(1);
    setScale(1.0);
    setError(null);
    setIsPlaying(false);
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

  const zoomIn = useCallback(
    () => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2))),
    [],
  );
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2))),
    [],
  );
  const resetZoom = useCallback(() => setScale(1.0), []);

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
    openFile,
    closeFile,
    onDocumentLoad,
    onLoadError,
    goPrev,
    goNext,
    zoomIn,
    zoomOut,
    resetZoom,
    togglePlay,
    stopPlay,
    setIntervalSec,
  };
}
