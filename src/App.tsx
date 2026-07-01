import "./pdfWorker";
import { useEffect } from "react";
import { DropZone } from "./components/DropZone";
import { Toolbar } from "./components/Toolbar";
import { PdfViewer } from "./components/PdfViewer";
import { usePdfFile } from "./hooks/usePdfFile";

export default function App() {
  const pdf = usePdfFile();

  // ファイルを開いている間だけ ← / → でページ遷移
  useEffect(() => {
    if (!pdf.file) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // 入力欄にフォーカスがあるときは無視
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        pdf.goPrev();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        pdf.goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pdf.file, pdf.goPrev, pdf.goNext]);

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
            onLoad={pdf.onDocumentLoad}
            onError={pdf.onLoadError}
          />
        )}
      </DropZone>
    </div>
  );
}
