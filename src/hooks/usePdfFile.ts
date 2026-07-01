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
  }, []);

  const closeFile = useCallback(() => {
    setFile(null);
    setNumPages(0);
    setPageNumber(1);
    setScale(1.0);
    setError(null);
  }, []);

  const onDocumentLoad = useCallback((total: number) => {
    setNumPages(total);
  }, []);

  const onLoadError = useCallback((e: Error) => {
    setError(`読み込みに失敗しました: ${e.message}`);
  }, []);

  const goPrev = useCallback(
    () => setPageNumber((p) => Math.max(1, p - 1)),
    [],
  );
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

  return {
    file,
    numPages,
    pageNumber,
    scale,
    error,
    openFile,
    closeFile,
    onDocumentLoad,
    onLoadError,
    goPrev,
    goNext,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
