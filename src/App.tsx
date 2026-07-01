import "./pdfWorker";
import { useEffect } from "react";
import { DropZone } from "./components/DropZone";
import { PdfViewer } from "./components/PdfViewer";
import { Toolbar } from "./components/Toolbar";
import { usePdfFile } from "./hooks/usePdfFile";

export default function App() {
  const pdf = usePdfFile();
  const { file, isPlaying, pageNumber, numPages, intervalSec, goPrev, goNext, stopPlay } = pdf;

  // ファイルを開いている間だけ ← / → でページ遷移
  useEffect(() => {
    if (!file) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // フォーム要素にフォーカスがあるときは無視（矢印キーを奪わない）
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [file, goPrev, goNext]);

  // 自動ページ送り: 再生中は intervalSec ごとに次ページへ。最終ページで停止
  useEffect(() => {
    if (!file || !isPlaying) return;
    if (numPages && pageNumber >= numPages) {
      stopPlay();
      return;
    }
    const id = setTimeout(() => goNext(), intervalSec * 1000);
    return () => clearTimeout(id);
  }, [file, isPlaying, pageNumber, numPages, intervalSec, goNext, stopPlay]);

  return (
    <div className="app">
      {pdf.file && (
        <Toolbar
          fileName={pdf.file.name}
          pageNumber={pdf.pageNumber}
          numPages={pdf.numPages}
          scale={pdf.scale}
          onPrev={pdf.goPrev}
          onNext={pdf.goNext}
          onZoomIn={pdf.zoomIn}
          onZoomOut={pdf.zoomOut}
          onResetZoom={pdf.resetZoom}
          fitWidth={pdf.fitWidth}
          onFitWidth={pdf.toggleFitWidth}
          isPlaying={pdf.isPlaying}
          intervalSec={pdf.intervalSec}
          onTogglePlay={pdf.togglePlay}
          onChangeInterval={pdf.setIntervalSec}
          onClose={pdf.closeFile}
        />
      )}

      {pdf.error && <div className="app__error">{pdf.error}</div>}

      <DropZone onFile={pdf.openFile} empty={!pdf.file}>
        {pdf.file && (
          <PdfViewer
            file={pdf.file}
            pageNumber={pdf.pageNumber}
            scale={pdf.scale}
            fitWidth={pdf.fitWidth}
            onLoad={pdf.onDocumentLoad}
            onError={pdf.onLoadError}
            onFitScale={pdf.reportFitScale}
          />
        )}
      </DropZone>
    </div>
  );
}
